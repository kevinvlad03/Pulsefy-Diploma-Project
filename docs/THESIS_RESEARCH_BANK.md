# Pulsefy Thesis — Research Bank

> **Restructured 2026-05-07** after the project pivoted from a music streaming framing to an AI-assisted ad creation framing. Verified citations from the original 2026-05-05 research session that still apply have been carried forward; entries that no longer fit the new positioning have been moved to Section E (background only, not competitor list). New sections are stubbed out with `[TODO: research]` markers — every TODO names what to fetch and where to use it, so a focused research agent can fill them in without re-deriving the brief.
>
> **How to use this file:** when drafting a chapter, search by the "Where to use" column. Every URL was retrieved by an agent on the date stamped on its row; **re-fetch any URL the day before submission** because vendor pricing pages and product details move. Mark anything you re-verify with the new access date.
>
> **Hard rule:** every number that ends up in the thesis must come from a URL we actually fetched, not from training memory. Entries marked `[UNVERIFIED]` must be checked manually before they go into the References list.

---

## Section A — Short-form social video and digital ad market (Ch 1)

The new Ch 1 talks about TikTok, Instagram Reels, and YouTube Shorts as the dominant ad surface, plus the cost gap that small advertisers face. Most of this section is **`[TODO: research]`** because the original 2026-05-05 session was scoped to music streaming.

### A.1 Short-form social video platforms — `[TODO: research]`

| # | Topic | Suggested source | Where to use |
|---|---|---|---|
| A1.1 | TikTok monthly active users (global) | TikTok newsroom or ByteDance investor disclosures; cross-check with Statista or Insider Intelligence | Ch 1.1 paragraph 1 (footnote F1) |
| A1.2 | TikTok ad revenue (2025) | Insider Intelligence / eMarketer ad revenue forecast; or ByteDance Q4 2025 if disclosed | Ch 1.1 paragraph 2 (footnote F2) |
| A1.3 | Instagram Reels engagement | Meta Q4 2025 or Q1 2026 earnings call transcript; Meta For Business blog | Ch 1.1 paragraph 1 |
| A1.4 | YouTube Shorts daily views | YouTube Official Blog or Google Q1 2026 earnings call | Ch 1.1 paragraph 1 |
| A1.5 | Vertical video format adoption | eMarketer or HubSpot State of Marketing report | Ch 1.1 |

### A.2 Digital advertising market — `[TODO: research]`

| # | Topic | Suggested source | Where to use |
|---|---|---|---|
| A2.1 | Global digital ad spend (2025) | eMarketer global ad spending forecast; WARC Global Ad Trends | Ch 1.1 paragraph 2 |
| A2.2 | Social media ad spend share | eMarketer / Statista ad spend by channel | Ch 1.1 paragraph 2 |
| A2.3 | Short-form video ad spend growth rate | eMarketer / Insider Intelligence | Ch 1.1 paragraph 2 |
| A2.4 | Creator economy market size | Goldman Sachs Creator Economy report 2024–2025 | Ch 1.2 (who creates ads now) |

### A.3 Ad creation cost benchmarks — `[TODO: research]`

