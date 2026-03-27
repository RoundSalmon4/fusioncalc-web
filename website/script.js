/**
 * PokéRogue Fusion Calculator - BSD 3-Clause License
 * Copyright (c) 2024
 */

// ===== DATA & STATE =====
let pokemonData = {};
let selectedP1 = null;
let selectedP2 = null;
let hasFusion = false;

const displayOptions = {
    p1: { type: true, abilities: true, hidden_ability: true, passive: true, bst: true, total_bst: true, evolution: true, damage: true },
    p2: { type: true, abilities: true, hidden_ability: true, passive: true, bst: true, total_bst: true, evolution: true, damage: true },
    fusion: { fused_type: true, abilities: true, bst: true, total_bst: true, diffs: true, ability_effects: true, quick_compare: true, damage: true }
};

const FLIP_MAP = { HP: 'Speed', Speed: 'HP', Attack: 'Sp. Def', 'Sp. Def': 'Attack', Defense: 'Sp. Atk', 'Sp. Atk': 'Defense' };

const TYPE_EFFECTIVENESS = {
    Normal: { weaknesses: ['Fighting'], resistances: [], immunities: ['Ghost'] },
    Fire: { weaknesses: ['Water', 'Ground', 'Rock'], resistances: ['Fire', 'Grass', 'Ice', 'Bug', 'Steel', 'Fairy'], immunities: [] },
    Water: { weaknesses: ['Electric', 'Grass'], resistances: ['Fire', 'Water', 'Ice', 'Steel'], immunities: [] },
    Grass: { weaknesses: ['Fire', 'Ice', 'Poison', 'Flying', 'Bug'], resistances: ['Water', 'Electric', 'Grass', 'Ground'], immunities: [] },
    Electric: { weaknesses: ['Ground'], resistances: ['Electric', 'Flying', 'Steel'], immunities: [] },
    Ice: { weaknesses: ['Fire', 'Fighting', 'Rock', 'Steel'], resistances: ['Ice'], immunities: [] },
    Fighting: { weaknesses: ['Flying', 'Psychic', 'Fairy'], resistances: ['Bug', 'Rock', 'Dark'], immunities: [] },
    Poison: { weaknesses: ['Ground', 'Psychic'], resistances: ['Grass', 'Fighting', 'Poison', 'Bug', 'Fairy'], immunities: [] },
    Ground: { weaknesses: ['Water', 'Grass', 'Ice'], resistances: ['Poison', 'Rock'], immunities: ['Electric'] },
    Flying: { weaknesses: ['Electric', 'Ice', 'Rock'], resistances: ['Grass', 'Fighting', 'Bug'], immunities: ['Ground'] },
    Psychic: { weaknesses: ['Bug', 'Ghost', 'Dark'], resistances: ['Fighting', 'Psychic'], immunities: [] },
    Bug: { weaknesses: ['Fire', 'Flying', 'Rock'], resistances: ['Grass', 'Fighting', 'Ground'], immunities: [] },
    Rock: { weaknesses: ['Water', 'Grass', 'Fighting', 'Ground', 'Steel'], resistances: ['Normal', 'Fire', 'Poison', 'Flying'], immunities: [] },
    Ghost: { weaknesses: ['Ghost', 'Dark'], resistances: ['Poison', 'Bug'], immunities: ['Normal', 'Fighting'] },
    Dragon: { weaknesses: ['Ice', 'Dragon', 'Fairy'], resistances: ['Fire', 'Water', 'Grass', 'Electric'], immunities: [] },
    Dark: { weaknesses: ['Fighting', 'Bug', 'Fairy'], resistances: ['Ghost', 'Dark'], immunities: ['Psychic'] },
    Steel: { weaknesses: ['Fire', 'Fighting', 'Ground'], resistances: ['Normal', 'Grass', 'Ice', 'Flying', 'Psychic', 'Bug', 'Rock', 'Dragon', 'Steel', 'Fairy'], immunities: ['Poison'] },
    Fairy: { weaknesses: ['Poison', 'Steel'], resistances: ['Fighting', 'Bug', 'Dark'], immunities: ['Dragon'] }
};

