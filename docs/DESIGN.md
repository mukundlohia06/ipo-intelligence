# DESIGN — UX / UI Specification

**Status:** BASELINE v0.1. The agent should make a distinctive visual identity that fits the PS domain (don't ship a generic template look). Prioritise clarity of *evidence* over decoration.

## 1. Design principles
1. **Evidence first.** The answer and its proof are always visible together.
2. **Click to verify.** Any claim → exact passage in ≤ 1 click.
3. **Honest states.** "Not found" and "Conflict" are designed, not error screens.
4. **Legible internals.** Judges should *see* hybrid retrieval, filters, and scores (X-ray) without reading code.
5. **Fast first impression.** Seeded demo workspace loaded; a one-click example question; no login wall.
6. **Mobile-sane.** A judge may open it on a phone: single-column fallback, Evidence in a bottom sheet.

## 2. Information architecture
```
/                    Landing + "Try the demo" (loads demo workspace) + 3 example questions
/workspace/:id       Main app (3 panes)
   ├─ Library        sources list, import, status, filters
   ├─ Ask            question box, mode selector, answer
   └─ Evidence       citations, passages, X-ray, conflicts
/workspace/:id/source/:sid   Source viewer (full text, chunk boundaries, highlight)
/eval                Eval dashboard (latest run, deltas, per-case table)
/about               Architecture diagram + data model + "how it works" (great for judges)
```

## 3. Main screen layout (desktop)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Logo  Workspace ▾   [Load sample] [Import]          Eval · About · ⚙     │
├───────────────┬───────────────────────────────┬──────────────────────────┤
│ LIBRARY       │ ASK                           │ EVIDENCE                 │
│ ▢ Source A ✓  │ [ question input        ][→]  │ [1] Source A · §2.1      │
│ ▢ Source B ✓  │ Mode: Q&A | Compare | Brief   │   "…verbatim quote…"     │
│ ▢ Source C ⏳ │ Filters: type ▾ date ▾ tags ▾ │ [2] Source B · p.4       │
│               │ ───────────────────────────── │   "…verbatim quote…"     │
│ Filters       │ STATE BADGE: ANSWERED         │ ───────────────          │
│               │ Answer text with chips [1][2] │ X-RAY (toggle)           │
│               │ Conflicts / Gaps cards        │ chunk | vec | lex | rrf  │
└───────────────┴───────────────────────────────┴──────────────────────────┘
```

## 4. Key components
| Component | Behaviour |
|---|---|
| **ImportDialog** | Drag-drop files, paste URL/text, "Load sample corpus". Per-file progress: queued → parsed → chunked → embedded → searchable, with retry on failure. |
| **SourceCard** | Title, type icon, date, chunk count, status pill, delete. |
| **QuestionBar** | Text input, example-question chips, mode select, filter popovers (visible active-filter chips). |
| **AnswerView** | Streaming summary, then verified claims. Citation chips `[n]` are focusable buttons; hover shows quote preview; click opens source viewer at highlight. |
| **StateBadge** | `ANSWERED` (green) · `PARTIAL` (amber) · `CONFLICTING` (purple/orange) · `INSUFFICIENT` (red/grey). Always paired with text + icon (not colour alone). |
| **EvidencePanel** | Ordered passage cards: source title, section/page, date/version, quote with highlight, "open in source". |
| **ConflictCard** | Two-column comparison with source, date, version; neutral language; "newer" hint only as hint. |
| **GapList** | "What the sources don't say." |
| **XRay** | Table/bars per chunk: vector rank/score, lexical rank/score, RRF, rerank, whether added by diversification; filters applied; latency per stage. Toggle to keep default UI clean. |
| **SourceViewer** | Full text with chunk boundaries (subtle), highlighted cited spans, prev/next chunk, metadata header. |
| **EvalPage** | Table of cases (✓/✗, expected vs retrieved IDs), metrics cards, config comparison chart. |

## 5. States to design (don't skip)
- Empty workspace (CTA: load sample / import)
- Ingestion in progress / failed (readable error + retry)
- Index not ready ("indexing…")
- Streaming; generation failed (show evidence anyway)
- INSUFFICIENT / PARTIAL / CONFLICTING (primary demo moments)
- Rate-limited (friendly message + cooldown)
- Offline/slow network

## 6. Visual identity (baseline suggestion — agent may redesign)
- Tone: precise, trustworthy, a bit editorial ("receipts", ledger/stamp metaphors work well).
- Type: a readable serif or humanist sans for answers, monospace for IDs/quotes/scores.
- Colour: neutral canvas; one strong accent; semantic state colours; **highlight colour for cited text** consistent everywhere.
- Light/dark both supported; contrast AA.
- Motion: subtle (streaming caret, highlight pulse on citation click). No gratuitous animation.
- Use real content in screenshots (seeded corpus), never lorem ipsum.

## 7. Accessibility
Keyboard reachable citations and panels; `aria-live="polite"` on streaming answer; focus moves to highlighted passage on open; state conveyed by text+icon; minimum 44px touch targets on mobile.

## 8. Demo mode
- `?demo=1` or landing button → loads demo workspace, pre-fills the 3 scripted questions: **multi-source**, **conflict**, **unanswerable** (+ one exact-token).
- Small "Demo script" popover for the presenter (hidden by default; keyboard shortcut).
- Warm-up on load: hit `/api/health` and a no-op query so the first real query isn't cold.

## 9. Copywriting samples
- INSUFFICIENT: "We couldn't find this in your sources. Closest matches are shown below — add a source or rephrase."
- CONFLICTING: "Your sources disagree. We're showing both positions instead of picking one."
- PARTIAL: "Part of this is supported. Here's what isn't covered."
- Citation tooltip: "Verified quote from *{source}* · {section}".

## 10. Deck/video visuals to capture early
Hero screenshot of answer + evidence; X-ray; conflict card; INSUFFICIENT card; eval table with deltas; architecture diagram from ARCHITECTURE.md.
