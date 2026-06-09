// ===== DOM ELEMENTS =====
const container = document.getElementById('favorites-container');
const emptyEl = document.getElementById('empty-fav');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');
const modalClose = document.getElementById('modal-close');
const clearFavsBtn = document.getElementById('clear-favs');


clearFavsBtn.addEventListener('click', () => {
    localStorage.removeItem('pokemon-favorites');
    loadFavorites();
});
// ===== FAVORITES =====
function getFavorites() {
    const stored = localStorage.getItem('pokemon-favorites');
    return stored ? JSON.parse(stored) : [];
}

function saveFavorites(favs) {
    localStorage.setItem('pokemon-favorites', JSON.stringify(favs));
}

// ===== FETCH SINGLE POKEMON =====
async function getPokemonById(id) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await response.json();
    return data;
}

// ===== LOAD FAVORITES =====
async function loadFavorites() {
    const favIds = getFavorites();

    if (favIds.length === 0) {
        container.innerHTML = '';
        emptyEl.style.display = 'block';
        return;
    }

    emptyEl.style.display = 'none';

    try {
        const promises = favIds.map(pokemonId => getPokemonById(pokemonId));
        const pokemonList = await Promise.all(promises);
        renderFavorites(pokemonList);
    } catch (err) {
        container.innerHTML = '<p class="error-msg">Failed to load favorites.</p>';
    }
}

// ===== RENDER FAVORITES =====
function renderFavorites(pokemonArray) {
    container.innerHTML = '';

    pokemonArray.forEach(pokemon => {
        const card = document.createElement('div');
        card.className = 'pokemon-card';

        const typesHTML = pokemon.types.map(typeObj =>
            `<span class="type-badge type-${typeObj.type.name}">${typeObj.type.name}</span>`
        ).join('');

        card.innerHTML = `
            <button class="fav-btn active" data-id="${pokemon.id}">⭐</button>
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            <p class="pokemon-id">#${String(pokemon.id).padStart(3, '0')}</p>
            <h3>${pokemon.name}</h3>
            <div class="types">${typesHTML}</div>
        `;

        // Click card → go to detail page
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('fav-btn')) return;
            window.location.href = `pokemon.html?name=${pokemon.name}`;
        });

        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFavorite(pokemon.id, card);
        });

        container.appendChild(card);
    });
}

function removeFavorite(id, card) {
    let favs = getFavorites();
    favs = favs.filter(favId => favId !== id);
    saveFavorites(favs);
    card.remove();

    if (document.querySelectorAll('.pokemon-card').length === 0) {
        emptyEl.style.display = 'block';
    }
}

// ===== MODAL (kept for structure) =====
modalClose.addEventListener('click', () => { modal.style.display = 'none'; });
modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

// ===== INIT =====
loadFavorites();