const ABILITY_EFFECTS = {
    'LEVITATE': { immunities: ['Ground'] },
    'EARTH EATER': { immunities: ['Ground'] },
    'WATER ABSORB': { immunities: ['Water'] },
    'DRY SKIN': { immunities: ['Water'], multiply: { Fire: 1.25 } },
    'STORM DRAIN': { immunities: ['Water'] },
    'FLASH FIRE': { immunities: ['Fire'] },
    'WELL-BAKED BODY': { immunities: ['Fire'] },
    'VOLT ABSORB': { immunities: ['Electric'] },
    'LIGHTNING ROD': { immunities: ['Electric'] },
    'MOTOR DRIVE': { immunities: ['Electric'] },
    'SAP SIPPER': { immunities: ['Grass'] },
    'SAPSIPPER': { immunities: ['Grass'] },
    'PURIFYING SALT': { halve: ['Ghost'] },
    'THICK FAT': { halve: ['Fire', 'Ice'] },
    'HEATPROOF': { halve: ['Fire'] },
    'WATER BUBBLE': { halve: ['Fire'] }
};

// ===== UTILITY FUNCTIONS =====
function avgRound(a, b) { return Math.round((parseFloat(a) + parseFloat(b)) / 2 * 10) / 10; }

function formatNumber(x) {
    const n = parseFloat(x);
    return Number.isInteger(n) ? n : n.toFixed(1).replace(/\.0$/, '');
}

function titleCase(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
}

function setStatus(msg) {
    document.getElementById('status-bar').textContent = msg;
}

// ===== TYPE EFFECTIVENESS =====
function calculateTypeEffectiveness(t1, t2, activeAbility = null, passiveAbility = null) {
    const result = {};
    const types = Object.keys(TYPE_EFFECTIVENESS);
    
    for (const atkType of types) {
        let v1 = 1.0, v2 = 1.0;
        
        if (t1) {
            const def = TYPE_EFFECTIVENESS[titleCase(t1)];
            if (def) {
                if (def.weaknesses.includes(titleCase(atkType))) v1 *= 2;
                if (def.resistances.includes(titleCase(atkType))) v1 *= 0.5;
                if (def.immunities.includes(titleCase(atkType))) v1 = 0;
            }
        }
        
        if (t2 && t2 !== t1) {
            const def = TYPE_EFFECTIVENESS[titleCase(t2)];
            if (def) {
                if (def.weaknesses.includes(titleCase(atkType))) v2 *= 2;
                if (def.resistances.includes(titleCase(atkType))) v2 *= 0.5;
                if (def.immunities.includes(titleCase(atkType))) v2 = 0;
            }
        }
        
        // Inverse battle
        if (document.getElementById('inverseBattle').checked) {
            if (v1 > 0) v1 = 1 / v1;
            if (v2 > 0) v2 = 1 / v2;
        }
        
        result[atkType] = v1 * v2;
    }
    
    // Apply abilities
    for (const ability of [activeAbility, passiveAbility]) {
        if (!ability) continue;
        const eff = ABILITY_EFFECTS[ability.toUpperCase()];
        if (eff) {
            for (const imm of (eff.immunities || [])) {
                result[titleCase(imm)] = 0;
            }
            for (const h of (eff.halve || [])) {
                if (result[titleCase(h)] !== undefined) result[titleCase(h)] *= 0.5;
            }
            for (const [t, m] of Object.entries(eff.multiply || {})) {
                if (result[titleCase(t)] !== undefined) result[titleCase(t)] *= m;
            }
        }
    }
    
    // Wonder Guard
    if ((activeAbility === 'Wonder Guard' || passiveAbility === 'Wonder Guard')) {
        for (const k in result) {
            if (result[k] < 2) result[k] = 0;
        }
    }
    
    return result;
}

// ===== FUSION LOGIC =====
function computeFusedTyping(p1t1, p1t2, p2t1, p2t2) {
    let fusedType1 = p1t1;
    let fusedType2 = '';
    
    if (p2t2) {
        if (p2t2 === p1t1) {
            fusedType2 = p2t1 !== p1t1 ? p2t1 : '';
        } else {
            fusedType2 = p2t2 !== p1t1 ? p2t2 : (p2t1 !== p1t1 ? p2t1 : '');
        }
    } else {
        if (p2t1 === p1t1) {
            fusedType2 = p1t2 && p1t2 !== p1t1 ? p1t2 : '';
        } else {
            fusedType2 = p2t1;
        }
    }
    
    return { fusedType1, fusedType2 };
}

