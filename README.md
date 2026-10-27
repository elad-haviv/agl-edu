# AGL Field Course

Interactive training software on Airfield Ground Lighting (AGL) for electricians,
electrical engineers and electrical system designers.

Open `index.html` in a browser. There is no build step. Module E loads d3.js 7.9.0 from
cdnjs and needs an internet connection; Google Fonts load if online, and system fonts are
used otherwise.

## Modules

| | Module | What it covers |
|---|---|---|
| A | Start here | Why AGL uses series circuits, learning tracks per role, standards |
| B | Airfield lighting map | Interactive runway/taxiway plan: CAT I vs CAT II/III, brightness steps, circuit interleaving, PAPI simulator |
| C | Series circuit simulator | CCR, isolation transformers and lamps; lamp failures, open circuit, single and double earth faults |
| D | CCRs, transformers, cable | Regulator types and protections, isolation transformers, cable, connectors, light bases |
| E | 3D installation details | Rotatable, cut-away and exploded 3D models (d3.js) of an elevated light on an L-867 base and an in-pavement light on an L-868 base, with description bubbles for every part |
| F | System design | Design sequence, circuit rules, switch-over times, colours/spacing, serviceability |
| G | Design calculators | CCR load and sizing, insulation resistance trend, loop resistance check |
| H | Maintenance & fault finding | Safe isolation, preventive maintenance, branching fault scenarios |
| J | Knowledge check | Quiz filtered by role, with explanations |
| K | Glossary | Searchable AGL terms |
| L | Reference tables | Standards list, colours and spacing |

Each module is split into short lessons, addressed by sign codes (`#D2`; module names such
as `#equipment` still work). The rail opens the current module's lessons, a sign-style
breadcrumb shows the position, and Previous/Next direction signs move through the course.
Visited lessons and the last one opened are remembered in the browser.

## Languages

English and Hebrew (right-to-left). Switch with the English / עברית control in the
header; the choice is remembered in the browser, and Hebrew is the default when the
browser language is Hebrew.

- English text lives in `index.html` and the JS modules.
- `js/he-static.js` maps each static English block, as the browser serialises it, to Hebrew.
- `js/he.js` holds Hebrew interface strings (keyed by the English text) and the
  Hebrew course data (light systems, scenarios, quiz, glossary).
- `js/i18n.js` swaps the page between languages and sets `dir="rtl"`. Any string
  without a Hebrew entry stays in English, so a new or edited English block needs a
  matching entry in `js/he-static.js`.

## Structure

- `index.html`: page layout and static course content
- `css/agl.css`: styles (light and dark themes)
- `js/data.js`: light-system data, quiz, scenarios, glossary
- `js/airfield.js`, `js/circuit.js`, `js/calc.js`, `js/learn.js`: interactive modules
- `js/detail3d.js`: 3D engine (solid builders, perspective projection, painter's sort) and the two installation models, drawn with d3
- `js/detail-data.js`: part names, bubble text and details for the 3D models, in English and Hebrew
- `js/app.js`: lesson navigation, breadcrumb, pager and progress

## Disclaimer

Training material only. Figures are typical values. Design, install and maintain AGL
to the current edition of ICAO Annex 14, FAA/EASA/IEC standards as applicable, your
aviation authority's requirements and the manufacturers' instructions.
