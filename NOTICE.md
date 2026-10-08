# NOTICE

## Acknowledgments

- **Scarecrow-g59/pokerogue-fusion** — original fusion calculator: <https://github.com/Scarecrow-g59/pokerogue-fusion>
- **PokéRogue** — core game that inspired this project: <https://github.com/pagefaultgames/pokerogue>
- **Search Dex by Sandstormer** — source used to build pokemon_data: <https://github.com/Sandstormer>

If you maintain any of these upstream projects, thank you! Please open an issue if any attribution or link needs adjustment.

## Licenses

This repo is a mix of my own work and third-party material:

| What | Where | License |
| --- | --- | --- |
| Original code | `index.html`, `website/script.js`, `website/style.css`, `.github/`, tooling | BSD 3-Clause — see [LICENSE](LICENSE) |
| Built on the original pokerogue-fusion calculator | same files, heavily reworked | BSD 3-Clause, Copyright (c) 2024 Scarecrow-g59 — notice kept in [LICENSE](LICENSE) |
| Pokémon sprites | `website/images/` (10,000+ PNGs) | CC BY-NC-SA 4.0 (PokéRogue assets) — see below |
| Generated Pokédex data | `pokemon_data.csv`, `website/pokemon_data.js` | AGPL-3.0, derived from PokeRogue-Dex — see below |

### Sprites

The images in `website/images/` are copied without modification from
[PokeRogue-Dex](https://github.com/Sandstormer/PokeRogue-Dex), which
sources them from [PokéRogue](https://github.com/pagefaultgames/pokerogue).
PokéRogue licenses its assets under
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
to the extent they are licensable, and all asset rights are retained by
their original creators. If you reuse them, keep it non-commercial and
share alike. Credit: PokéRogue — <https://github.com/pagefaultgames/pokerogue>.

### Generated data

`pokemon_data.csv` and `website/pokemon_data.js` are built by the
`update-data` workflow from PokeRogue-Dex's `pokedex_data.js`,
`filter_data.js` and `lang/en.js`. PokeRogue-Dex is licensed under the
[GNU AGPL v3.0](LICENSES/AGPL-3.0.txt) (full text included in this
repo), so the generated files carry the same license. The complete
source is this repository: the workflow definition plus the upstream
files it fetches at build time, pinned by the commit recorded in
`data_version.txt`. The PokeRogue-Dex author explicitly allows using
`pokedex_data.js` in derivative projects (see their README).

The underlying game data (stats, types, abilities, evolutions) comes
from PokéRogue; per its README, its auto-generated data files are
released under CC0-1.0.

### My code

Everything else is BSD 3-Clause — see [LICENSE](LICENSE). That includes
the notice of the original pokerogue-fusion calculator I built on top of.
