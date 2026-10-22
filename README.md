# AGL Field Course

Interactive training software on Airfield Ground Lighting (AGL) for electricians,
electrical engineers and electrical system designers.

Open `index.html` in a browser. There is no build step and no dependencies
(Google Fonts load if online; system fonts are used otherwise).

## Modules

| | Module | What it covers |
|---|---|---|
| A | Start here | Why AGL uses series circuits, learning tracks per role, standards |
| B | Airfield lighting map | Interactive runway/taxiway plan: CAT I vs CAT II/III, brightness steps, circuit interleaving, PAPI simulator |
| C | Series circuit simulator | CCR, isolation transformers and lamps; lamp failures, open circuit, single and double earth faults |
| D | CCRs, transformers, cable | Regulator types and protections, isolation transformers, cable, connectors, light bases |
| E | System design | Design sequence, circuit rules, switch-over times, colours/spacing, serviceability |
| F | Design calculators | CCR load and sizing, insulation resistance trend, loop resistance check |
| G | Maintenance & fault finding | Safe isolation, preventive maintenance, branching fault scenarios |
| H | Knowledge check | Quiz filtered by role, with explanations |
| J | Glossary | Searchable AGL terms |

## Structure

- `index.html`: page layout and static course content
- `css/agl.css`: styles (light and dark themes)
- `js/data.js`: light-system data, quiz, scenarios, glossary
- `js/airfield.js`, `js/circuit.js`, `js/calc.js`, `js/learn.js`: interactive modules
- `js/app.js`: module navigation (`#overview`, `#lights`, `#series`, ...)

## Disclaimer

Training material only. Figures are typical values. Design, install and maintain AGL
to the current edition of ICAO Annex 14, FAA/EASA/IEC standards as applicable, your
aviation authority's requirements and the manufacturers' instructions.
