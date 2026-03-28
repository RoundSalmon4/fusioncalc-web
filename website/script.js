/**
 * PokéRogue Fusion Calculator - BSD 3-Clause License
 * Copyright (c) 2024
 */

// ===== DATA & STATE =====
let pokemonData = {};
let selectedP1 = null;
let selectedP2 = null;
let hasFusion = false;

// Generation boundaries and overrides (from fusioncalc.py)
const GEN_BOUNDARIES = [[1,151],[152,251],[252,386],[387,493],[494,649],[650,721],[722,809],[810,905],[906,1025]];
const GEN_OVERRIDES = {
    2670: 6, 2019: 7, 2020: 7, 2027: 7, 2028: 7, 2037: 7, 2038: 7, 2050: 7, 2051: 7, 2052: 7, 2053: 7, 2074: 7, 2075: 7, 2076: 7, 2088: 7, 2089: 7,
    4052: 8, 863: 8, 4077: 8, 4078: 8, 4079: 8, 4080: 8, 4199: 8, 4083: 8, 865: 8, 4144: 8, 4145: 8, 4146: 8, 4222: 8, 864: 8, 4263: 8, 4264: 8, 862: 8, 4554: 8, 4555: 8, 4562: 8, 867: 8, 4618: 8, 6058: 8, 6059: 8, 6100: 8, 6101: 8, 6211: 8, 904: 8, 6215: 8, 903: 8, 6570: 8, 6571: 8,
    8128: 9, 8194: 9, 980: 9, 8901: 9
};

function idToGen(pokeId) {
    if (GEN_OVERRIDES[pokeId]) return GEN_OVERRIDES[pokeId];
    for (let i = 0; i < GEN_BOUNDARIES.length; i++) {
        if (GEN_BOUNDARIES[i][0] <= pokeId && pokeId <= GEN_BOUNDARIES[i][1]) return i + 1;
    }
    return 9;
}

