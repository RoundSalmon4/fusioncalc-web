# PokéRogue Fusion Calculator

A web-based Pokémon fusion calculator that combines two Pokémon and displays their fused stats, types, and type effectiveness calculations.

## Features

- Select two Pokémon and fuse them
- View combined stats (BST averaged)
- Type effectiveness calculations including:
  - Dual-type calculations
  - Flip Stat Challenge mode
  - Inverse Battle mode
  - Passive ability effects
- Filter Pokémon by:
  - Generation
  - Type
  - Stats (HP, Attack, Defense, etc.)
  - Damage taken from specific types
- Sort by ID, BST, Name, or individual stats
- Display options to customize shown information

## Usage

Simply open `index.html` in a web browser. No build step or server required.

The application loads Pokémon data from `website/pokemon_data.js`, which is automatically updated daily via GitHub Actions.

## Data Source

Pokémon data is sourced from [PokeRogue-Dex](https://github.com/Sandstormer/PokeRogue-Dex) and automatically updated daily.

## Technologies

- HTML5
- CSS3
- JavaScript (Vanilla)