| # | Topic | Suggested source | Where to use |
|---|---|---|---|
| A3.1 | Small-agency campaign pricing (EU / Romania) | Clutch.co or Sortlist.com filtered to small EU studios | Ch 1.3 paragraph 1 (footnote F3) |
| A3.2 | Adobe Creative Cloud monthly subscription price (EU) | Adobe official pricing page (https://www.adobe.com/creativecloud/plans.html) | Ch 1.3 paragraph 2 (footnote F4) |
| A3.3 | Final Cut Pro / DaVinci Resolve pricing | Apple App Store (Final Cut Pro) and Blackmagic Design page (DaVinci) | Ch 1.3 paragraph 2 |
| A3.4 | Time-to-produce-an-ad benchmarks | HubSpot State of Video Marketing or Wyzowl Video Marketing Statistics | Ch 1.3 paragraph 4 |

### A.4 Music context (carried forward from 2026-05-05, lower priority for Ch 1)

These entries were the Ch 1 anchors in the music-streaming framing. They are no longer the primary anchors (Ch 1 now talks about ad creation), but they remain useful as background for any paragraph that needs to establish *streaming music exists at scale* — for example, the music-asset section of Ch 5.

| # | Topic | Source | URL | Verified | Where to use |
|---|---|---|---|---|---|
| A4.1 | Spotify Q1 2026 — MAU & subscribers | Spotify. (2026, April 28). *Spotify reports first quarter 2026 earnings*. Spotify Newsroom. | https://newsroom.spotify.com/2026-04-28/spotify-q1-2026-earnings/ | 2026-05-05 | Background context only — 761 M MAU, 293 M Premium |
| A4.2 | Global recorded music market | IFPI. (2026, March). *Global Music Report 2026*. | https://www.ifpi.org/global-music-report-2026-global-recorded-music-revenues-grow-6-4-as-record-companies-drive-innovation/ | 2026-05-05 | Background context — US$31.7 B (2025); 837 M paid subscription users; streaming = 69.6% of revenue |
| A4.3 | Jamendo API & catalog | Jamendo. (n.d.). *Jamendo Developer — API v3.0 documentation*. | https://developer.jamendo.com/v3.0 | 2026-05-05 | Ch 5 (licensed-music subsystem); justifies Pulsefy's CC-only catalog |

---

## Section B — Generative AI for ad assets (Ch 2.1)

The new Ch 2.1 has three scientific subsections, one per generative modality used by Pulsefy: text-to-image (B1), text-to-music (B2, mostly carried forward), text-to-speech (B3).

### B1 — Text-to-image diffusion models (Ch 2.1.1) — partially `[TODO]`

| # | Topic | Source | URL | Status | Where to use |
|---|---|---|---|---|---|
| B1.1 | DDPM foundational paper | Ho, J., Jain, A., & Abbeel, P. (2020). *Denoising Diffusion Probabilistic Models*. arXiv:2006.11239. | https://arxiv.org/abs/2006.11239 | `[VERIFY: agent did not fetch in this session]` | Ch 2.1.1 — diffusion model foundations |
| B1.2 | Stable Diffusion paper | Rombach, R., Blattmann, A., Lorenz, D., Esser, P., & Ommer, B. (2022). *High-Resolution Image Synthesis with Latent Diffusion Models*. arXiv:2112.10752 (CVPR 2022). | https://arxiv.org/abs/2112.10752 | `[VERIFY]` | Ch 2.1.1 — latent diffusion architecture |
| B1.3 | FLUX.1 (Black Forest Labs) | Black Forest Labs (2024). *Announcing Black Forest Labs*. | https://blackforestlabs.ai/announcing-black-forest-labs/ | `[TODO: research]` | Ch 2.1.1 — current SOTA open-weights model |
| B1.4 | Pollinations.ai endpoints and license | Pollinations. (2026). *Pollinations* [Source code & docs]. | https://github.com/pollinations/pollinations | 2026-05-05 (carried forward) | Ch 2.1.1 + Ch 5.2.3 |
| B1.5 | Imagen 2 / 3 (Google, closed) | Google DeepMind. *Imagen 3* technical page | https://deepmind.google/technologies/imagen-3/ | `[TODO: research]` | Ch 2.1.1 — closed-source comparison |
| B1.6 | DALL-E 3 (OpenAI, closed) | OpenAI. *DALL-E 3* | https://openai.com/index/dall-e-3/ | `[TODO: research]` | Ch 2.1.1 — closed-source comparison |

### B2 — Generative audio models (Ch 2.1.2) — carried forward verified

| # | Topic | Source (APA-ish) | URL | Verified | Where to use |
|---|---|---|---|---|---|
| B2.1 | **MusicGen — central thesis citation** | Copet, J., Kreuk, F., Gat, I., Remez, T., Kant, D., Synnaeve, G., Adi, Y., & Défossez, A. (2023, June 8). *Simple and Controllable Music Generation*. arXiv:2306.05284. | https://arxiv.org/abs/2306.05284 | 2026-05-05 | Ch 2.1.2 (foundation); Ch 5.2.1 (Pulsefy uses MusicGen) |
| B2.2 | MusicGen model details | Audiocraft project — MUSICGEN.md (Meta, 2024). | https://github.com/facebookresearch/audiocraft/blob/main/docs/MUSICGEN.md | 2026-05-05 | Ch 2.1.2 + Ch 5.2.1 — checkpoint sizes, training data, GPU req |
| B2.3 | Audiocraft repo | Meta AI / FAIR. (2023–2024). *Audiocraft* [Source code]. | https://github.com/facebookresearch/audiocraft | 2026-05-05 | Ch 2.1.2; license discussion in Ch 5 |
| B2.4 | MusicLM (Google, closed) | Agostinelli, A., et al. (2023). *MusicLM: Generating Music From Text*. arXiv:2301.11325. | https://arxiv.org/abs/2301.11325 | 2026-05-05 | Ch 2.1.2 (state of the art before MusicGen) |
| B2.5 | AudioLDM | Liu, H., et al. (2023). *AudioLDM: Text-to-Audio Generation with Latent Diffusion Models*. arXiv:2301.12503. | https://arxiv.org/abs/2301.12503 | 2026-05-05 | Ch 2.1.2 (diffusion lineage) |
| B2.6 | AudioLDM 2 | Liu, H., et al. (2023). *AudioLDM 2*. arXiv:2308.05734. | https://arxiv.org/abs/2308.05734 | 2026-05-05 | Ch 2.1.2 (unified audio gen) |
| B2.7 | Stable Audio 2.0 | Stability AI. (2024, April 3). *Stable Audio 2.0* [Press release]. | https://stability.ai/news-updates/stable-audio-2-0 | 2026-05-05 | Ch 2.1.2 (commercial bridge) |

### B3 — Text-to-speech (Ch 2.1.3) — partially `[TODO]`

| # | Topic | Source | URL | Status | Where to use |
|---|---|---|---|---|---|
| B3.1 | gTTS (Pulsefy uses this) | Durieux, P. N. (2024, November 10). *gTTS 2.5.4* [Python package]. PyPI. | https://pypi.org/project/gTTS/ | 2026-05-05 (carried forward) | Ch 2.1.3 + Ch 5.2.2 |
| B3.2 | Tacotron 2 | Shen, J., et al. (2018). *Natural TTS Synthesis by Conditioning WaveNet on Mel Spectrogram Predictions*. arXiv:1712.05884. | https://arxiv.org/abs/1712.05884 | `[VERIFY]` | Ch 2.1.3 — neural TTS lineage |
| B3.3 | VITS | Kim, J., Kong, J., & Son, J. (2021). *Conditional Variational Autoencoder with Adversarial Learning for End-to-End Text-to-Speech*. arXiv:2106.06103 (ICML 2021). | https://arxiv.org/abs/2106.06103 | `[VERIFY]` | Ch 2.1.3 — modern E2E TTS |
| B3.4 | ElevenLabs technical reference | ElevenLabs. *Research / blog posts*. | https://elevenlabs.io/blog | `[TODO: research]` | Ch 2.1.3 — commercial neural TTS |

---

## Section C — Commercial ad creation platforms (Ch 2.2)

The Ch 2.2 competitors changed entirely. The four featured platforms are now Canva, CapCut, AdCreative.ai, and InVideo AI. **All four entries are `[TODO: research]`** — none has been fetched yet.

For each competitor, the research agent should gather: identity sentence (what it is, who runs it, when launched), workflow / how it works (with one figure-worthy screenshot or vendor diagram), quantitative outcomes (paid users, ad-creator base, generation time), and integration / pricing details.

### C1 — Canva (2.2.1) — `[TODO: research]`

| # | Topic | Suggested source | Where to use |
|---|---|---|---|
| C1.1 | Canva company snapshot and product positioning | Canva newsroom / About page | 2.2.1 identity sentence |
| C1.2 | Canva user count | Canva official stats — 230M+ MAU was claimed in 2024, verify current | 2.2.1 quantitative outcomes |
| C1.3 | Canva Magic AI features (Magic Design, Magic Write, Magic Media) | Canva product pages | 2.2.1 workflow paragraph |
| C1.4 | Canva pricing tiers (Free / Pro / Teams) | https://www.canva.com/pricing/ | 2.2.1 pricing |
| C1.5 | Canva for Reels / TikTok ad templates | Canva help docs or template gallery | 2.2.1 — relevance to short-form ads |

### C2 — CapCut (2.2.2) — `[TODO: research]`

| # | Topic | Suggested source | Where to use |
|---|---|---|---|
| C2.1 | CapCut identity (ByteDance-owned, TikTok integration) | CapCut About page; ByteDance corporate announcements | 2.2.2 identity sentence |
| C2.2 | CapCut user count | ByteDance disclosures or third-party app analytics | 2.2.2 quantitative outcomes |
| C2.3 | CapCut AI features (text-to-video, AI templates, AI effects) | CapCut feature pages | 2.2.2 workflow paragraph |
| C2.4 | CapCut Pro pricing | https://www.capcut.com/ pricing page | 2.2.2 pricing |
| C2.5 | TikTok integration / commercial use rights | CapCut Terms of Service relevant clauses | 2.2.2 — legal note for commercial ads |

### C3 — AdCreative.ai (2.2.3) — `[TODO: research]`

| # | Topic | Suggested source | Where to use |
|---|---|---|---|
| C3.1 | AdCreative.ai company snapshot | https://www.adcreative.ai/ About page | 2.2.3 identity sentence |
| C3.2 | AdCreative.ai feature set (banner, video, social ads) | AdCreative.ai product pages | 2.2.3 workflow |
| C3.3 | AdCreative.ai pricing tiers | https://www.adcreative.ai/pricing | 2.2.3 pricing (premium-leaning) |
| C3.4 | AdCreative.ai integration with Facebook/Google Ads | AdCreative.ai integrations page | 2.2.3 |

### C4 — InVideo AI (2.2.4) — `[TODO: research]`

| # | Topic | Suggested source | Where to use |
|---|---|---|---|
| C4.1 | InVideo AI company snapshot | https://invideo.io/ai/ About | 2.2.4 identity sentence |
| C4.2 | InVideo AI text-to-video flow | InVideo AI product pages | 2.2.4 workflow |
| C4.3 | InVideo AI pricing | https://invideo.io/ai/pricing | 2.2.4 pricing |
| C4.4 | InVideo AI output quality and format support | InVideo AI feature comparison page | 2.2.4 — relevance to TikTok / Reels |

### C5 — Comparison table (2.3) — to be filled after C1–C4 are researched

The research agent should design a 4-row × ~6-column comparison table with these criteria:

| Tool | Pricing | API access | AI image gen | AI music gen | AI voiceover | Video assembly | Output formats | Open source |
|---|---|---|---|---|---|---|---|---|
| Canva | TBD | TBD | TBD | TBD | TBD | TBD | TBD | No |
| CapCut | TBD | TBD | TBD | TBD | TBD | TBD | TBD | No |
| AdCreative.ai | TBD | TBD | TBD | TBD | TBD | TBD | TBD | No |
| InVideo AI | TBD | TBD | TBD | TBD | TBD | TBD | TBD | No |
| **Pulsefy (this thesis)** | Free + Premium | Internal API | Pollinations | MusicGen | gTTS | FFmpeg | 9:16, 1:1, 16:9 | Yes |

This becomes Table 1 of the thesis (after the use-case description tables, which are Tables 2 onwards).

---

## Section D — Validation methodology (Ch 6) — carried forward verified

Same as the original Section C from the 2026-05-05 research session. All references remain relevant: MUSHRA, MOS, FAD, MLPerf, and the listening-study precedent papers are tool-agnostic and apply equally to ad-creation validation.

| # | Topic | Source (APA-ish) | URL | Verified | Where to use |
|---|---|---|---|---|---|
| D1 | **MUSHRA standard (Ch 6 main)** | ITU-R. (2015). *Recommendation BS.1534-3*. | https://www.itu.int/rec/R-REC-BS.1534-3-201510-I/en | 2026-05-05 | Ch 6 — listening-study protocol for music quality |
| D2 | MOS standard | ITU-T. (1996). *Recommendation P.800*. | https://www.itu.int/rec/T-REC-P.800-199608-I/en | 2026-05-05 | Ch 6 — overall-quality scale |
| D3 | **Fréchet Audio Distance (FAD)** | Kilgour, K., et al. (2019). *Fréchet Audio Distance*. arXiv:1812.08466. | https://arxiv.org/abs/1812.08466 | 2026-05-05 | Ch 6 — automatic objective metric |
| D4 | MusicGen as listening-study precedent | Copet et al. (2023). arXiv:2306.05284 (already in B2.1) | https://arxiv.org/abs/2306.05284 | 2026-05-05 | Ch 6 — methodology precedent |
| D5 | **MLPerf inference benchmarking** | Reddi, V. J., et al. (2020). *MLPerf Inference Benchmark*. arXiv:1911.02549. | https://arxiv.org/abs/1911.02549 | 2026-05-05 | Ch 6 — latency/throughput methodology |
| D6 | LAION-CLAP (audio-text alignment metric) | Wu, Y., et al. (2023). *Large-scale Contrastive Language-Audio Pretraining*. arXiv:2211.06687. | https://arxiv.org/abs/2211.06687 | 2026-05-05 | Ch 6 — text-audio alignment scoring |
| D7 | Music recommender survey (background) | Schedl, M., et al. (2018). DOI: 10.1007/s13735-018-0154-2 | https://link.springer.com/article/10.1007/s13735-018-0154-2 | 2026-05-05 | Ch 6 — generic recommender evaluation gaps |

### Recommended Ch 6 validation methodology (carried forward, still defensible)

The triangulation design from 2026-05-05 still applies — adapted from "evaluating an ad-music generator" to "evaluating an ad-asset generator". The three independent evidence streams remain:

1. **Per-subsystem latency benchmarks** following MLPerf-style discipline (D5): for each of the four subsystems (image gen, music gen, voiceover, video assembly), report p50 / p95 / p99 latency separately for cold-start and warm-cache, fix random seeds and prompt set, run ≥30 trials per condition, disclose hardware. **Real measurements only — no invented numbers.**

2. **Small-N (N=15) ad-quality pilot study** using a hybrid MUSHRA-lite + MOS protocol (D1, D2). ITU-R BS.1534-3 recommends ≥20 listeners post-screening, so 15 must be framed as **exploratory pilot**. Use 5–7 generated ads covering 2–3 product categories. For each: collect a 0–100 MUSHRA-style overall quality score AND a 5-point MOS for prompt-relevance per asset type (visuals, music, voiceover, final assembly). Report mean ± 95% CI (bootstrap, since N is small). With N=15 only large effects (Cohen's d ≥ 0.8) are detectable at α=0.05.

3. **System capacity metrics** — concurrent users supported, DB query p95 latency, video upload throughput. Document load-test methodology (k6 or autocannon, 30-second runs at increasing concurrency).

4. **Inter-rater agreement** for the listening study — Krippendorff's α (or ICC(2,1) for ratio scales). Caveat: with N=15 and few stimuli, the agreement metric is itself noisy.

5. **Threats to validity** — explicit subsection acknowledging that a 15-listener pilot + offline benchmarks cannot establish: real-user ad performance (CTR, CPM, ROAS), production reliability under sustained load, or blind A/B preference vs Canva / CapCut / AdCreative.ai / InVideo AI at scale. The defensible thesis-level claim is: *Pulsefy's outputs are not statistically distinguishable from a credible baseline on this pilot, and per-subsystem latency targets are met under specified conditions.*

---

## Section E — Background music research (deprecated for Ch 2 competitors)

These entries were included in the 2026-05-05 research as the four music competitors in the old Ch 2.2 (Suno, Udio, ElevenLabs Music, Splice). They are **no longer the Ch 2.2 competitor list** — that role belongs to Section C (Canva, CapCut, AdCreative.ai, InVideo AI). The music tools are kept here as background references in case any chapter needs to mention "the broader generative-music tooling landscape" — for example, in 2.1.2 alongside MusicGen, or in Conclusions when discussing future work.

| # | Topic | Source | URL | Verified | Where to use (now) |
|---|---|---|---|---|---|
| E1 | Suno (closed-source AI music product) | Suno, Inc. (2026). *Suno*. | https://suno.com/ | 2026-05-05 | Ch 2.1.2 background only — example of commercial closed-source music generator |
| E2 | Suno pricing tiers | Suno, Inc. (2026). *Suno Pricing*. | https://suno.com/pricing | 2026-05-05 | (deprecated for Ch 2.2; kept only as comparable pricing benchmark for Pulsefy's premium tier) |
| E3 | Udio | Udio. (2026). | https://www.udio.com/ | `[UNVERIFIED via fetch]` (page is JS-rendered) | Ch 2.1.2 background only |
| E4 | ElevenLabs Music | ElevenLabs. (2026). *Eleven Music*. | https://elevenlabs.io/music | 2026-05-05 | Cross-references to B3.4 (TTS); not a Pulsefy competitor in ad creation |

### MIR research (deprecated relevance — ad creation does not use MIR directly)

Most of the original MIR section (Lerch textbook, MERT, FMA dataset, GTZAN, MFCC) is **no longer relevant** to the Pulsefy ad-creation thesis. Pulsefy does not classify or search music; it generates and overlays. These entries are kept here for completeness only and **should not appear in the References list** unless a specific chapter draft brings them back into scope.

| # | Topic | Source | Verified | Status |
|---|---|---|---|---|
| E5 | Lerch MIR textbook | Lerch, A. (2023). *An Introduction to Audio Content Analysis* (2nd ed.). Wiley/IEEE Press. | 2026-05-05 | Deprecated for thesis use |
| E6 | DL-for-MIR tutorial | Choi et al. (2017). arXiv:1709.04396 | 2026-05-05 | Deprecated |
| E7 | MERT (music embeddings) | Li et al. (2024). arXiv:2306.00107 | 2026-05-05 | Deprecated |
| E8 | FMA dataset | Defferrard et al. (2017). arXiv:1612.01840 | 2026-05-05 | Deprecated |
| E9 | CNN music tagging | Won et al. (2020). arXiv:2006.00751 | 2026-05-05 | Deprecated |
| E10 | MULE music representations | McCallum et al. (2022). arXiv:2210.03799 | 2026-05-05 | Deprecated |
| E11 | Davis & Mermelstein MFCC | Davis & Mermelstein (1980). DOI: 10.1109/TASSP.1980.1163420 | `[UNVERIFIED]` (IEEE blocked) | Deprecated |
| E12 | GTZAN dataset | Tzanetakis & Cook (2002). DOI: 10.1109/TSA.2002.800560 | `[UNVERIFIED]` (IEEE blocked) | Deprecated |

---

## Citation skeletons ready to drop into References [N] (carried forward)

Format matches the IARCA `[N] Author(s). (Year, Month Day). Title. Source. URL` pattern. Renumber when assembling the final list. Citations marked **[deprecated]** below are kept for reference but should not appear in the final References list unless a specific chapter brings them back into scope.

```
[N] Copet, J., Kreuk, F., Gat, I., Remez, T., Kant, D., Synnaeve, G., Adi, Y., & Défossez, A. (2023, June 8). Simple and controllable music generation. arXiv preprint arXiv:2306.05284. https://arxiv.org/abs/2306.05284

[N] Meta AI. (2024). Audiocraft: A library for audio generation research [Source code]. GitHub. https://github.com/facebookresearch/audiocraft

[N] Liu, H., Chen, Z., Yuan, Y., Mei, X., Liu, X., Mandic, D., Wang, W., & Plumbley, M. D. (2023, January 29). AudioLDM: Text-to-audio generation with latent diffusion models. arXiv preprint arXiv:2301.12503. https://arxiv.org/abs/2301.12503

[N] Stability AI. (2024, April 3). Stable Audio 2.0 [Press release]. Stability AI. https://stability.ai/news-updates/stable-audio-2-0

[N] Rombach, R., Blattmann, A., Lorenz, D., Esser, P., & Ommer, B. (2022, April 13). High-resolution image synthesis with latent diffusion models. arXiv preprint arXiv:2112.10752. https://arxiv.org/abs/2112.10752

[N] Ho, J., Jain, A., & Abbeel, P. (2020, June 19). Denoising diffusion probabilistic models. arXiv preprint arXiv:2006.11239. https://arxiv.org/abs/2006.11239

[N] gTTS contributors. (2024, November 10). gTTS 2.5.4 [Python package]. PyPI. https://pypi.org/project/gTTS/

[N] Pollinations. (2026). Pollinations [Source code & docs]. GitHub. https://github.com/pollinations/pollinations

[N] Jamendo. (n.d.). Jamendo Developer — API v3.0 documentation. Retrieved May 5, 2026, from https://developer.jamendo.com/v3.0

[N] ITU-R. (2015). Recommendation BS.1534-3: Method for the subjective assessment of intermediate quality level of audio systems. International Telecommunication Union, Geneva. https://www.itu.int/rec/R-REC-BS.1534-3-201510-I/en

[N] ITU-T. (1996, August). Recommendation P.800: Methods for subjective determination of transmission quality. International Telecommunication Union, Geneva. https://www.itu.int/rec/T-REC-P.800-199608-I/en

[N] Kilgour, K., Zuluaga, M., Roblek, D., & Sharifi, M. (2019). Fréchet audio distance: A reference-free metric for evaluating music enhancement algorithms. Proceedings of Interspeech 2019. https://arxiv.org/abs/1812.08466

[N] Reddi, V. J., Cheng, C., Kanter, D., Mattson, P., et al. (2020). MLPerf inference benchmark. Proceedings of the 47th International Symposium on Computer Architecture (ISCA). https://arxiv.org/abs/1911.02549
```

Citation skeletons still TODO once researched: TikTok ad market (A1.x, A2.x), agency / Adobe pricing (A3.x), Canva / CapCut / AdCreative.ai / InVideo AI (C1.x–C4.x), Stable Diffusion / DDPM / Imagen / DALL-E (B1.x), Tacotron / VITS (B3.x).

---

## Outstanding TODOs (consolidated)

For a focused research-agent dispatch in a future session, the most valuable batches are:

1. **Section A** — TikTok / Reels / Shorts MAU + ad revenue + creator-economy stats. Anchors Ch 1.1 and 1.2. Roughly 8–10 citations. Sources: TikTok Newsroom, Meta Q1 2026 transcript, YouTube Official Blog, eMarketer.
2. **Section A.3** — small-agency pricing benchmarks + Adobe Creative Cloud pricing. Anchors Ch 1.3 and footnotes F3, F4. Roughly 3–4 citations.
3. **Section C (Ch 2.2 competitors)** — Canva, CapCut, AdCreative.ai, InVideo AI deep dives. Each gets 4–5 facts. Total 16–20 citations. **Highest value for Ch 2 work.**
4. **Section B1 + B3** — text-to-image (Stable Diffusion, DDPM, FLUX.1) and TTS (Tacotron, VITS, ElevenLabs). 6–8 citations.

Ranked by thesis-impact: **(3) > (2) > (1) > (4)**, because Ch 2 is the next chapter we'll write and Section C is the load-bearing comparison.