const ALL_TYPES = ['Normal','Fire','Water','Grass','Electric','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];

const FILTER_STATE = {
    enabled: false,
    scope: 'both',
    sortKey: 'ID',
    sortAsc: true,
    genFilter: 0,
    typeFilter: { mode: 'any', typeA: '', typeB: '' },
    damageFilters: [],
    rules: {
        'HP': { on: false, op: '>=', value: 0 },
        'Attack': { on: false, op: '>=', value: 0 },
        'Defense': { on: false, op: '>=', value: 0 },
        'Sp. Atk': { on: false, op: '>=', value: 0 },
        'Sp. Def': { on: false, op: '>=', value: 0 },
        'Speed': { on: false, op: '>=', value: 0 },
        'BST': { on: false, op: '>=', value: 0 },
        'ID': { on: false, op: '>=', value: 0 }
    }
};

const STAT_KEYMAP = {
    'HP': 'HP', 'Attack': 'Attack', 'Defense': 'Defense',
    'Sp. Atk': 'Sp. Atk', 'Sp. Def': 'Sp. Def',
    'Speed': 'Speed', 'BST': 'bst', 'ID': 'id'
};

const OPS = {
    '>': (a, b) => a > b,
    '>=': (a, b) => a >= b,
    '<': (a, b) => a < b,
    '<=': (a, b) => a <= b,
    '=': (a, b) => a === b
};

function pokemonPassesFilters(stats) {
    if (!FILTER_STATE.enabled) return true;
    
    const flipOn = document.getElementById('flipStatChallenge').checked;
    
    // Generation filter
    if (FILTER_STATE.genFilter !== 0) {
        const pokeGen = idToGen(parseInt(stats.id) || 0);
        if (pokeGen !== FILTER_STATE.genFilter) return false;
    }
    
    // Stat filters
    for (const [stat, rule] of Object.entries(FILTER_STATE.rules)) {
        if (!rule.on) continue;
        const op = OPS[rule.op];
        if (!op) return false;
        
        let lookupKey = STAT_KEYMAP[stat];
        if (flipOn && FLIP_MAP[stat]) {
            lookupKey = STAT_KEYMAP[FLIP_MAP[stat]];
        }
        
        const left = parseFloat(stats[lookupKey] || 0);
        const right = parseFloat(rule.value);
        if (!op(left, right)) return false;
    }
    
    // Type filter
    const tf = FILTER_STATE.typeFilter;
    const t1 = (stats.type1 || '').toLowerCase();
    const t2 = (stats.type2 || '').toLowerCase();
    const ta = (tf.typeA || '').toLowerCase();
    const tb = (tf.typeB || '').toLowerCase();
    const t2Empty = !t2 || t2 === t1;
    
    if (tf.mode === 'mono') {
        if (ta && (t1 !== ta || !t2Empty)) return false;
    } else if (tf.mode === 'dual') {
        if (ta && tb) {
            if (!((t1 === ta && t2 === tb) || (t1 === tb && t2 === ta))) return false;
        } else if (ta) {
            if (!(t1 === ta && t2Empty)) return false;
        }
    } else if (tf.mode === 'a_or_b') {
        if (ta && tb) {
            const hasA = t1 === ta || t2 === ta;
            const hasB = t1 === tb || t2 === tb;
            if (!hasA && !hasB) return false;
        } else if (ta) {
            if (t1 !== ta && t2 !== ta) return false;
        }
    }
    
    // Damage filters (all must pass)
    for (const df of FILTER_STATE.damageFilters) {
        if (!df.on || !df.typeName) continue;
        const invOn = document.getElementById('inverseBattle')?.checked || false;
        const eff = calculateTypeEffectiveness(stats.type1, stats.type2);
        let dmg = parseFloat(eff[df.typeName] || 1.0);
        
        if (invOn) {
            dmg = invertValue(dmg);
        }
        
        const op = OPS[df.op];
        if (op && !op(dmg, parseFloat(df.value))) return false;
    }
    
    return true;
}

const displayOptions = {
    p1: { type: true, abilities: true, hidden_ability: true, passive: true, bst: true, total_bst: true, evolution: true, damage: true },
    p2: { type: true, abilities: true, hidden_ability: true, passive: true, bst: true, total_bst: true, evolution: true, damage: true },
    fusion: { fused_type: true, abilities: true, bst: true, total_bst: true, diffs: true, ability_effects: true, damage: true }
};

const FLIP_MAP = { HP: 'Speed', Speed: 'HP', Attack: 'Sp. Def', 'Sp. Def': 'Attack', Defense: 'Sp. Atk', 'Sp. Atk': 'Defense' };

const NATURES = {
    'Adamant': { increases: 'Attack', decreases: 'Sp. Atk' },
    'Bashful': { increases: 'Sp. Atk', decreases: 'Sp. Atk' },
    'Bold': { increases: 'Defense', decreases: 'Attack' },
    'Brave': { increases: 'Attack', decreases: 'Speed' },
    'Calm': { increases: 'Sp. Def', decreases: 'Attack' },
    'Careful': { increases: 'Sp. Def', decreases: 'Sp. Atk' },
    'Docile': { increases: 'Defense', decreases: 'Defense' },
    'Gentle': { increases: 'Sp. Def', decreases: 'Defense' },
    'Hardy': { increases: 'Attack', decreases: 'Attack' },
    'Hasty': { increases: 'Speed', decreases: 'Defense' },
    'Impish': { increases: 'Defense', decreases: 'Sp. Atk' },
    'Jolly': { increases: 'Speed', decreases: 'Sp. Atk' },
    'Lax': { increases: 'Defense', decreases: 'Sp. Def' },
    'Lonely': { increases: 'Attack', decreases: 'Defense' },
    'Mild': { increases: 'Sp. Atk', decreases: 'Defense' },
    'Modest': { increases: 'Sp. Atk', decreases: 'Attack' },
    'Naive': { increases: 'Speed', decreases: 'Sp. Def' },
    'Naughty': { increases: 'Attack', decreases: 'Sp. Def' },
    'Quiet': { increases: 'Sp. Atk', decreases: 'Speed' },
    'Quirky': { increases: 'Sp. Def', decreases: 'Sp. Def' },
    'Rash': { increases: 'Sp. Atk', decreases: 'Sp. Def' },
    'Relaxed': { increases: 'Defense', decreases: 'Speed' },
    'Sassy': { increases: 'Sp. Def', decreases: 'Speed' },
    'Serious': { increases: 'Speed', decreases: 'Speed' },
    'Timid': { increases: 'Speed', decreases: 'Attack' }
};

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
function invertValue(v) {
    if (v <= 0) return 2;
    if (v <= 0.25) return 4;
    if (v <= 0.5) return 2;
    if (v >= 4) return 0.25;
    if (v >= 2) return 0.5;
    return 1;
}

function calculateTypeEffectiveness(t1, t2, activeAbility = null, passiveAbility = null) {
    const result = {};
    const types = Object.keys(TYPE_EFFECTIVENESS);
    const inverseOn = document.getElementById('inverseBattle')?.checked || false;
    
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
        
        if (inverseOn) {
            v1 = invertValue(v1);
            v2 = invertValue(v2);
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
    if ((activeAbility?.toUpperCase() === 'WONDER GUARD' || passiveAbility?.toUpperCase() === 'WONDER GUARD')) {
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
    const otherGroups = {};
    
    for (const [type, val] of Object.entries(effectiveness)) {
        const v = parseFloat(val);
        if (v === 0) grouped[0].push(type);
        else if (v <= 0.25) grouped[0.25].push(type);
        else if (v <= 0.5) grouped[0.5].push(type);
        else if (v >= 4) grouped[4].push(type);
        else if (v >= 2) grouped[2].push(type);
        else if (v === 1) grouped[1].push(type);
        else {
            if (!otherGroups[v]) otherGroups[v] = [];
            otherGroups[v].push(type);
        }
    }
    
    let html = '<div class="damage-table">';
    const order = [0, 0.25, 0.5, 1, 2, 4];
    for (const val of order) {
        const types = grouped[val];
        if (!types || types.length === 0) continue;
        types.sort();
        
        let label, cls;
        if (val == 0) { label = 'Immune'; cls = 'immune'; }
        else if (val == 0.25) { label = '1/4x'; cls = 'half'; }
        else if (val == 0.5) { label = '1/2x'; cls = 'half'; }
        else if (val == 1) { label = '1x'; cls = 'normal-dmg'; }
        else if (val == 2) { label = '2x'; cls = 'double'; }
        else if (val == 4) { label = '4x'; cls = 'double'; }
        
        html += `<div class="damage-row"><span class="damage-label ${cls}">${label}:</span><div class="damage-types">`;
        html += types.map(t => renderTypeBadge(t)).join('');
        html += '</div></div>';
    }
    
    const otherKeys = Object.keys(otherGroups).map(Number).sort((a, b) => b - a);
    for (const val of otherKeys) {
        const types = otherGroups[val];
        if (!types || types.length === 0) continue;
        types.sort();
        const label = `${val}x`;
        const cls = parseFloat(val) > 1 ? 'double' : 'half';
        html += `<div class="damage-row"><span class="damage-label ${cls}">${label}:</span><div class="damage-types">`;
        html += types.map(t => renderTypeBadge(t)).join('');
        html += '</div></div>';
    }
    
    html += '</div>';
    return html;
}

function getPokemonSprite(pokemon, name) {
    if (!pokemon || !pokemon.id) return '';
    const imgId = pokemon.img || pokemon.id;
    return `<div class="pokemon-sprite"><img src="website/images/${imgId}_0.png" alt="${name}" onerror="this.style.display='none'; this.parentElement.classList.add('no-sprite');"></div>`;
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
    
    // Sprite (only for Pokemon 1 and 2 - excluded for forms like Mega, Gigantamax, etc)
    if (!isFusion && (panelKey === 'p1' || panelKey === 'p2')) {
        const name = pokemon.name || '';
        html += getPokemonSprite(pokemon, name);
    }
    
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
        const eff = calculateTypeEffectiveness(pokemon.type1, pokemon.type2, null, pokemon.passive || null);
        html += renderDamageTable(eff);
    }
    
    // Update Pokedex ID display
    const idEl = document.getElementById('id-' + panelKey);
    if (idEl) {
        idEl.textContent = 'Pokedex ID: ' + (pokemon.id || '?');
    }
    
    return html;
}

function renderFusionDetails(p1, p2) {
    if (!p1 || !p2) return '<p>Select two Pokémon and click Fuse...</p>';
    
    const { fusedType1, fusedType2 } = computeFusedTyping(p1.type1, p1.type2, p2.type1, p2.type2);
    const fusedType = fusedType2 && fusedType2 !== fusedType1 ? `${fusedType1}/${fusedType2}` : fusedType1;
    
    const flipOn = document.getElementById('flipStatChallenge').checked;
    const passiveOn = document.getElementById('passiveActive').checked;
    
    const p1BaseStats = { HP: p1.hp, Attack: p1.attack, Defense: p1.defense, 'Sp. Atk': p1.spAttack, 'Sp. Def': p1.spDefense, Speed: p1.speed };
    const p2BaseStats = { HP: p2.hp, Attack: p2.attack, Defense: p2.defense, 'Sp. Atk': p2.spAttack, 'Sp. Def': p2.spDefense, Speed: p2.speed };
    
    const abilities = (p2.abilities || '').split(', ').filter(a => a);
    const selectedAbilityEl = document.getElementById('activeAbility');
    const activeAbility = selectedAbilityEl && selectedAbilityEl.value ? selectedAbilityEl.value : (abilities[0] || '');
    const hiddenAbility = abilities[1] || '';
    const passiveAbility = p1.passive || '';
    
    const fusedStats = {};
    for (const k of ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed']) {
        fusedStats[k] = avgRound(p1BaseStats[k], p2BaseStats[k]);
    }
    
    // Wonder Guard sets HP to 1
    const activeAbilityUpper = activeAbility.toUpperCase();
    const passiveAbilityUpper = passiveAbility.toUpperCase();
    const hasWonderGuard = activeAbilityUpper === 'WONDER GUARD' || (passiveOn && passiveAbilityUpper === 'WONDER GUARD');
    if (hasWonderGuard) {
        fusedStats.HP = 1;
    }
    
    const fusedBST = Math.round(Object.values(fusedStats).reduce((a, b) => a + b, 0) * 10) / 10;
    
    let displayStats = fusedStats;
    if (flipOn) {
        displayStats = flipStats(fusedStats);
    }
    
    const selectedNatureEl = document.getElementById('activeNature');
    const activeNature = selectedNatureEl && selectedNatureEl.value ? selectedNatureEl.value : '';
    const natureEffect = activeNature && NATURES[activeNature] ? NATURES[activeNature] : null;
    
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
        if (activeNature) {
            const inc = natureEffect.increases;
            const dec = natureEffect.decreases;
            const incChange = inc !== dec ? ` (+10% ${inc})` : '';
            const decChange = inc !== dec ? ` (-10% ${dec})` : '';
            html += `<div class="ability-line"><span class="ability-label" title="Shown for reference; not applied to BST (no IV data)">Active Nature:</span> ${activeNature}${incChange}${decChange}</div>`;
        }
        if (hiddenAbility && activeAbility === hiddenAbility) {
            html += `<div class="ability-line"><span class="ability-label">Hidden:</span> ${hiddenAbility}</div>`;
        }
        if (opts.ability_effects && activeAbility) {
            const eff = ABILITY_EFFECTS[activeAbility.toUpperCase()];
            let parts = [];
            if (eff) {
                if (eff.immunities) parts.push(`immunities: ${eff.immunities.join(', ')}`);
                if (eff.halve) parts.push(`halves: ${eff.halve.join(', ')}`);
            }
            if (activeAbility.toUpperCase() === 'WONDER GUARD') {
                parts.push('immune to all non-super-effective');
            }
            if (parts.length > 0) {
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
            html += renderStatLine(stat, displayStats[stat]);
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
    
    const panel = listId.replace('list-', '');
    const filterLower = filter.toLowerCase();
    
    let pokemonList = Object.entries(pokemonData).filter(([name, stats]) => {
        // Name filter
        if (filterLower && !name.toLowerCase().includes(filterLower)) return false;
        
        // Scope check
        if (FILTER_STATE.scope === 'p1' && panel === 'p2') return true;
        if (FILTER_STATE.scope === 'p2' && panel === 'p1') return true;
        
        // Apply filters
        return pokemonPassesFilters(stats);
    });
    
    // Sort
    const sk = FILTER_STATE.sortKey;
    const sa = FILTER_STATE.sortAsc;
    pokemonList.sort((a, b) => {
        let valA, valB;
        if (sk === 'Name') {
            valA = a[0].toLowerCase();
            valB = b[0].toLowerCase();
            return sa ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            const key = STAT_KEYMAP[sk];
            valA = parseFloat(a[1][key] || 0);
            valB = parseFloat(b[1][key] || 0);
            return sa ? valA - valB : valB - valA;
        }
    });
    
    for (const [name] of pokemonList) {
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
        selectedP1.name = name;
        document.getElementById('title-p1').textContent = name;
        document.getElementById('details-p1').innerHTML = renderPokemonDetails(selectedP1, 'p1');
        setupEvolutionLinks('p1');
    } else {
        selectedP2 = pokemonData[name];
        selectedP2.name = name;
        document.getElementById('title-p2').textContent = name;
        document.getElementById('details-p2').innerHTML = renderPokemonDetails(selectedP2, 'p2');
        setupEvolutionLinks('p2');
        populateActiveAbilityDropdown(selectedP2);
    }
    
    hasFusion = false;
    document.getElementById('fusion-details').innerHTML = '';
    setStatus(`Selected ${name}`);
}

function setupEvolutionLinks(panel) {
    const container = panel === 'p1' ? document.getElementById('details-p1') : document.getElementById('details-p2');
    container.querySelectorAll('.evo-species').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = el.dataset.name;
            if (pokemonData[name]) {
                const listId = panel === 'p1' ? 'list-p1' : 'list-p2';
                
                if (panel === 'p1') {
                    selectedP1 = pokemonData[name];
                    selectedP1.name = name;
                    document.getElementById('title-p1').textContent = name;
                    document.getElementById('details-p1').innerHTML = renderPokemonDetails(selectedP1, 'p1');
                    setupEvolutionLinks('p1');
                } else {
                    selectedP2 = pokemonData[name];
                    selectedP2.name = name;
                    document.getElementById('title-p2').textContent = name;
                    document.getElementById('details-p2').innerHTML = renderPokemonDetails(selectedP2, 'p2');
                    setupEvolutionLinks('p2');
                    populateActiveAbilityDropdown(selectedP2);
                }
                
                // Populate and highlight in list
                populateList(listId, name);
                document.querySelectorAll(`#${listId} .pokemon-list-item`).forEach(item => {
                    if (item.textContent === name) {
                        item.classList.add('selected');
                        item.scrollIntoView({ block: 'center' });
                    }
                });
                
                setStatus(`Selected ${name}`);
            } else {
                setStatus(`Pokemon ${name} not found in data`);
            }
        });
    });
}

