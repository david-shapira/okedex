// ===== TYPE COLORS (from React component) =====
const typeColors = {
    normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
    grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
    ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
    rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
    steel: '#B7B7CE', fairy: '#D685AD'
};

// ===== STAT NAME TRANSLATIONS (from React component) =====
const statNames = {
    'hp': 'HP',
    'attack': 'Attack',
    'defense': 'Defense',
    'special-attack': 'Sp. Attack',
    'special-defense': 'Sp. Defense',
    'speed': 'Speed'
};

// ===== DOM ELEMENTS =====
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('detail-search-input');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const detailSection = document.getElementById('pokemon-detail');

const detailHeader = document.getElementById('detail-header');
const detailName = document.getElementById('detail-name');
const detailId = document.getElementById('detail-id');
const detailTypes = document.getElementById('detail-types');
const detailSprite = document.getElementById('detail-sprite');
const hoverHint = document.getElementById('hover-hint');
const detailHeight = document.getElementById('detail-height');
const detailWeight = document.getElementById('detail-weight');
const detailXp = document.getElementById('detail-xp');
const detailAbilities = document.getElementById('detail-abilities');
const detailStats = document.getElementById('detail-stats');
const cryBtn = document.getElementById('cry-btn');
const cryAudio = document.getElementById('cry-audio');
const favBtn = document.getElementById('detail-fav-btn');

// ===== CURRENT POKEMON =====
let currentPokemon = null;
let officialSprite = '';
let animatedSprite = '';

// ===== FETCH POKEMON =====
async function fetchPokemon(query) {
    if (!query) return;

    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    detailSection.style.display = 'none';

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase().trim()}`);

        if (!response.ok) {
            throw new Error('Pokemon not found');
        }

        const data = await response.json();
        currentPokemon = data;
        renderPokemon(data);

    } catch (err) {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.textContent = 'Pokémon not found. Try a valid name in English (e.g. pikachu, charizard).';
    }
}

// ===== RENDER POKEMON =====
function renderPokemon(pokemon) {
    loadingEl.style.display = 'none';

    const primaryType = pokemon.types[0]?.type?.name || 'normal';
    const secondaryType = pokemon.types[1]?.type?.name || primaryType;
    const color1 = typeColors[primaryType] || '#A8A77A';
    const color2 = typeColors[secondaryType] || color1;

    // --- Header gradient (from React component) ---
    detailHeader.style.background = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;

    // --- Name & ID ---
    detailName.textContent = pokemon.name;
    detailId.textContent = `#${String(pokemon.id).padStart(3, '0')}`;

    // --- Types ---
    detailTypes.innerHTML = pokemon.types.map(t =>
        `<span class="detail-type-badge">${t.type.name}</span>`
    ).join('');

    // --- Sprites (hover switch like React component) ---
    officialSprite = pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default;
    animatedSprite = pokemon.sprites.other?.showdown?.front_default || null;

    detailSprite.src = officialSprite;
    detailSprite.alt = pokemon.name;
    detailSprite.classList.remove('pixelated');

    if (animatedSprite) {
        hoverHint.style.display = 'block';
        detailSprite.addEventListener('mouseenter', () => {
            detailSprite.src = animatedSprite;
            detailSprite.classList.add('pixelated');
        });
        detailSprite.addEventListener('mouseleave', () => {
            detailSprite.src = officialSprite;
            detailSprite.classList.remove('pixelated');
        });
    } else {
        hoverHint.style.display = 'none';
    }

    // --- Physical stats ---
    detailHeight.textContent = `${pokemon.height / 10} m`;
    detailWeight.textContent = `${pokemon.weight / 10} kg`;
    detailXp.textContent = pokemon.base_experience || '—';

    // --- Abilities ---
    detailAbilities.innerHTML = pokemon.abilities.map(a =>
        `<span class="ability-badge ${a.is_hidden ? 'hidden-ability' : ''}">${a.ability.name}${a.is_hidden ? ' (hidden)' : ''}</span>`
    ).join('');

    // --- Stats with animated bars (from React component logic) ---
    detailStats.innerHTML = pokemon.stats.map(s => {
        const val = s.base_stat;
        const percent = Math.min((val / 255) * 100, 100);
        const label = statNames[s.stat.name] || s.stat.name;
        return `
            <div class="stat-row">
                <span class="stat-name">${label}</span>
                <span class="stat-value" style="color:${color1}">${val}</span>
                <div class="stat-bar-wrap">
                    <div class="stat-bar" data-width="${percent}" style="background-color:${color1};"></div>
                </div>
            </div>
        `;
    }).join('');

    // Animate bars after render (setTimeout so DOM is ready)
    setTimeout(() => {
        document.querySelectorAll('.stat-bar').forEach(bar => {
            bar.style.width = bar.getAttribute('data-width') + '%';
        });
    }, 50);

    // --- Cry sound (from React component) ---
    if (pokemon.cries?.latest) {
        cryAudio.src = pokemon.cries.latest;
        cryBtn.style.display = 'flex';
        cryBtn.onclick = () => {
            cryAudio.volume = 0.5;
            cryAudio.currentTime = 0;
            cryAudio.play();
            cryBtn.classList.add('playing');
        };
        cryAudio.onended = () => cryBtn.classList.remove('playing');
    } else {
        cryBtn.style.display = 'none';
    }

    // --- Fav button ---
    updateFavBtn(pokemon.id);

    // --- Show card ---
    detailSection.style.display = 'block';
}

// ===== FAVORITES =====
function getFavorites() {
    const stored = localStorage.getItem('pokemon-favorites');
    return stored ? JSON.parse(stored) : [];
}

function saveFavorites(favs) {
    localStorage.setItem('pokemon-favorites', JSON.stringify(favs));
}

function updateFavBtn(id) {
    const favs = getFavorites();
    if (favs.includes(id)) {
        favBtn.textContent = '⭐ Remove from Favorites';
        favBtn.classList.add('active');
    } else {
        favBtn.textContent = '⭐ Add to Favorites';
        favBtn.classList.remove('active');
    }
}

favBtn.addEventListener('click', () => {
    if (!currentPokemon) return;
    let favs = getFavorites();
    if (favs.includes(currentPokemon.id)) {
        favs = favs.filter(f => f !== currentPokemon.id);
    } else {
        favs.push(currentPokemon.id);
    }
    saveFavorites(favs);
    updateFavBtn(currentPokemon.id);
});

// ===== SEARCH FORM =====
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    fetchPokemon(searchInput.value);
});

// ===== URL PARAM SUPPORT =====
// If coming from index page with ?name=pikachu, load that pokemon
const params = new URLSearchParams(window.location.search);
const nameParam = params.get('name');

if (nameParam) {
    searchInput.value = nameParam;
    fetchPokemon(nameParam);
} else {
    // Default pokemon
    fetchPokemon('charizard');
}
