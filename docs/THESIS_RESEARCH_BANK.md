# Pulsefy Thesis — Research Bank

> Verified citations, numbers, and methodology references gathered on **2026-05-05**. Every entry below was retrieved with WebFetch by a research agent. Entries marked `[UNVERIFIED]` could not be fetched directly and need a manual check before they go into the final References list.
>
> **How to use this file:** when drafting a chapter, search this file by the "Where to use" column for the relevant section. Copy the citation skeleton at the bottom into the Word References list, renumbering as you go. Re-verify any URL the day before submission — vendor pages move.

---

## Section A — Streaming industry stats (Ch 1 + Ch 2.2.1 Spotify)

| # | Topic | Source (APA) | URL | Key fact / number | Where to use |
|---|---|---|---|---|---|
| A1 | Spotify Q1 2026 — MAU & subscribers | Spotify. (2026, April 28). *Spotify reports first quarter 2026 earnings*. Spotify Newsroom. | https://newsroom.spotify.com/2026-04-28/spotify-q1-2026-earnings/ | 761 M MAU (+12% YoY); 293 M Premium subscribers (+9% YoY); revenue €4.5 B (+14% YoY constant currency); operating margin 15.8% | Ch 1 (scale of incumbent); Ch 2.2.1 opening paragraph |
| A2 | Spotify paid ratio | Variety / Spotify Q1 2026 release (cross-confirmed) | https://variety.com/2026/music/news/spotify-q1-2026-earnings-revenue-total-premium-subscribers-1236731842/ | Paid ratio ≈ 293/761 ≈ 38.5% Premium of total MAU | Ch 1 freemium model context |
| A3 | Discover Weekly engagement (10-yr milestone) | Spotify. (2025, June 30). *Discover Weekly turns 10*. Spotify Newsroom. | https://newsroom.spotify.com/2025-06-30/discover-weekly-turns-10-celebrating-100-billion-tracks-streamed-and-a-decade-of-personalized-discovery/ | 100 B+ tracks streamed since 2015; 56 M new artist discoveries per week; 77% from emerging artists | Ch 2.2.1 — recommendation value demonstration |
| A4 | Discover Weekly historical (2.3 B hours) | Spotify. (2020, July 9). *Spotify users have spent over 2.3 billion hours streaming Discover Weekly playlists since 2015*. Spotify Newsroom. | https://newsroom.spotify.com/2020-07-09/spotify-users-have-spent-over-2-3-billion-hours-streaming-discover-weekly-playlists-since-2015/ | 2.3 B listening hours (2015–2020); DW users stream 2× longer than non-DW users | Ch 2.2.1 — older but officially Spotify-published longitudinal stat |
| A5 | Spotify recommendation engine (BaRT) | McInerney, J., Lacker, B., Hansen, S., Higley, K., Bouchard, H., Gruson, A., & Mehrotra, R. (2018). *Explore, exploit, explain: Personalizing explainable recommendations with bandits*. ACM RecSys 2018. | https://static1.squarespace.com/static/5ae0d0b48ab7227d232c2bea/t/5ba849e3c83025fa56814f45/1537755637453/BartRecSys.pdf | Contextual-bandit recommender powering Spotify Home; explore-exploit-explain framework | Ch 2.2.1 — technical sub-paragraph on Spotify Home generation |
| A6 | Catalog upload rate (~100 K/day, 2022) | Stassen, M. (2022, October 6). *It's happened: 100,000 tracks are now being uploaded to streaming services every day*. Music Business Worldwide. | https://www.musicbusinessworldwide.com/its-happened-100000-tracks-are-now-being-uploaded/ | 100 K tracks/day uploaded across DSPs (cited by Lucian Grainge UMG and Steve Cooper WMG, 2022) | Ch 1 discoverability problem motivating Pulsefy |
| A7 | Catalog upload rate (~120 K/day, 2024–25) | Stassen, M. (2024). *There are now 120,000 new tracks hitting music streaming services each day*. Music Business Worldwide. | https://www.musicbusinessworldwide.com/there-are-now-120000-new-tracks-hitting-music-streaming-services-each-day/ | ≈106 K–120 K new tracks/day (Luminate 2025 avg: 106 K) | Ch 1 — pair with A6 for trend |
| A8 | YouTube Music + Premium subscribers | Mohan, N. (2024, February 1). *Crossing 100 million YouTube Music and Premium subscribers, thanks to you*. YouTube Official Blog. | https://blog.youtube/news-and-events/youtube-music-premium-100-million-subscribers/ | 100 M+ subscribers (incl. trials), Jan 2024 | Ch 1 competitive landscape |
| A9 | YouTube Music + Premium subscribers (updated) | Spangler, T. (2025, March). *YouTube: 125 million Music & Premium subscribers, Lite launched in US*. Variety. | https://variety.com/2025/digital/news/youtube-125-million-music-premium-subscribers-lite-tier-1236328177/ | 125 M subscribers worldwide (Mar 2025) | Ch 1 most recent figure |
| A10 | Apple Music subscribers | Apple. (2026, April). *Apple reports second quarter results*. | https://www.apple.com/newsroom/2026/04/apple-reports-second-quarter-results/ | `[UNVERIFIED — needs source]` Apple does NOT publicly disclose Apple Music subscriber count. Q2 FY2026 only reports aggregate Services revenue ($30.98 B). | Ch 1 — note explicitly that Apple does not disclose; cite Services revenue instead |
| A11 | Global recorded music market | IFPI. (2026, March). *Global Music Report 2026*. | https://www.ifpi.org/global-music-report-2026-global-recorded-music-revenues-grow-6-4-as-record-companies-drive-innovation/ | US$31.7 B global recorded music revenue (2025); +6.4% YoY (11th consecutive year of growth); 837 M paid subscription users; streaming = 69.6% of revenues | Ch 1 opening macro paragraph |
| A12 | Jamendo API & catalog | Jamendo. (n.d.). *Jamendo Developer — API v3.0 documentation*. Retrieved May 5, 2026. | https://developer.jamendo.com/v3.0 | "Hundreds of thousands of tracks"; OAuth2; free for non-commercial use; 35,000 API requests/month limit; CC licensed | Ch 2 — open-music alternative; justifies Pulsefy's CC-only catalog |
| A13 | Jamendo licensing catalog | Jamendo Licensing. (n.d.). *Our music catalog*. Retrieved May 5, 2026. | https://licensing.jamendo.com/en/catalog | `[UNVERIFIED — needs source]` Subscription from €7.99/mo; precise track count not confirmed on the page (page was sparse). Cross-references suggest "220,000 curated tracks" but unconfirmed. | Ch 2 — verify catalog size before citing |