function populateActiveAbilityDropdown(pokemon) {
    const select = document.getElementById('activeAbility');
    const abilities = (pokemon.abilities || '').split(', ').filter(a => a);
    
    select.innerHTML = '';
    abilities.forEach(ability => {
        const option = document.createElement('option');
        option.value = ability;
        option.textContent = ability;
        select.appendChild(option);
    });
    
    if (abilities.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'None';
        select.appendChild(option);
    }
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
    
    const activeAbilityEl = document.getElementById('activeAbility');
    const activeAbility = activeAbilityEl ? activeAbilityEl.value : '';
    
    setStatus(`Fused: ${selectedP1.name} + ${selectedP2.name} = ${fusedType} (Active: ${activeAbility || 'None'})`);
}

function swap() {
    const temp = selectedP1;
    selectedP1 = selectedP2;
    selectedP2 = temp;
    
    document.getElementById('title-p1').textContent = selectedP1 ? selectedP1.name : 'Pokémon 1';
    document.getElementById('title-p2').textContent = selectedP2 ? selectedP2.name : 'Pokémon 2';
    document.getElementById('details-p1').innerHTML = renderPokemonDetails(selectedP1, 'p1');
    document.getElementById('details-p2').innerHTML = renderPokemonDetails(selectedP2, 'p2');
    populateList('list-p1', document.getElementById('search-p1').value);
    populateList('list-p2', document.getElementById('search-p2').value);
    
    if (selectedP2) {
        populateActiveAbilityDropdown(selectedP2);
    }
}

