"""
LSTM-based language model for symbolic music generation.

What is symbolic music generation?
----------------------------------
We model music at the *symbolic* level (notes, durations, rests) rather than
at the audio waveform level. Each musical event becomes one or two tokens
from a small discrete vocabulary; the model learns the joint distribution
over sequences of these tokens. To produce audible output we then synthesise
each generated note with a simple additive sine-plus-harmonics oscillator
(see ``generate.py``). This factoring — neural composition + procedural
synthesis — keeps the learning problem tractable on a student-laptop budget
while still producing recognisably musical output.

The language-model formulation
------------------------------
Given a token sequence ``x_1, x_2, ..., x_T`` we factorise the joint via the
chain rule of probability:

    P(x_1, x_2, ..., x_T) = prod_{t=1..T}  P(x_t | x_1, ..., x_{t-1})

The model approximates each conditional with a neural net that maps the
context to a categorical distribution over the vocabulary. Training maximises
the log-likelihood of the corpus, which is equivalent to minimising the
average cross-entropy. At inference time we sample autoregressively from the
learned conditionals.

Why LSTM rather than Transformer?
---------------------------------
Transformers are state-of-the-art for large-scale text and music modelling
(MusicGen, MuseNet, Music Transformer). For an undergraduate thesis, however,
the LSTM has several decisive advantages:

  1. *Trainable on a laptop.* An LSTM with hidden_dim=256 and 2 layers has
     ~1.1M parameters and trains to convergence in tens of minutes on Apple
     MPS or CPU. A comparably-capable Transformer needs significantly more
     compute due to the O(L^2) attention cost.

  2. *Pedagogically transparent.* Each LSTM cell has well-known, named
     internal gates (input, forget, cell, output). The flow of information
     through time is easy to draw on a whiteboard and explain to a
     commission, which is exactly what a defendable thesis needs.

  3. *Good enough for melodic music.* On small-vocabulary symbolic corpora
     (Nottingham folk, MAESTRO subsets, etc.), LSTMs produce coherent local
     melodies. The known weakness — long-range structural coherence over
     many bars — is masked here because we generate only ~8-30 seconds of
     audio per request.

  4. *Stable training behaviour.* With gradient clipping, LSTMs are very
     forgiving of hyperparameter choices, so we don't need a learning-rate
     warmup schedule or the other tricks Transformers require.

Architecture overview
---------------------
::

    x : (B, L)  long-tensor of token IDs
        |
        v
    Embedding(vocab_size, embed_dim)
        |   (B, L, embed_dim)
        v
    LSTM(embed_dim -> hidden_dim, num_layers=2, dropout=0.3 between layers)
        |   (B, L, hidden_dim)
        v
    Dropout(p=0.3)
        |
        v
    Linear(hidden_dim -> vocab_size)
        |   (B, L, vocab_size)  -- logits, softmax applied externally
        v
    [CrossEntropyLoss during training, sampling during generation]

The hidden state ``(h_n, c_n)`` is reset to zero at the start of every
training batch (stateless training) but carried across tokens during
inference (stateful generation), so the model can produce arbitrarily long
sequences without losing context.
"""
from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

import torch
import torch.nn as nn
import torch.nn.functional as F

if TYPE_CHECKING:  # avoid circular import at runtime
    from .vocab import Vocabulary


# Internal default for top-k sampling. Documented at the call site.
_DEFAULT_TOP_K = 10