### Quotable opening hooks (≤14 words, verifiable)

- IFPI 2026: *"Global recorded music revenues grew 6.4% [...] reaching US$31.7 billion."* → Ch 1 first sentence
- Spotify Newsroom 2025: *"Discover Weekly [...] over 100 billion tracks streamed."* → Ch 2.2.1 epigraph
- Lucian Grainge (UMG, 2022, via MBW): *"100,000 tracks were now being added to music platforms every day."* → Ch 1 problem statement

### Failed / partial fetches (note in thesis)

- `investors.spotify.com/financials/default.aspx` — JS-rendered. Q1 2026 numbers obtained from Spotify Newsroom directly (#A1).
- `research.atspotify.com/` — front page lists 2025–26 papers on podcast ads only; no Discover Weekly publications surfaced. BaRT paper (#A5) is the canonical recsys academic ref.
- Apple Music subscriber count — never publicly disclosed since Eddy Cue's 60 M (2019).

---

## Section B — Generative audio models + commercial competitors (Ch 2.1.2 + Ch 2.2.2-2.2.4)

| # | Topic | Source (APA-ish, with arXiv ID) | URL | Key fact | Where to use |
|---|---|---|---|---|---|
| B1 | **MusicGen (most important academic citation for entire thesis)** | Copet, J., Kreuk, F., Gat, I., Remez, T., Kant, D., Synnaeve, G., Adi, Y., & Défossez, A. (2023, June 8). *Simple and Controllable Music Generation*. arXiv:2306.05284. | https://arxiv.org/abs/2306.05284 | Single-stage transformer LM over compressed discrete tokens; eliminates cascading. Generates mono and stereo conditioned on text or melody. | Ch 2.1.2 (foundation); justification for Pulsefy's premium tier |
| B2 | MusicGen model details | Audiocraft project — MUSICGEN.md (Meta, 2024). | https://github.com/facebookresearch/audiocraft/blob/main/docs/MUSICGEN.md | 32 kHz output; checkpoints: small 300 M, medium 1.5 B, large 3.3 B params; trained on 20 K hours of licensed music; needs ≥16 GB GPU for medium | Ch 2.1.2 + Ch 5 (Pulsefy uses MusicGen-small) |
| B3 | Audiocraft repo | Meta AI / FAIR. (2023–2024). *Audiocraft* [Source code]. | https://github.com/facebookresearch/audiocraft | Code: MIT License. Model weights: CC-BY-NC 4.0. Models: MusicGen, AudioGen, EnCodec, MAGNeT. Requires Python ≥3.9, PyTorch 2.1.0 | Ch 2.1.2; licensing discussion in Ch 5 |
| B4 | MusicLM (Google, closed) | Agostinelli, A., Denk, T. I., Borsos, Z., Engel, J., Verzetti, M., Caillon, A., Huang, Q., Jansen, A., Roberts, A., Tagliasacchi, M., Sharifi, M., Zeghidour, N., & Frank, C. (2023, January 26). *MusicLM: Generating Music From Text*. arXiv:2301.11325. | https://arxiv.org/abs/2301.11325 | Hierarchical seq-to-seq at 24 kHz, multi-minute coherence; conditions on text + hummed melody. Released MusicCaps dataset (5.5 K text-music pairs). Note: model never publicly released. | Ch 2.1.2 (state of the art before MusicGen) |
| B5 | AudioLDM (latent diffusion) | Liu, H., Chen, Z., Yuan, Y., Mei, X., Liu, X., Mandic, D., Wang, W., & Plumbley, M. D. (2023). *AudioLDM: Text-to-Audio Generation with Latent Diffusion Models*. arXiv:2301.12503. | https://arxiv.org/abs/2301.12503 | Latent diffusion conditioned on CLAP embeddings; trained on AudioCaps; SOTA text-to-audio at release | Ch 2.1.2 (diffusion lineage) |
| B6 | AudioLDM 2 | Liu, H., Yuan, Y., Liu, X., Mei, X., Kong, Q., Tian, Q., Wang, Y., Wang, W., Wang, Y., & Plumbley, M. D. (2023). *AudioLDM 2: Learning Holistic Audio Generation with Self-supervised Pretraining*. arXiv:2308.05734. | https://arxiv.org/abs/2308.05734 | Unified speech/music/SFX framework using "Language of Audio" representation; latent diffusion conditioned on LOA via GPT-2. Accepted IEEE/ACM TASLP. | Ch 2.1.2 (unified audio generation) |
| B7 | Stable Audio 2.0 | Stability AI. (2024, April 3). *Stable Audio 2.0* [Press release]. | https://stability.ai/news-updates/stable-audio-2-0 | Latent diffusion + diffusion transformer (DiT) + highly compressed autoencoder; 180 s coherent tracks at 44.1 kHz stereo; trained on AudioSparx 800 K+ files (artists could opt out) | Ch 2.1.2 (diffusion SOTA), Ch 2.2 (commercial bridge) |
| B8 | **Suno (Ch 2.2.2 anchor)** | Suno, Inc. (2026). *Suno — Make any song you can imagine*. | https://suno.com/ | Closed-source. Marketed as "world's best music model"; current product version v5.5. Press coverage: Billboard, Rolling Stone, Variety, Wired. No technical disclosure of training data on landing page | Ch 2.2.2 opener |
| B9 | Suno pricing tiers | Suno, Inc. (2026). *Suno Pricing*. | https://suno.com/pricing | Free: 50 credits/day (~10 songs), v4.5-all only. Pro: $8/mo, up to 500 songs/mo. Premier: $24/mo, up to 2 000 songs/mo. Paid tiers expose v4, v4.5, v4.5+, v5, v5.5 | Ch 2.2.2 main comparison anchor |
| B10 | Udio (Ch 2.2 alternative) | Udio. (2026). *Udio — AI Music Generator*. | https://www.udio.com/ | Product exists, positioned as AI music generator. `[UNVERIFIED via fetch]` for tier specifics — pricing page is JS-rendered | Ch 2.2 — verify tiers manually before submission |
| B11 | **ElevenLabs Music (Ch 2.2.3)** | ElevenLabs. (2026). *Eleven Music*. | https://elevenlabs.io/music | "Studio-grade AI engine built from high-quality stems, 44.1 kHz audio." Multi-language (EN/ES/FR/DE/JA), commercial use on paid tiers, fine-tuning by uploading custom tracks | Ch 2.2.3 closed-source comparison |
| B12 | ElevenLabs pricing | ElevenLabs. (2026). *Pricing*. | https://elevenlabs.io/pricing | Free: 10 K credits/mo (incl. Music). Starter $6/mo (30 K, music commercial use). Creator $11/mo (121 K). Pro $99/mo (600 K, 44.1 kHz PCM via API) | Ch 2.2.3 price-tier comparison |
| B13 | gTTS | Durieux, P. N. (2024, November 10). *gTTS 2.5.4* [Python package]. PyPI. | https://pypi.org/project/gTTS/ | Latest version 2.5.4 (2024-11-10); MIT License. Wraps Google Translate TTS; "not affiliated with Google." Python ≥3.7 | Ch 5 voiceover pipeline |
| B14 | Pollinations.ai | Pollinations. (2026). *Pollinations* [Source code & docs]. | https://github.com/pollinations/pollinations | MIT licensed. Free public access via publishable keys; pay-as-you-go via "Pollen" credits. Image: Flux, GPT Image, Seedream, Kontext | Ch 5 scene-image pipeline |

### Caveats from Section B

- `https://www.udio.com/pricing` — 404 / JS-rendered. Re-verify Udio tier numbers manually before final.
- `https://suno.com/about` — does not disclose architecture or training data. The *absence* itself is a citable point for Ch 2.2.2.
- `https://pollinations.ai/` landing page returned no structured content; the GitHub README is the better citation source.

---

## Section C — MIR foundations + validation methodology (Ch 2.1.1 + Ch 6)

| # | Topic | Source (APA-ish) | URL | Key fact / methodology | Where to use |
|---|---|---|---|---|---|
| C1 | **Foundational MIR textbook** | Lerch, A. (2023). *An Introduction to Audio Content Analysis: Music Information Retrieval Tasks and Applications* (2nd ed.). Wiley/IEEE Press. ISBN-13: 978-1-119-89094-2. | https://www.audiocontentanalysis.org/ ; https://ieeexplore.ieee.org/book/9965970 | 2nd ed. (2023); companion site provides Python (pyACA), C++, Matlab implementations. Covers signal processing + ML for MIR | Ch 2.1.1 — primary canonical citation |
| C2 | DL-for-MIR tutorial | Choi, K., Fazekas, G., Cho, K., & Sandler, M. (2017). *A Tutorial on Deep Learning for Music Information Retrieval*. arXiv:1709.04396. | https://arxiv.org/abs/1709.04396 | Tutorial covering CNN/RNN architectures used in MIR | Ch 2.1.1 — transition from hand-crafted features to DL |
| C3 | Self-supervised music embeddings (MERT) | Li, Y., Yuan, R., Zhang, G., et al. (2024). *MERT: Acoustic Music Understanding Model with Large-Scale Self-supervised Training*. arXiv:2306.00107 (ICLR 2024). | https://arxiv.org/abs/2306.00107 | Masked-LM SSL with RVQ-VAE + CQT teachers; 95M-330M params; SOTA on 14 music understanding tasks | Ch 2.1.1 — modern audio embedding example |
| C4 | Contrastive language-audio (CLAP) | Wu, Y., Chen, K., Zhang, T., et al. (2023). *Large-scale Contrastive Language-Audio Pretraining*. arXiv:2211.06687 (ICASSP 2023). | https://arxiv.org/abs/2211.06687 | LAION-CLAP; ~630k audio-text pairs; cross-modal contrastive learning | Ch 2.1.1 — embedding-based music search/tagging |
| C5 | Music representation learning (MULE) | McCallum, M. C., Korzeniowski, F., Oramas, S., Gouyon, F., & Ehmann, A. (2022). *Supervised and Unsupervised Learning of Audio Representations for Music Understanding*. arXiv:2210.03799 (ISMIR 2022). | https://arxiv.org/abs/2210.03799 | Pandora/SiriusXM commercial-scale embedding; compares supervised vs SSL | Ch 2.1.1 — industry-grade music embeddings |
| C6 | Music recommender survey | Schedl, M., Zamani, H., Chen, C.-W., Deldjoo, Y., & Elahi, M. (2018). Current challenges and visions in music recommender systems research. *International Journal of Multimedia Information Retrieval*, 7(2), 95-116. DOI: 10.1007/s13735-018-0154-2. | https://link.springer.com/article/10.1007/s13735-018-0154-2 | Surveys CF, content-based, hybrid, context-aware approaches; identifies cold-start, diversity, evaluation gaps | Ch 2.1.1 / related-work |
| C7 | FMA dataset | Defferrard, M., Benzi, K., Vandergheynst, P., & Bresson, X. (2017). *FMA: A Dataset For Music Analysis*. arXiv:1612.01840 (ISMIR 2017). | https://arxiv.org/abs/1612.01840 | 106,574 CC-licensed tracks, 16,341 artists, 161-genre hierarchy, 917 GiB | Ch 2.1.1 — dataset reference for genre tagging |
| C8 | CNN music tagging benchmark | Won, M., Ferraro, A., Bogdanov, D., & Serra, X. (2020). *Evaluation of CNN-based Automatic Music Tagging Models*. arXiv:2006.00751 (SMC 2020). | https://arxiv.org/abs/2006.00751 | Consistent eval on MagnaTagATune, MSD, MTG-Jamendo; ROC-AUC / PR-AUC; perturbation robustness | Ch 2.1.1 — concrete metric values |
| C9 | Davis & Mermelstein MFCC | Davis, S. B., & Mermelstein, P. (1980). Comparison of parametric representations for monosyllabic word recognition in continuously spoken sentences. *IEEE Trans. on Acoustics, Speech, and Signal Processing*, 28(4), 357-366. DOI: 10.1109/TASSP.1980.1163420. | https://ieeexplore.ieee.org/document/1163420 | `[UNVERIFIED — IEEE returned Cloudflare error]` Foundational MFCC paper. Verify via Lerch 2023 bibliography. | Ch 2.1.1 — original MFCC citation |
| C10 | GTZAN dataset | Tzanetakis, G., & Cook, P. (2002). Musical genre classification of audio signals. *IEEE Trans. on Speech and Audio Processing*, 10(5), 293-302. DOI: 10.1109/TSA.2002.800560. | https://ieeexplore.ieee.org/document/1021072 | `[UNVERIFIED — IEEE error]` Introduces GTZAN (10 genres × 100 30-second clips = 1000 tracks) | Ch 2.1.1 — historic genre benchmark |
| C11 | **MUSHRA standard (Ch 6 main)** | ITU-R. (2015). *Recommendation BS.1534-3: Method for the subjective assessment of intermediate quality level of audio systems*. ITU, Geneva. | https://www.itu.int/rec/R-REC-BS.1534-3-201510-I/en | Hidden reference, hidden anchors (3.5 kHz & 7 kHz low-pass), 0-100 continuous scale, recommends ≥20 listeners post-screening | Ch 6 — listening study protocol |
| C12 | MOS standard | ITU-T. (1996). *Recommendation P.800: Methods for subjective determination of transmission quality*. | https://www.itu.int/rec/T-REC-P.800-199608-I/en | 5-point absolute category rating (1=Bad … 5=Excellent); MOS = arithmetic mean | Ch 6 — overall-quality scale |
| C13 | **Fréchet Audio Distance (FAD)** | Kilgour, K., Zuluaga, M., Roblek, D., & Sharifi, M. (2019). Fréchet Audio Distance: A Reference-free Metric for Evaluating Music Enhancement Algorithms. arXiv:1812.08466 (Interspeech 2019). | https://arxiv.org/abs/1812.08466 | Reference-free metric; correlation with human perception r=0.52 (vs SDR r=0.39, cosine r=-0.15, L2 r=-0.01). Computes Fréchet distance over VGGish embeddings | Ch 6 — automatic objective metric |
| C14 | MusicGen as listening-study precedent | Copet et al. (2023). arXiv:2306.05284 (already cited as B1) | https://arxiv.org/abs/2306.05284 | Combines automatic metrics (FAD, KL, CLAP score) with human studies for overall quality and text-relevance | Ch 6 — methodology precedent |
| C15 | **MLPerf inference benchmarking** | Reddi, V. J., Cheng, C., Kanter, D., Mattson, P., et al. (2020). *MLPerf Inference Benchmark*. arXiv:1911.02549 (ISCA 2020). | https://arxiv.org/abs/1911.02549 | Reproducible ML inference benchmarking: warm-up, fixed input distributions, latency tail percentiles, single-stream vs offline | Ch 6 — latency/throughput methodology citation |

---

## Recommended Ch 6 validation methodology (defensible given no production deployment)

A research-defensible Ch 6 for Pulsefy combines three independent evidence streams. None alone is conclusive; together they support the system claims.

1. **Triangulate three streams** — frame the design as "convergent evidence" drawing on the MusicGen evaluation template (B1 / C14):
   - Automatic objective metrics
   - Small-N subjective listening study
   - Deterministic system-capacity benchmarks

2. **Subjective study (N=15) — hybrid MUSHRA-lite + MOS protocol.** ITU-R BS.1534-3 (C11) recommends ≥20 listeners post-screening, so 15 is below threshold — frame it as an **exploratory pilot** rather than definitive evaluation. Use 5–7 stimuli covering 2–3 prompt categories. For each: collect a 0–100 MUSHRA-style overall quality score AND a 5-point MOS for prompt-relevance. Report mean ± 95% CI (bootstrap, since N is small). Acknowledge that with N=15 only large effects (Cohen's d ≥ 0.8) are detectable at α=0.05.

3. **Inter-rater agreement.** Report Krippendorff's α (or ICC(2,1) for ratio scales). Caveat: with N=15 and few stimuli, agreement estimates are themselves noisy.

4. **Objective metrics — compute FAD against a reference distribution** (FMA-medium or genre subset) using VGGish-based FAD (C13). If feasible, also CLAP-score (text-audio alignment) using LAION-CLAP (C4). Frame as proxies, not ground truth — Kilgour reports human-FAD correlation r=0.52 only.

5. **Latency / throughput — MLPerf-style discipline** (C15): report p50 / p95 / p99 separately for cold-start vs warm-cache, separate single-request vs small-batch, fix random seed and prompt set, ≥30 trials per condition, disclose hardware (CPU/GPU model, RAM, OS) and model precision (fp32/fp16/int8). Do not report mean-only — the tail matters for UX.

6. **Be explicit about limits.** A 15-listener pilot + offline benchmarks cannot establish: real-user retention, A/B preference vs Suno/Udio at scale, production reliability. State this in a "threats to validity" subsection. The defensible claim is: *Pulsefy outputs are not statistically distinguishable from a credible baseline on this pilot, and latency targets are met under specified conditions.*

---

## Citation skeletons ready to drop into References [N]

Format matches the IARCA `[N] Author(s). (Year, Month Day). Title. Source. URL` pattern. Renumber when assembling the final list.

```
[N] Spotify. (2026, April 28). Spotify reports first quarter 2026 earnings. Spotify Newsroom. https://newsroom.spotify.com/2026-04-28/spotify-q1-2026-earnings/

[N] IFPI. (2026, March). Global Music Report 2026: Global recorded music revenues grow 6.4%. International Federation of the Phonographic Industry. https://www.ifpi.org/global-music-report-2026-global-recorded-music-revenues-grow-6-4-as-record-companies-drive-innovation/

[N] Stassen, M. (2022, October 6). It's happened: 100,000 tracks are now being uploaded to streaming services every day. Music Business Worldwide. https://www.musicbusinessworldwide.com/its-happened-100000-tracks-are-now-being-uploaded/

[N] Spotify. (2025, June 30). Discover Weekly turns 10. Spotify Newsroom. https://newsroom.spotify.com/2025-06-30/discover-weekly-turns-10-celebrating-100-billion-tracks-streamed-and-a-decade-of-personalized-discovery/

[N] McInerney, J., Lacker, B., Hansen, S., Higley, K., Bouchard, H., Gruson, A., & Mehrotra, R. (2018). Explore, exploit, explain: Personalizing explainable recommendations with bandits. Proceedings of the 12th ACM Conference on Recommender Systems. https://static1.squarespace.com/static/5ae0d0b48ab7227d232c2bea/t/5ba849e3c83025fa56814f45/1537755637453/BartRecSys.pdf

[N] Copet, J., Kreuk, F., Gat, I., Remez, T., Kant, D., Synnaeve, G., Adi, Y., & Défossez, A. (2023, June 8). Simple and controllable music generation. arXiv preprint arXiv:2306.05284. https://arxiv.org/abs/2306.05284

[N] Meta AI. (2024). Audiocraft: A library for audio generation research [Source code]. GitHub. https://github.com/facebookresearch/audiocraft

[N] Agostinelli, A., Denk, T. I., Borsos, Z., Engel, J., Verzetti, M., Caillon, A., Huang, Q., Jansen, A., Roberts, A., Tagliasacchi, M., Sharifi, M., Zeghidour, N., & Frank, C. (2023, January 26). MusicLM: Generating music from text. arXiv preprint arXiv:2301.11325. https://arxiv.org/abs/2301.11325

[N] Liu, H., Chen, Z., Yuan, Y., Mei, X., Liu, X., Mandic, D., Wang, W., & Plumbley, M. D. (2023, January 29). AudioLDM: Text-to-audio generation with latent diffusion models. arXiv preprint arXiv:2301.12503. https://arxiv.org/abs/2301.12503

[N] Stability AI. (2024, April 3). Stable Audio 2.0 [Press release]. Stability AI. https://stability.ai/news-updates/stable-audio-2-0

[N] Suno, Inc. (2026). Suno pricing. Suno. Retrieved May 5, 2026, from https://suno.com/pricing

[N] ElevenLabs. (2026). Eleven Music. Retrieved May 5, 2026, from https://elevenlabs.io/music

[N] Lerch, A. (2023). An introduction to audio content analysis: Music information retrieval tasks and applications (2nd ed.). Wiley/IEEE Press.

[N] Choi, K., Fazekas, G., Cho, K., & Sandler, M. (2017, September 13). A tutorial on deep learning for music information retrieval. arXiv preprint arXiv:1709.04396. https://arxiv.org/abs/1709.04396

[N] Schedl, M., Zamani, H., Chen, C.-W., Deldjoo, Y., & Elahi, M. (2018). Current challenges and visions in music recommender systems research. International Journal of Multimedia Information Retrieval, 7(2), 95-116. https://link.springer.com/article/10.1007/s13735-018-0154-2

[N] Defferrard, M., Benzi, K., Vandergheynst, P., & Bresson, X. (2017, December 6). FMA: A dataset for music analysis. arXiv preprint arXiv:1612.01840. https://arxiv.org/abs/1612.01840

[N] ITU-R. (2015). Recommendation BS.1534-3: Method for the subjective assessment of intermediate quality level of audio systems. International Telecommunication Union, Geneva. https://www.itu.int/rec/R-REC-BS.1534-3-201510-I/en

[N] ITU-T. (1996, August). Recommendation P.800: Methods for subjective determination of transmission quality. International Telecommunication Union, Geneva. https://www.itu.int/rec/T-REC-P.800-199608-I/en

[N] Kilgour, K., Zuluaga, M., Roblek, D., & Sharifi, M. (2019). Fréchet audio distance: A reference-free metric for evaluating music enhancement algorithms. Proceedings of Interspeech 2019. https://arxiv.org/abs/1812.08466

[N] Reddi, V. J., Cheng, C., Kanter, D., Mattson, P., et al. (2020). MLPerf inference benchmark. Proceedings of the 47th International Symposium on Computer Architecture (ISCA). https://arxiv.org/abs/1911.02549

[N] Jamendo. (n.d.). Jamendo Developer — API v3.0 documentation. Retrieved May 5, 2026, from https://developer.jamendo.com/v3.0
```

---

## Outstanding TODO before final submission

- Verify Apple Music subscriber number (or note "not publicly disclosed" — A10).
- Verify Jamendo licensing catalog size (A13).
- Re-fetch Udio pricing page once it's no longer JS-only (B10).
- Verify Davis & Mermelstein 1980 and Tzanetakis & Cook 2002 IEEE entries via Lerch (2023) bibliography (C9, C10).
- Re-check all URLs the day before submission — vendor pages move and break.