function clearSelections() {
    selectedP1 = null;
    selectedP2 = null;
    hasFusion = false;
    document.getElementById('title-p1').textContent = 'Pokémon 1';
    document.getElementById('title-p2').textContent = 'Pokémon 2';
    document.getElementById('details-p1').innerHTML = '';
    document.getElementById('details-p2').innerHTML = '';
    document.getElementById('fusion-details').innerHTML = '';
    document.getElementById('search-p1').value = '';
    document.getElementById('search-p2').value = '';
    populateList('list-p1', '');
    populateList('list-p2', '');
    setStatus('Ready');
}

function initNatures() {
    const select = document.getElementById('activeNature');
    select.innerHTML = '';
    
    const noneOption = document.createElement('option');
    noneOption.value = '';
    noneOption.textContent = 'None';
    select.appendChild(noneOption);
    
    Object.keys(NATURES).sort().forEach(nature => {
        const option = document.createElement('option');
        option.value = nature;
        option.textContent = nature;
        select.appendChild(option);
    });
}

function toggleDisplayOptions() {
    document.getElementById('displayOptionsModal').classList.toggle('show');
}

function resetDisplayOptions() {
    displayOptions.p1 = { type: true, abilities: true, hidden_ability: true, passive: true, bst: true, total_bst: true, evolution: true, damage: true };
    displayOptions.p2 = { type: true, abilities: true, hidden_ability: true, passive: true, bst: true, total_bst: true, evolution: true, damage: true };
    displayOptions.fusion = { fused_type: true, abilities: true, bst: true, total_bst: true, diffs: true, ability_effects: true, damage: true };
    
    document.querySelectorAll('#displayOptionsModal input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
    });
    
    refreshDisplay();
    setStatus('Display options reset to default');
}

