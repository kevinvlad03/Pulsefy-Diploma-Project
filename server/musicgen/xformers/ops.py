import torch
import torch.nn.functional as F


class LowerTriangularMask:
    pass


def unbind(tensor, dim=0):
    return torch.unbind(tensor, dim=dim)


def memory_efficient_attention(q, k, v, attn_bias=None, p=0.0):
    # Minimal compatibility fallback for environments without xformers.
    # Supports shapes commonly used by Audiocraft attention:
    # [B, H, T, D] or [B, T, H, D].
    if q.dim() != 4 or k.dim() != 4 or v.dim() != 4:
        raise ValueError("Expected q/k/v tensors of rank 4")

    is_causal = isinstance(attn_bias, LowerTriangularMask)

    # Normalize to [B, H, T, D]
    if q.shape[1] != k.shape[1] and q.shape[2] == k.shape[2]:
        q = q.transpose(1, 2)
        k = k.transpose(1, 2)
        v = v.transpose(1, 2)
        transposed = True
    else:
        transposed = False

    out = F.scaled_dot_product_attention(
        q,
        k,
        v,
        attn_mask=None,
        dropout_p=float(p) if p else 0.0,
        is_causal=is_causal,
    )

    if transposed:
        out = out.transpose(1, 2)
    return out
