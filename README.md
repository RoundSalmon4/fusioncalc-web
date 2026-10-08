# PokéRogue Fusion Calculator

A web-based fusion calculator for [PokéRogue](https://github.com/pagefaultgames/pokerogue) that combines two Pokémon and shows the fused stats, typing, damage taken and a sprite preview.

Live site: <https://roundsalmon4.github.io/fusioncalc-web/>

## Features

- Select two Pokémon and fuse them — each fused stat is the average of the two, rounded up
- Fused typing: first type from Pokémon 1, extra type from the sacrifice, same as the in-game DNA Splicer
- Fused sprite preview, tinted by the sacrifice's type
- Damage-taken tables for each panel and the fusion, with active ability, passive (toggleable) and Tera applied
- Tera Type selectors for either Pokémon and for the fusion
- Active ability and nature pickers (natures are shown for reference only, not applied to stats)
- Wonder Guard handled like in game: base HP shown as-is with a "(Max HP: 1)" note
- Flip Stat Challenge mode (HP↔Speed, Atk↔Sp.Def, Def↔Sp.Atk)
- Inverse Battle mode
- Filter Pokémon by generation, type (mono/dual/either), stats, and damage taken from a type
- Sort by ID, BST, name, or any individual stat
- Click a name in an evolution line to jump straight to that Pokémon
- Display options to hide any panel section you don't care about

## Usage

Visit the live site, or open `index.html` straight from the repo in a browser — no build step or server required.

The app loads Pokémon data from `website/pokemon_data.js` and sprites from `website/images/`. Both are refreshed automatically by a daily GitHub Actions run against PokeRogue-Dex, and the source commit is recorded in `data_version.txt`.

## Data Source

Stats, types, abilities, passives and sprites come from [PokeRogue-Dex](https://github.com/Sandstormer/PokeRogue-Dex), which is built from the PokéRogue game source. See [NOTICE.md](NOTICE.md) for licensing details.

## Technologies

- HTML5
- CSS3
- JavaScript (Vanilla)

## License

BSD 3-Clause — see [LICENSE](LICENSE). The bundled sprites and the
generated Pokédex data come from PokéRogue / PokeRogue-Dex under their
own licenses (CC BY-NC-SA 4.0 and AGPL-3.0); details in
[NOTICE.md](NOTICE.md).
