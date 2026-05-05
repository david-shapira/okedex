// ===== CONFIG =====
const BATCH_SIZE = 40;   // how many to load per batch
const TOTAL = 1025;      // total pokemon in pokeapi

// ===== STATE =====
let allPokemonBasic = []; // full list of {name, url} from API
let loadedPokemon = [];   // detailed pokemon objects loaded so far
let currentOffset = 0;   // how many we've loaded
let isLoading = false;
let filteredMode = false; // true when search/filter is active

// ===== DOM ELEMENTS =====
const container = document.getElementById('pokemon-container');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const emptyEl = document.getElementById('empty');
const searchInput = document.getElementById('search-input');
const typeFilter = document.getElementById('type-filter');

// ===== FETCH FULL LIST (names + urls only, fast) =====
async function fetchAllBasic() {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${TOTAL}&offset=0`);
    const data = await response.json();
    return data.results;
}

// ===== FETCH DETAILS FOR A BATCH =====
async function fetchBatch(list) {
    const promises = list.map(p => fetch(p.url).then(r => r.json()));
    return await Promise.all(promises);
}

// ===== INITIAL LOAD =====
async function init() {
    try {
        loadingEl.style.display = 'block';
        allPokemonBasic = await fetchAllBasic();
        await loadNextBatch();
    } catch (err) {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        console.log(err);
    }
}

// ===== LOAD NEXT BATCH =====
async function loadNextBatch() {
    if (isLoading) return;
    if (currentOffset >= allPokemonBasic.length) return;
    if (filteredMode) return;

    isLoading = true;
    loadingEl.style.display = 'block';

    const batch = allPokemonBasic.slice(currentOffset, currentOffset + BATCH_SIZE);
    const details = await fetchBatch(batch);

    loadedPokemon = loadedPokemon.concat(details);
    currentOffset += BATCH_SIZE;

    loadingEl.style.display = 'none';
    isLoading = false;

    renderPokemon(loadedPokemon);
}

// ===== RENDER CARDS =====
function renderPokemon(pokemonArray) {
    container.innerHTML = '';

    if (pokemonArray.length === 0) {
        emptyEl.style.display = 'block';
        return;
    }
    emptyEl.style.display = 'none';

    const favorites = getFavorites();

    pokemonArray.forEach(pokemon => {
        const card = document.createElement('div');
        card.className = 'pokemon-card';

        const isFav = favorites.includes(pokemon.id);
        const typesHTML = pokemon.types.map(t =>
            `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`
        ).join('');

        card.innerHTML = `
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${pokemon.id}">⭐</button>
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            <p class="pokemon-id">#${String(pokemon.id).padStart(3, '0')}</p>
            <h3>${pokemon.name}</h3>
            <div class="types">${typesHTML}</div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('fav-btn')) return;
            window.location.href = `pokemon.html?name=${pokemon.name}`;
        });

        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(pokemon.id, favBtn);
        });

        container.appendChild(card);
    });
}

// ===== FILTER (only filters already-loaded pokemon) =====
function filterPokemon() {
    const searchText = searchInput.value.toLowerCase().trim();
    const selectedType = typeFilter.value;

    if (!searchText && !selectedType) {
        filteredMode = false;
        renderPokemon(loadedPokemon);
        return;
    }

    filteredMode = true;

    const filtered = loadedPokemon.filter(pokemon => {
        const nameMatch = !searchText || pokemon.name.includes(searchText);
        const typeMatch = !selectedType ||
            pokemon.types.some(t => t.type.name === selectedType);
        return nameMatch && typeMatch;
    });

    renderPokemon(filtered);
}

// ===== INFINITE SCROLL =====
window.addEventListener('scroll', () => {
    if (filteredMode) return;
    if (isLoading) return;
    if (currentOffset >= TOTAL) return;

    const scrollBottom = window.innerHeight + window.scrollY;
    const pageHeight = document.body.offsetHeight;

    // Load more when user is 300px from bottom
    if (scrollBottom >= pageHeight - 300) {
        loadNextBatch();
    }
});

// ===== FAVORITES =====
function getFavorites() {
    const stored = localStorage.getItem('pokemon-favorites');
    return stored ? JSON.parse(stored) : [];
}

function saveFavorites(favs) {
    localStorage.setItem('pokemon-favorites', JSON.stringify(favs));
}

function toggleFavorite(id, btn) {
    let favs = getFavorites();
    if (favs.includes(id)) {
        favs = favs.filter(f => f !== id);
        btn.classList.remove('active');
    } else {
        favs.push(id);
        btn.classList.add('active');
    }
    saveFavorites(favs);
}

// ===== EVENT LISTENERS =====
searchInput.addEventListener('input', filterPokemon);
typeFilter.addEventListener('change', filterPokemon);

// ===== INIT =====
init();