function flipStats(stats) {
    const flipped = {};
    for (const k of ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed']) {
        flipped[FLIP_MAP[k] || k] = stats[k] || 0;
    }
    return flipped;
}

// ===== RENDER FUNCTIONS =====
function renderTypeBadge(type) {
    return `<span class="type-badge ${type.toLowerCase()}">${type}</span>`;
}

function renderStatLine(label, value) {
    return `<div class="stat-line"><span class="stat-label">${label}:</span><span class="stat-value">${formatNumber(value)}</span></div>`;
}

function renderDamageTable(effectiveness) {
    const grouped = { 0: [], 0.25: [], 0.5: [], 1: [], 2: [], 4: [] };
    
    for (const [type, val] of Object.entries(effectiveness)) {
        const v = parseFloat(val);
        if (v === 0) grouped[0].push(type);
        else if (v <= 0.25) grouped[0.25].push(type);
        else if (v <= 0.5) grouped[0.5].push(type);
        else if (v >= 4) grouped[4].push(type);
        else if (v >= 2) grouped[2].push(type);
        else grouped[1].push(type);
    }
    
    let html = '<div class="damage-table">';
    for (const [val, types] of Object.entries(grouped)) {
        if (types.length === 0) continue;
        
        let label, cls;
        if (val == 0) { label = 'Immune'; cls = 'immune'; }
        else if (val == 0.25) { label = '1/4x'; cls = 'half'; }
        else if (val == 0.5) { label = '1/2x'; cls = 'half'; }
        else if (val == 1) { label = '1x'; cls = 'normal-dmg'; }
        else if (val == 2) { label = '2x'; cls = 'double'; }
        else if (val == 4) { label = '4x'; cls = 'double'; }
        else { label = `${val}x`; cls = parseFloat(val) > 1 ? 'double' : 'half'; }
        
        html += `<div class="damage-row"><span class="damage-label ${cls}">${label}:</span><div class="damage-types">`;
        html += types.map(t => renderTypeBadge(t)).join('');
        html += '</div></div>';
    }
    html += '</div>';
    return html;
}

function renderPokemonDetails(pokemon, panelKey, isFusion = false) {
    if (!pokemon) return '<p>Select a Pokémon...</p>';
    
    const opts = displayOptions[panelKey];
    const flipOn = document.getElementById('flipStatChallenge').checked;
    let stats = { HP: pokemon.hp, Attack: pokemon.attack, Defense: pokemon.defense, 'Sp. Atk': pokemon.spAttack, 'Sp. Def': pokemon.spDefense, Speed: pokemon.speed };
    if (flipOn) stats = flipStats(stats);
    
    const bst = parseInt(pokemon.bst);
    const abilities = (pokemon.abilities || '').split(', ').filter(a => a);
    const mainAbility = abilities[0] || '';
    const hiddenAbility = abilities[1] || '';
    
    let html = '';
    
    // Type
    if (opts.type) {
        const type1 = pokemon.type1 || '';
        const type2 = pokemon.type2 || '';
        const types = type2 && type2 !== type1 ? `${type1}/${type2}` : type1;
        html += `<div class="type-line">${type1 ? renderTypeBadge(type1) : ''}${type2 ? renderTypeBadge(type2) : ''}</div>`;
    }
    
    // Abilities
    if (opts.abilities && mainAbility) {
        html += `<div class="ability-line"><span class="ability-label">Ability:</span> ${mainAbility}</div>`;
    }
    if (opts.hidden_ability && hiddenAbility) {
        html += `<div class="ability-line"><span class="ability-label">Hidden:</span> ${hiddenAbility}</div>`;
    }
    if (opts.passive && pokemon.passive) {
        html += `<div class="passive-line"><span class="ability-label">Passive:</span> ${pokemon.passive}</div>`;
    }
    
    // BST
    if (opts.bst) {
        html += '<div class="bst-section">';
        for (const stat of ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed']) {
            html += renderStatLine(stat, stats[stat]);
        }
        html += '</div>';
    }
    
    // Total BST
    if (opts.total_bst) {
        html += `<div class="total-bst">Total BST: ${formatNumber(bst)}</div>`;
    }
    
    // Evolution
    if (opts.evolution && pokemon.evolution) {
        const evoList = pokemon.evolution.split(', ');
        html += `<div class="evo-line"><span class="ability-label">Evolution:</span> `;
        html += evoList.map(e => `<span class="evo-species" data-name="${e}">${e}</span>`).join(', ');
        html += '</div>';
    }
    
    // Damage Taken
    if (opts.damage) {
        const eff = calculateTypeEffectiveness(pokemon.type1, pokemon.type2);
        html += renderDamageTable(eff);
    }
    
    return html;
}