class MusicLSTM(nn.Module):
    """Causal language model for music tokens, built around ``nn.LSTM``.

    The architecture is intentionally small. With the defaults
    (embed_dim=64, hidden_dim=256, num_layers=2) the model has roughly:

        embed:   164 * 64                         = 10,496
        lstm 1:  4 * (64+256+1) * 256             = 329,728  (input gate, forget gate, cell, output gate)
        lstm 2:  4 * (256+256+1) * 256            = 525,312
        out:     256 * 164 + 164                  = 42,148
                                                    --------
                                                    907,684 trainable parameters

    Small enough to fit comfortably in <10 MB on disk and to train end-to-end
    in a few minutes per epoch on a MacBook Pro M-series.

    The hidden state ``(h, c)`` carries information across time steps within
    a single forward call. During training we discard the final hidden state
    after each batch (the typical "stateless LSTM" setup, which keeps batches
    independent and avoids cross-batch coupling that complicates shuffling).
    During generation we explicitly feed the final hidden state of one step
    as the initial hidden state of the next so the model has full context.
    """

    def __init__(
        self,
        vocab_size: int,
        embed_dim: int = 64,
        hidden_dim: int = 256,
        num_layers: int = 2,
        dropout: float = 0.3,
    ):
        """Build the model.

        Parameters
        ----------
        vocab_size
            Size of the token vocabulary. Should equal
            ``Vocabulary.VOCAB_SIZE`` (164 for Pulsefy's vocab).
        embed_dim
            Width of the learned token embeddings. 64 is enough for ~164
            tokens — there is no reason to allocate a 512-d vector for what
            amounts to a small categorical alphabet.
        hidden_dim
            Width of each LSTM hidden/cell state. 256 hits a sweet spot
            between capacity (can learn melodic patterns) and sample
            efficiency (does not overfit on a few thousand training windows).
        num_layers
            Stacked LSTM depth. Two layers let the lower layer specialise on
            local note transitions and the upper layer on phrase-level
            structure. Going deeper without more data overfits quickly.
        dropout
            Applied between LSTM layers (PyTorch's built-in inter-layer
            dropout) AND once more before the output projection. We use the
            same probability in both places for simplicity; 0.3 is a
            standard, conservative value for small RNNs.
        """
        super().__init__()
        self.vocab_size = vocab_size
        self.embed_dim = embed_dim
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.dropout_p = dropout

        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            # PyTorch only applies inter-layer dropout when num_layers > 1.
            dropout=dropout if num_layers > 1 else 0.0,
            batch_first=True,
        )
        self.dropout = nn.Dropout(dropout)
        self.output = nn.Linear(hidden_dim, vocab_size)

    # ----- core forward -------------------------------------------------------

    def forward(
        self,
        x: torch.Tensor,
        hidden: tuple[torch.Tensor, torch.Tensor] | None = None,
    ) -> tuple[torch.Tensor, tuple[torch.Tensor, torch.Tensor]]:
        """Run a forward pass.

        Parameters
        ----------
        x
            LongTensor of token IDs, shape ``(batch_size, seq_len)``.
        hidden
            Optional ``(h_0, c_0)`` initial hidden state. If ``None``, PyTorch
            initialises it to zeros internally. Pass an explicit hidden state
            for autoregressive generation across multiple ``forward`` calls.

        Returns
        -------
        logits
            Unnormalised scores, shape ``(batch_size, seq_len, vocab_size)``.
            We deliberately do *not* apply softmax here — the loss function
            (``CrossEntropyLoss``) expects raw logits, and the generation
            sampler applies softmax once after temperature scaling.
        hidden
            Final ``(h_n, c_n)`` for chaining into the next step.
        """
        embedded = self.embedding(x)                # (B, L, E)
        lstm_out, hidden = self.lstm(embedded, hidden)  # (B, L, H)
        lstm_out = self.dropout(lstm_out)
        logits = self.output(lstm_out)              # (B, L, V)
        return logits, hidden

    def init_hidden(
        self, batch_size: int, device: torch.device
    ) -> tuple[torch.Tensor, torch.Tensor]:
        """Return zero-initialised ``(h_0, c_0)`` of the correct shape.

        Shape is ``(num_layers, batch_size, hidden_dim)`` for both tensors,
        per the ``nn.LSTM`` convention.
        """
        h0 = torch.zeros(self.num_layers, batch_size, self.hidden_dim, device=device)
        c0 = torch.zeros(self.num_layers, batch_size, self.hidden_dim, device=device)
        return h0, c0

    # ----- generation ---------------------------------------------------------

    @torch.no_grad()
    def generate(
        self,
        seed_tokens: list[int],
        max_new_tokens: int,
        temperature: float,
        vocab: "Vocabulary",
        device: torch.device | str,
        top_k: int = _DEFAULT_TOP_K,
    ) -> list[int]:
        """Autoregressively sample new tokens, one at a time.

        Algorithm
        ---------
        1. Move the model to ``device`` and switch to ``eval`` mode (disables
           dropout so sampling is deterministic given the RNG state).
        2. Feed the seed tokens through the LSTM in a single forward call to
           warm up the hidden state ``(h, c)``.
        3. Loop, emitting one token per iteration:
           a. Feed only the most recent token through the model, reusing the
              hidden state from the previous iteration.
           b. Take the logits for the *last* time step (shape ``(V,)``).
           c. Apply temperature: ``logits = logits / temperature``.
              Lower temperature sharpens the distribution (more
              deterministic), higher temperature flattens it (more random).
           d. Apply top-k truncation: keep only the ``top_k`` largest logits
              and set the rest to -infinity. This is a standard
              hallucination-suppression trick from text generation; without
              it the long tail of low-probability tokens occasionally fires
              and produces musically nonsensical jumps.
           e. Softmax to a probability vector and sample one token.
           f. Append to the sequence and stop early if it equals
              ``vocab.END``.

        Parameters
        ----------
        seed_tokens
            Initial tokens to condition on. Should usually start with
            ``vocab.START`` followed by a few pitch+duration pairs reflecting
            the desired key/style.
        max_new_tokens
            Hard cap on tokens generated *beyond* the seed.
        temperature
            Sampling temperature. The musically interesting band is
            ``0.5 .. 1.2``: below 0.5 the output collapses into a single
            repeated phrase, above 1.2 the model loses tonal coherence.
        vocab
            Vocabulary instance, used only to recognise the END token.
        device
            Torch device to run inference on.
        top_k
            Number of most-probable tokens to retain at each step. ``10`` is
            a robust default; setting ``top_k=vocab.VOCAB_SIZE`` disables
            truncation.

        Returns
        -------
        list[int]
            ``seed_tokens`` followed by all newly generated tokens (END
            included if the model emitted it).
        """
        device = torch.device(device) if not isinstance(device, torch.device) else device
        self.eval()
        self.to(device)

        if not seed_tokens:
            raise ValueError("seed_tokens must contain at least one token")
        if temperature <= 0:
            raise ValueError(f"temperature must be > 0, got {temperature}")
        top_k = max(1, min(int(top_k), self.vocab_size))

        # Warm up hidden state on the entire seed in one forward call.
        seed_tensor = torch.tensor(seed_tokens, dtype=torch.long, device=device)
        seed_tensor = seed_tensor.unsqueeze(0)  # (1, len(seed))
        _, hidden = self.forward(seed_tensor, hidden=None)

        generated: list[int] = list(seed_tokens)
        last_token = generated[-1]

        for _ in range(max_new_tokens):
            x = torch.tensor([[last_token]], dtype=torch.long, device=device)
            logits, hidden = self.forward(x, hidden=hidden)
            # logits shape: (1, 1, V)  -> squeeze to (V,)
            step_logits = logits[0, -1].clone()

            # ----- temperature scaling ----------------------------------
            step_logits = step_logits / temperature

            # ----- top-k filtering --------------------------------------
            if top_k < self.vocab_size:
                topk_vals, topk_idx = torch.topk(step_logits, top_k)
                # Set everything outside the top-k to -inf so softmax zeros it.
                mask = torch.full_like(step_logits, float("-inf"))
                mask[topk_idx] = topk_vals
                step_logits = mask

            probs = F.softmax(step_logits, dim=-1)
            next_token = int(torch.multinomial(probs, num_samples=1).item())

            generated.append(next_token)
            last_token = next_token

            if next_token == vocab.END:
                break

        return generated

    # ----- diagnostics --------------------------------------------------------

    def num_parameters(self) -> int:
        """Total number of trainable parameters in the model.

        Reported by ``__repr__`` and useful for the thesis text — the parameter
        count is a fair proxy for model capacity and lets the reader compare
        against published baselines.
        """
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

    def __repr__(self) -> str:
        param_count = self.num_parameters()
        return (
            f"MusicLSTM(\n"
            f"  vocab_size = {self.vocab_size}\n"
            f"  embed_dim  = {self.embed_dim}\n"
            f"  hidden_dim = {self.hidden_dim}\n"
            f"  num_layers = {self.num_layers}\n"
            f"  dropout    = {self.dropout_p}\n"
            f"  parameters = {param_count:,}\n"
            f")"
        )

    # ----- (de)serialisation --------------------------------------------------

    def save(self, path: str | Path, extra: dict | None = None) -> None:
        """Persist the model to a self-contained ``.pt`` checkpoint.

        The checkpoint dict includes:
          * ``model_state_dict`` — every weight in the network.
          * ``config`` — every constructor argument needed to rebuild the
            model. This is what makes the checkpoint *self-describing*:
            inference code does not need to know the hyperparameters in
            advance.
          * any user-supplied keys merged from ``extra`` (training metrics,
            vocab dump, epoch number, etc.).
        """
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "model_state_dict": self.state_dict(),
            "config": {
                "vocab_size": self.vocab_size,
                "embed_dim": self.embed_dim,
                "hidden_dim": self.hidden_dim,
                "num_layers": self.num_layers,
                "dropout": self.dropout_p,
            },
        }
        if extra:
            payload.update(extra)
        torch.save(payload, path)

    @classmethod
    def load(cls, checkpoint: dict, device: str | torch.device = "cpu") -> "MusicLSTM":
        """Rebuild a ``MusicLSTM`` from a checkpoint dict produced by ``save``.

        We reconstruct the model from the embedded ``config`` rather than
        requiring the caller to know the hyperparameters. This means
        ``generate.py`` is decoupled from ``train.py`` — you can change
        defaults in training without breaking inference for old checkpoints.
        """
        if "config" not in checkpoint or "model_state_dict" not in checkpoint:
            raise ValueError(
                "Checkpoint missing 'config' or 'model_state_dict'; "
                "was it produced by MusicLSTM.save()?"
            )
        config = checkpoint["config"]
        model = cls(
            vocab_size=config["vocab_size"],
            embed_dim=config["embed_dim"],
            hidden_dim=config["hidden_dim"],
            num_layers=config["num_layers"],
            dropout=config["dropout"],
        )
        model.load_state_dict(checkpoint["model_state_dict"])
        model.to(device)
        return model