function refreshDisplay() {
    if (selectedP1) document.getElementById('details-p1').innerHTML = renderPokemonDetails(selectedP1, 'p1');
    if (selectedP2) document.getElementById('details-p2').innerHTML = renderPokemonDetails(selectedP2, 'p2');
    if (hasFusion && selectedP1 && selectedP2) fuse();
}

// ===== FILTERS =====
function toggleFiltersModal() {
    document.getElementById('filtersModal').classList.toggle('show');
}

function updateTypeFilterUI() {
    const mode = document.getElementById('typeMode').value;
    const typeB = document.getElementById('typeB');
    const typeHelp = document.getElementById('typeHelp');
    
    if (mode === 'mono') {
        typeB.disabled = true;
        typeB.style.opacity = '0.5';
        typeHelp.textContent = 'Filter for Pokémon with only this type';
    } else if (mode === 'dual') {
        typeB.disabled = false;
        typeB.style.opacity = '1';
        typeHelp.textContent = 'Both types required';
    } else if (mode === 'a_or_b') {
        typeB.disabled = false;
        typeB.style.opacity = '1';
        typeHelp.textContent = 'Both types required';
    }
}

function createDamageFilterRow(filter = null) {
    const row = document.createElement('div');
    row.className = 'filter-row damage-filter-row';
    const idx = FILTER_STATE.damageFilters.length;
    
    row.innerHTML = `
        <label>
            <input type="checkbox" class="damage-filter-enabled" ${filter && filter.on ? 'checked' : ''}>
        </label>
        <select class="damage-filter-type">
            <option value="">Type</option>
            ${ALL_TYPES.map(t => `<option value="${t}" ${filter && filter.typeName === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
        <select class="damage-filter-op">
            <option value=">=" ${!filter || filter.op === '>=' ? 'selected' : ''}>>=</option>
            <option value="<=" ${filter && filter.op === '<=' ? 'selected' : ''}><=</option>
            <option value=">" ${filter && filter.op === '>' ? 'selected' : ''}>></option>
            <option value="<" ${filter && filter.op === '<' ? 'selected' : ''}><</option>
            <option value="=" ${filter && filter.op === '=' ? 'selected' : ''}>=</option>
        </select>
        <input type="number" class="damage-filter-value" value="${filter ? filter.value : 1}" step="0.25" min="0">
        <button class="damage-filter-remove btn-danger" style="padding: 2px 8px; font-size: 10px;">X</button>
    `;
    
    row.querySelector('.damage-filter-remove').addEventListener('click', () => {
        const index = Array.from(document.querySelectorAll('.damage-filter-row')).indexOf(row);
        if (index >= 0) {
            FILTER_STATE.damageFilters.splice(index, 1);
            row.remove();
        }
    });
    
    return row;
}

function addDamageFilter() {
    const list = document.getElementById('damageFiltersList');
    const newFilter = { on: true, typeName: '', op: '>=', value: 1 };
    FILTER_STATE.damageFilters.push(newFilter);
    list.appendChild(createDamageFilterRow(newFilter));
}

function initFilters() {
    // Populate type dropdowns
    const typeA = document.getElementById('typeA');
    const typeB = document.getElementById('typeB');
    
    ALL_TYPES.forEach(type => {
        typeA.add(new Option(type, type));
        typeB.add(new Option(type, type));
    });
    
    // Type mode change handler
    document.getElementById('typeMode').addEventListener('change', updateTypeFilterUI);
    updateTypeFilterUI();
    
    // Add damage filter button
    document.getElementById('addDamageFilterBtn').addEventListener('click', addDamageFilter);
    
    // Generate stat filters
    const statFiltersEl = document.getElementById('statFilters');
    statFiltersEl.innerHTML = '';
    
    const statLabels = { 'HP': 'HP', 'Attack': 'Attack', 'Defense': 'Defense', 'Sp. Atk': 'Sp. Atk', 'Sp. Def': 'Sp. Def', 'Speed': 'Speed', 'BST': 'BST', 'ID': 'ID' };
    
    for (const [stat, label] of Object.entries(statLabels)) {
        const row = document.createElement('div');
        row.className = 'stat-filter-row';
        
        const rule = FILTER_STATE.rules[stat];
        
        row.innerHTML = `
            <label>${label}</label>
            <input type="checkbox" data-stat="${stat}" ${rule.on ? 'checked' : ''}>
            <select data-stat="${stat}" class="stat-op">
                <option value=">=" ${rule.op === '>=' ? 'selected' : ''}>>=</option>
                <option value="<=" ${rule.op === '<=' ? 'selected' : ''}><=</option>
                <option value=">" ${rule.op === '>' ? 'selected' : ''}>></option>
                <option value="<" ${rule.op === '<' ? 'selected' : ''}><</option>
                <option value="=" ${rule.op === '=' ? 'selected' : ''}>=</option>
            </select>
            <input type="number" data-stat="${stat}" value="${rule.value}" min="0" step="1">
        `;
        
        statFiltersEl.appendChild(row);
    }
}

function applyFilters() {
    FILTER_STATE.enabled = document.getElementById('filterEnabled').checked;
    FILTER_STATE.scope = document.getElementById('filterScope').value;
    FILTER_STATE.sortKey = document.getElementById('sortKey').value;
    FILTER_STATE.sortAsc = document.getElementById('sortOrder').value === 'asc';
    FILTER_STATE.genFilter = parseInt(document.getElementById('genFilter').value);
    
    // Type filter
    FILTER_STATE.typeFilter.mode = document.getElementById('typeMode').value;
    FILTER_STATE.typeFilter.typeA = document.getElementById('typeA').value;
    FILTER_STATE.typeFilter.typeB = document.getElementById('typeB').value;
    
    // Stat filters
    document.querySelectorAll('#statFilters .stat-filter-row').forEach(row => {
        const stat = row.querySelector('input[type="checkbox"]').dataset.stat;
        FILTER_STATE.rules[stat].on = row.querySelector('input[type="checkbox"]').checked;
        FILTER_STATE.rules[stat].op = row.querySelector('.stat-op').value;
        FILTER_STATE.rules[stat].value = parseFloat(row.querySelector('input[type="number"]').value) || 0;
    });
    
    // Damage filters
    const damageFilterRows = document.querySelectorAll('.damage-filter-row');
    FILTER_STATE.damageFilters = [];
    damageFilterRows.forEach(row => {
        FILTER_STATE.damageFilters.push({
            on: row.querySelector('.damage-filter-enabled').checked,
            typeName: row.querySelector('.damage-filter-type').value,
            op: row.querySelector('.damage-filter-op').value,
            value: parseFloat(row.querySelector('.damage-filter-value').value) || 1
        });
    });
    
    populateList('list-p1', document.getElementById('search-p1').value);
    populateList('list-p2', document.getElementById('search-p2').value);
    setStatus('Filters applied');
}

function clearFilters() {
    FILTER_STATE.enabled = false;
    FILTER_STATE.scope = 'both';
    FILTER_STATE.sortKey = 'ID';
    FILTER_STATE.sortAsc = true;
    FILTER_STATE.genFilter = 0;
    FILTER_STATE.typeFilter = { mode: 'mono', typeA: '', typeB: '' };
    FILTER_STATE.damageFilters = [];
    
    for (const stat in FILTER_STATE.rules) {
        FILTER_STATE.rules[stat] = { on: false, op: '>=', value: 0 };
    }
    
    // Reset UI
    document.getElementById('filterEnabled').checked = false;
    document.getElementById('filterScope').value = 'both';
    document.getElementById('sortKey').value = 'ID';
    document.getElementById('sortOrder').value = 'asc';
    document.getElementById('genFilter').value = '0';
    document.getElementById('typeMode').value = 'mono';
    document.getElementById('typeA').value = '';
    document.getElementById('typeB').value = '';
    document.getElementById('damageFiltersList').innerHTML = '';
    
    document.querySelectorAll('#statFilters .stat-filter-row').forEach(row => {
        const stat = row.querySelector('input[type="checkbox"]').dataset.stat;
        row.querySelector('input[type="checkbox"]').checked = false;
        row.querySelector('.stat-op').value = '>=';
        row.querySelector('input[type="number"]').value = '0';
    });
    
    updateTypeFilterUI();
    
    populateList('list-p1', document.getElementById('search-p1').value);
    populateList('list-p2', document.getElementById('search-p2').value);
    setStatus('Filters cleared');
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
    
    // Initialize filters
    initFilters();
    
    // Initialize natures
    initNatures();
    
    // Search handlers
    document.getElementById('search-p1').addEventListener('input', (e) => populateList('list-p1', e.target.value));
    document.getElementById('search-p2').addEventListener('input', (e) => populateList('list-p2', e.target.value));
    
    // Button handlers
    document.getElementById('fuseBtn').addEventListener('click', fuse);
    document.getElementById('swapBtn').addEventListener('click', swap);
    document.getElementById('clearBtn').addEventListener('click', clearSelections);
    document.getElementById('displayOptionsBtn').addEventListener('click', toggleDisplayOptions);
    document.getElementById('closeOptionsBtn').addEventListener('click', toggleDisplayOptions);
    document.getElementById('resetOptionsBtn').addEventListener('click', resetDisplayOptions);
    
    // Filter handlers
    document.getElementById('filtersBtn').addEventListener('click', toggleFiltersModal);
    document.getElementById('closeFiltersBtn').addEventListener('click', toggleFiltersModal);
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
    
    // Active ability selector
    document.getElementById('activeAbility').addEventListener('change', () => {
        if (hasFusion) fuse();
    });
    
    // Active nature selector
    document.getElementById('activeNature').addEventListener('change', () => {
        if (hasFusion) fuse();
    });
    
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