function renderFusionDetails(p1, p2) {
    if (!p1 || !p2) return '<p>Select two Pokémon and click Fuse...</p>';
    
    const { fusedType1, fusedType2 } = computeFusedTyping(p1.type1, p1.type2, p2.type1, p2.type2);
    const fusedType = fusedType2 && fusedType2 !== fusedType1 ? `${fusedType1}/${fusedType2}` : fusedType1;
    
    const flipOn = document.getElementById('flipStatChallenge').checked;
    const passiveOn = document.getElementById('passiveActive').checked;
    
    const p1Stats = flipStats({ HP: p1.hp, Attack: p1.attack, Defense: p1.defense, 'Sp. Atk': p1.spAttack, 'Sp. Def': p1.spDefense, Speed: p1.speed });
    const p2Stats = flipStats({ HP: p2.hp, Attack: p2.attack, Defense: p2.defense, 'Sp. Atk': p2.spAttack, 'Sp. Def': p2.spDefense, Speed: p2.speed });
    
    const fusedStats = {};
    for (const k of ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed']) {
        fusedStats[k] = avgRound(p1Stats[k], p2Stats[k]);
    }
    const fusedBST = Object.values(fusedStats).reduce((a, b) => a + b, 0);
    
    const abilities = (p2.abilities || '').split(', ').filter(a => a);
    const activeAbility = abilities[0] || '';
    const hiddenAbility = abilities[1] || '';
    const passiveAbility = p1.passive || '';
    
    const opts = displayOptions.fusion;
    let html = '';
    
    // Fused Type
    if (opts.fused_type) {
        html += `<div class="type-line"><span class="ability-label">Fused Type:</span> ${renderTypeBadge(fusedType1)}${fusedType2 ? renderTypeBadge(fusedType2) : ''}</div>`;
    }
    
    // Abilities
    if (opts.abilities) {
        if (abilities.length > 0) {
            html += `<div class="ability-line"><span class="ability-label">Abilities:</span> ${abilities.join(', ')}</div>`;
        }
        if (activeAbility) {
            html += `<div class="ability-line"><span class="ability-label">Active:</span> ${activeAbility}</div>`;
        }
        if (hiddenAbility && activeAbility === hiddenAbility) {
            html += `<div class="ability-line"><span class="ability-label">Hidden:</span> ${hiddenAbility}</div>`;
        }
        if (opts.ability_effects && activeAbility) {
            const eff = ABILITY_EFFECTS[activeAbility.toUpperCase()];
            if (eff) {
                let parts = [];
                if (eff.immunities) parts.push(`immunities: ${eff.immunities.join(', ')}`);
                if (eff.halve) parts.push(`halves: ${eff.halve.join(', ')}`);
                html += `<div class="ability-line"><span class="ability-label">Active Effect:</span> ${parts.join('; ')}</div>`;
            }
        }
        if (passiveAbility && passiveOn) {
            html += `<div class="passive-line"><span class="ability-label">Passive:</span> ${passiveAbility} (active)</div>`;
        }
    }
    
    // BST
    if (opts.bst) {
        for (const stat of ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed']) {
            html += renderStatLine(stat, fusedStats[stat]);
        }
    }
    
    // Total BST
    if (opts.total_bst) {
        html += `<div class="total-bst">Total BST: ${formatNumber(fusedBST)}</div>`;
    }
    
    // Differences
    if (opts.diffs) {
        const p1BST = parseInt(p1.bst);
        const p2BST = parseInt(p2.bst);
        html += `<div class="stat-line"><span class="stat-label">Diff from ${p1.name}:</span><span class="stat-value">${formatNumber(fusedBST - p1BST)}</span></div>`;
        html += `<div class="stat-line"><span class="stat-label">Diff from ${p2.name}:</span><span class="stat-value">${formatNumber(fusedBST - p2BST)}</span></div>`;
    }
    
    // Quick Compare
    if (opts.quick_compare) {
        const target = p2;
        const effFused = calculateTypeEffectiveness(fusedType1, fusedType2, activeAbility, passiveOn ? passiveAbility : null);
        const effBase = calculateTypeEffectiveness(target.type1, target.type2);
        
        const getGroups = (eff) => {
            const g = { 0: new Set(), 0.25: new Set(), 0.5: new Set(), 1: new Set(), 2: new Set(), 4: new Set() };
            for (const [t, v] of Object.entries(eff)) {
                if (v <= 0) g[0].add(t);
                else if (v <= 0.25) g[0.25].add(t);
                else if (v <= 0.5) g[0.5].add(t);
                else if (v >= 4) g[4].add(t);
                else if (v >= 2) g[2].add(t);
                else g[1].add(t);
            }
            return g;
        };
        
        const gf = getGroups(effFused);
        const gb = getGroups(effBase);
        
        const newImm = [...gf[0]].filter(x => !gb[0].has(x));
        const lostImm = [...gb[0]].filter(x => !gf[0].has(x));
        const newWk = [...gf[2], ...gf[4]].filter(x => !gb[2].has(x) && !gb[4].has(x));
        const lostWk = [...gb[2], ...gb[4]].filter(x => !gf[2].has(x) && !gf[4].has(x));
        const newRes = [...gf[0.25], ...gf[0.5]].filter(x => !gb[0.25].has(x) && !gb[0.5].has(x));
        const lostRes = [...gb[0.25], ...gb[0.5]].filter(x => !gf[0.25].has(x) && !gf[0.5].has(x));
        
        html += '<div class="quick-compare"><h4>Quick Compare vs ' + target.name + ':</h4>';
        if (newImm.length) html += `<div>New immunities: ${newImm.join(', ')}</div>`;
        if (lostImm.length) html += `<div>Lost immunities: ${lostImm.join(', ')}</div>`;
        if (newWk.length) html += `<div>New weaknesses: ${newWk.join(', ')}</div>`;
        if (lostWk.length) html += `<div>Lost weaknesses: ${lostWk.join(', ')}</div>`;
        if (newRes.length) html += `<div>New resistances: ${newRes.join(', ')}</div>`;
        if (lostRes.length) html += `<div>Lost resistances: ${lostRes.join(', ')}</div>`;
        if (!newImm.length && !lostImm.length && !newWk.length && !lostWk.length && !newRes.length && !lostRes.length) {
            html += '<div>No changes in immunities/weaknesses/resistances.</div>';
        }
        html += '</div>';
    }
    
    // Damage Taken
    if (opts.damage) {
        const eff = calculateTypeEffectiveness(fusedType1, fusedType2, activeAbility, passiveOn ? passiveAbility : null);
        html += renderDamageTable(eff);
    }
    
    return html;
}

