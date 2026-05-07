# Footnotes to add manually in Word

Updated 2026-05-07 after the ad-creation framing pivot. The previous footnotes (music streaming citations) were dropped when the .docx was regenerated; the citations and their target paragraphs are listed below so you can re-insert them with Word's native footnote feature (`References → Insert Footnote`).

## How to use this file

In the regenerated `Pulsefy_Diploma_Thesis.docx`, every paragraph that needs a footnote ends with a red-italic marker like:

> `[footnote F1: TikTok / Meta active user figures and short-form ad engagement — see THESIS_RESEARCH_BANK.md Section A; verify and add Word footnote here]`

To convert each marker to a real footnote:

1. Place the cursor at the end of the body sentence (just before the red marker).
2. Word: `References → Insert Footnote` (or `Cmd+Option+F` on macOS).
3. Paste the corresponding citation from the table below into the footnote area at the bottom of the page.
4. Delete the red `[footnote Fn: ...]` marker from the body text.
5. Repeat for the next footnote.

The footnote IDs (F1, F2, ...) are stable across this file and the .docx so you can work through them sequentially.

## Footnote table

| ID | Chapter / paragraph | What the body claim is | Suggested footnote text |
|---|---|---|---|
| F1 | 1.1 paragraph 1 | TikTok / Meta short-form audiences in the hundreds of millions | TikTok and Meta active user figures from the most recent quarterly investor reports. Cross-reference Statista or eMarketer summary. *Verify and replace with the specific report URL and access date — see `docs/THESIS_RESEARCH_BANK.md` Section A.* |
| F2 | 1.1 paragraph 2 | Global digital advertising spend, social-platform share, short-form growth | eMarketer or WARC global ad-spend report for 2025–2026. *Verify with a fresh fetch and add the URL and access date.* |
| F3 | 1.3 paragraph 1 | Agency cost €1k–€10k per campaign | Cite a Romanian or European small-agency rate card. Examples to verify: clutch.co / sortlist.com filtered to small studios in EU. *Pick one source, fetch the URL, add to References.* |
| F4 | 1.3 paragraph 2 | Adobe Creative Cloud ~€60/month | Adobe's official pricing page (https://www.adobe.com/creativecloud/plans.html) or its EU equivalent. *Add URL with access date and current monthly price.* |

## Footnotes already covered by the research bank

The following claims do not yet have markers in the .docx but should pick up footnotes when the relevant chapters are written. They are listed here so they don't get lost.

| Future chapter / paragraph | What the body claim will be | Suggested source from research bank |
|---|---|---|
| Ch 2.1.2 | MusicGen architecture and capabilities | Copet et al. 2023, arXiv:2306.05284 (research bank entry B1) |
| Ch 2.1.2 | MusicGen training data and model sizes | Audiocraft GitHub MUSICGEN.md (research bank B2) |
| Ch 2.1.2 | MusicLM as the predecessor architecture | Agostinelli et al. 2023, arXiv:2301.11325 (research bank B4) |
| Ch 2.1.2 | AudioLDM latent diffusion approach | Liu et al. 2023, arXiv:2301.12503 (research bank B5) |
| Ch 2.1.2 | Stable Audio 2.0 product specs | Stability AI April 2024 announcement (research bank B7) |
| Ch 2.1.3 | gTTS as a Google Translate TTS wrapper, license, supported languages | gTTS PyPI page (research bank B13) |
| Ch 2.2.1 | Canva ad-creation tooling | TODO: research Canva official pricing and feature pages |
| Ch 2.2.2 | CapCut TikTok-native editor | TODO: research CapCut pricing and feature pages |
| Ch 2.2.3 | AdCreative.ai pricing tiers | TODO: research adcreative.ai pricing page |
| Ch 2.2.4 | InVideo AI pricing tiers | TODO: research invideo.io/ai pricing page |
| Ch 5.1.2 | Pollinations.ai endpoint and free-access policy | Pollinations GitHub README (research bank B14) |
| Ch 5.1.2 | Jamendo API quotas and license model | Jamendo Developer docs (research bank A12) |
| Ch 6 methodology | MUSHRA listening study standard | ITU-R BS.1534-3 (research bank C11) |
| Ch 6 methodology | MOS rating scale | ITU-T P.800 (research bank C12) |
| Ch 6 methodology | Fréchet Audio Distance | Kilgour et al. 2019, arXiv:1812.08466 (research bank C13) |
| Ch 6 methodology | MLPerf-style benchmarking discipline | Reddi et al. 2020, arXiv:1911.02549 (research bank C15) |

## Lost footnotes (from the previous music-platform draft)

The previous .docx had three footnotes anchored to music-streaming claims that no longer apply (Spotify Q1 2026 MAU, IFPI 2026 market size, ~120k tracks/day). These were dropped on purpose — the new ad-creation Ch 1 does not make those claims. The verified citations stay in the research bank and can be reused if a future chapter needs streaming-industry context.

## When to update this file

Add a new row to the table whenever a chapter draft introduces a new claim that needs sourcing. Mark the row `[VERIFY]` if the citation came from training memory and was not freshly fetched. Strike the row out (do not delete) once the corresponding Word footnote has been inserted in the .docx.
