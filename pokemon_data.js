/**
 * PokéRogue Fusion Calculator - Pokemon Data
 * BSD 3-Clause License - Copyright (c) 2024
 * 
 * This is a sample file. Replace with your actual data from pokemon_data.csv
 * Convert CSV to JS using a simple script or online converter.
 * Format: const POKEMON_DATA = { "Name": { ... }, ... };
 */

const POKEMON_DATA = {
    "Bulbasaur": { id: 1, hp: 45, attack: 49, defense: 49, spAttack: 65, spDefense: 65, speed: 45, bst: 318, type1: "Grass", type2: "Poison", abilities: "Overgrow", passive: "", evolution: "Ivysaur, Venusaur" },
    "Ivysaur": { id: 2, hp: 60, attack: 62, defense: 63, spAttack: 80, spDefense: 80, speed: 60, bst: 405, type1: "Grass", type2: "Poison", abilities: "Overgrow", passive: "", evolution: "Venusaur" },
    "Venusaur": { id: 3, hp: 80, attack: 82, defense: 83, spAttack: 100, spDefense: 100, speed: 80, bst: 525, type1: "Grass", type2: "Poison", abilities: "Overgrow", passive: "", evolution: "" },
    "Charmander": { id: 4, hp: 39, attack: 52, defense: 43, spAttack: 60, spDefense: 50, speed: 65, bst: 309, type1: "Fire", type2: "", abilities: "Blaze", passive: "", evolution: "Charmeleon" },
    "Charmeleon": { id: 5, hp: 58, attack: 64, defense: 58, spAttack: 80, spDefense: 65, speed: 80, bst: 405, type1: "Fire", type2: "", abilities: "Blaze", passive: "", evolution: "Charizard" },
    "Charizard": { id: 6, hp: 78, attack: 84, defense: 78, spAttack: 109, spDefense: 85, speed: 100, bst: 534, type1: "Fire", type2: "Flying", abilities: "Blaze", passive: "", evolution: "" },
    "Squirtle": { id: 7, hp: 44, attack: 48, defense: 65, spAttack: 50, spDefense: 64, speed: 43, bst: 314, type1: "Water", type2: "", abilities: "Torrent", passive: "", evolution: "Wartortle" },
    "Wartortle": { id: 8, hp: 59, attack: 63, defense: 80, spAttack: 65, spDefense: 80, speed: 58, bst: 405, type1: "Water", type2: "", abilities: "Torrent", passive: "", evolution: "Blastoise" },
    "Blastoise": { id: 9, hp: 79, attack: 83, defense: 100, spAttack: 85, spDefense: 105, speed: 78, bst: 530, type1: "Water", type2: "", abilities: "Torrent", passive: "", evolution: "" },
    "Pikachu": { id: 25, hp: 35, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90, bst: 320, type1: "Electric", type2: "", abilities: "Static", passive: "", evolution: "Raichu" },
    "Raichu": { id: 26, hp: 60, attack: 90, defense: 55, spAttack: 90, spDefense: 80, speed: 110, bst: 485, type1: "Electric", type2: "", abilities: "Static", passive: "", evolution: "" },
    "Jigglypuff": { id: 39, hp: 115, attack: 45, defense: 20, spAttack: 45, spDefense: 25, speed: 20, bst: 270, type1: "Normal", type2: "Fairy", abilities: "Cute Charm", passive: "", evolution: "Wigglytuff" },
    "Wigglytuff": { id: 40, hp: 90, attack: 70, defense: 45, spAttack: 85, spDefense: 70, speed: 55, bst: 415, type1: "Normal", type2: "Fairy", abilities: "Cute Charm", passive: "", evolution: "" },
    "Gastly": { id: 92, hp: 30, attack: 35, defense: 30, spAttack: 100, spDefense: 35, speed: 80, bst: 310, type1: "Ghost", type2: "Poison", abilities: "Levitate", passive: "", evolution: "Haunter" },
    "Haunter": { id: 93, hp: 45, attack: 50, defense: 45, spAttack: 115, spDefense: 55, speed: 95, bst: 405, type1: "Ghost", type2: "Poison", abilities: "Levitate", passive: "", evolution: "Gengar" },
    "Gengar": { id: 94, hp: 60, attack: 65, defense: 60, spAttack: 130, spDefense: 75, speed: 110, bst: 500, type1: "Ghost", type2: "Poison", abilities: "Levitate", passive: "", evolution: "" },
    "Eevee": { id: 133, hp: 55, attack: 55, defense: 50, spAttack: 45, spDefense: 65, speed: 55, bst: 325, type1: "Normal", type2: "", abilities: "Run Away", passive: "", evolution: "Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon, Sylveon" },
    "Vaporeon": { id: 134, hp: 130, attack: 65, defense: 60, spAttack: 110, spDefense: 95, speed: 65, bst: 525, type1: "Water", type2: "", abilities: "Water Absorb", passive: "", evolution: "" },
    "Jolteon": { id: 135, hp: 65, attack: 65, defense: 60, spAttack: 110, spDefense: 95, speed: 130, bst: 525, type1: "Electric", type2: "", abilities: "Volt Absorb", passive: "", evolution: "" },
    "Flareon": { id: 136, hp: 65, attack: 130, defense: 60, spAttack: 95, spDefense: 110, speed: 65, bst: 525, type1: "Fire", type2: "", abilities: "Flash Fire", passive: "", evolution: "" },
    "Mewtwo": { id: 150, hp: 106, attack: 150, defense: 70, spAttack: 194, spDefense: 90, speed: 130, bst: 740, type1: "Psychic", type2: "", abilities: "Pressure", passive: "", evolution: "" },
    "Mew": { id: 151, hp: 100, attack: 100, defense: 100, spAttack: 100, spDefense: 100, speed: 100, bst: 600, type1: "Psychic", type2: "", abilities: "Synchronize", passive: "", evolution: "" }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = POKEMON_DATA;
}