// ===== UI FUNCTIONS =====
function populateList(listId, filter = '') {
    const list = document.getElementById(listId);
    list.innerHTML = '';
    
    const filterLower = filter.toLowerCase();
    const pokemonNames = Object.keys(pokemonData).filter(name => 
        !filterLower || name.toLowerCase().includes(filterLower)
    ).sort((a, b) => (pokemonData[a].id || 0) - (pokemonData[b].id || 0));
    
    for (const name of pokemonNames) {
        const item = document.createElement('div');
        item.className = 'pokemon-list-item';
        item.textContent = name;
        item.addEventListener('click', () => selectPokemon(name, listId));
        list.appendChild(item);
    }
}

function selectPokemon(name, listId) {
    const panel = listId.replace('list-', '');
    
    // Update selection visual
    document.querySelectorAll(`#${listId} .pokemon-list-item`).forEach(el => el.classList.remove('selected'));
    event.target.classList.add('selected');
    
    if (panel === 'p1') {
        selectedP1 = pokemonData[name];
        document.getElementById('details-p1').innerHTML = renderPokemonDetails(selectedP1, 'p1');
        setupEvolutionLinks('p1');
    } else {
        selectedP2 = pokemonData[name];
        document.getElementById('details-p2').innerHTML = renderPokemonDetails(selectedP2, 'p2');
        setupEvolutionLinks('p2');
    }
    
    hasFusion = false;
    document.getElementById('fusion-details').innerHTML = '';
    setStatus(`Selected ${name}`);
}

function setupEvolutionLinks(panel) {
    const container = panel === 'p1' ? document.getElementById('details-p1') : document.getElementById('details-p2');
    container.querySelectorAll('.evo-species').forEach(el => {
        el.addEventListener('click', () => {
            const name = el.dataset.name;
            if (pokemonData[name]) {
                if (panel === 'p1') {
                    selectedP1 = pokemonData[name];
                    document.getElementById('details-p1').innerHTML = renderPokemonDetails(selectedP1, 'p1');
                    populateList('list-p1', document.getElementById('search-p1').value);
                } else {
                    selectedP2 = pokemonData[name];
                    document.getElementById('details-p2').innerHTML = renderPokemonDetails(selectedP2, 'p2');
                    populateList('list-p2', document.getElementById('search-p2').value);
                }
            }
        });
    });
}

function fuse() {
    if (!selectedP1 || !selectedP2) {
        setStatus('Please select two Pokémon first');
        return;
    }
    
    const fusion = renderFusionDetails(selectedP1, selectedP2);
    document.getElementById('fusion-details').innerHTML = fusion;
    hasFusion = true;
    
    const { fusedType1, fusedType2 } = computeFusedTyping(selectedP1.type1, selectedP1.type2, selectedP2.type1, selectedP2.type2);
    const fusedType = fusedType2 && fusedType2 !== fusedType1 ? `${fusedType1}/${fusedType2}` : fusedType1;
    setStatus(`Fused: ${selectedP1.name} + ${selectedP2.name} = ${fusedType}`);
}

function swap() {
    const temp = selectedP1;
    selectedP1 = selectedP2;
    selectedP2 = temp;
    
    document.getElementById('details-p1').innerHTML = renderPokemonDetails(selectedP1, 'p1');
    document.getElementById('details-p2').innerHTML = renderPokemonDetails(selectedP2, 'p2');
    populateList('list-p1', document.getElementById('search-p1').value);
    populateList('list-p2', document.getElementById('search-p2').value);
    
    if (hasFusion) fuse();
}

function clearSelections() {
    selectedP1 = null;
    selectedP2 = null;
    hasFusion = false;
    document.getElementById('details-p1').innerHTML = '';
    document.getElementById('details-p2').innerHTML = '';
    document.getElementById('fusion-details').innerHTML = '';
    populateList('list-p1');
    populateList('list-p2');
    setStatus('Ready');
}

function toggleDisplayOptions() {
    document.getElementById('displayOptionsModal').classList.toggle('show');
}

function refreshDisplay() {
    if (selectedP1) document.getElementById('details-p1').innerHTML = renderPokemonDetails(selectedP1, 'p1');
    if (selectedP2) document.getElementById('details-p2').innerHTML = renderPokemonDetails(selectedP2, 'p2');
    if (hasFusion && selectedP1 && selectedP2) fuse();
}

// ===== INITIALIZATION =====
function init() {
    // Load data from global pokemonData
    if (typeof POKEMON_DATA !== 'undefined') {
        pokemonData = POKEMON_DATA;
    } else {
        console.error('Pokemon data not loaded!');
        setStatus('Error: Pokemon data not found');
        return;
    }
    
    // Populate lists
    populateList('list-p1');
    populateList('list-p2');
    
    // Search handlers
    document.getElementById('search-p1').addEventListener('input', (e) => populateList('list-p1', e.target.value));
    document.getElementById('search-p2').addEventListener('input', (e) => populateList('list-p2', e.target.value));
    
    // Button handlers
    document.getElementById('fuseBtn').addEventListener('click', fuse);
    document.getElementById('swapBtn').addEventListener('click', swap);
    document.getElementById('clearBtn').addEventListener('click', clearSelections);
    document.getElementById('displayOptionsBtn').addEventListener('click', toggleDisplayOptions);
    document.getElementById('closeOptionsBtn').addEventListener('click', toggleDisplayOptions);
    
    // Challenge toggles
    document.getElementById('flipStatChallenge').addEventListener('change', refreshDisplay);
    document.getElementById('inverseBattle').addEventListener('change', refreshDisplay);
    document.getElementById('passiveActive').addEventListener('change', refreshDisplay);
    
    // Display options
    document.querySelectorAll('#displayOptionsModal input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            displayOptions[cb.dataset.panel][cb.dataset.key] = cb.checked;
            refreshDisplay();
        });
    });
    
    setStatus('Ready - Select two Pokemon and click Fuse');
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
