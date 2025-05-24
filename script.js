// DOM Elements
const pokemonContainer = document.getElementById('pokemonContainer');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const filterButtons = document.querySelectorAll('.filter-btn');
const loading = document.getElementById('loading');
const modal = document.getElementById('pokemonModal');
const closeModal = document.querySelector('.close-modal');
const prevButton = document.querySelector('.nav-prev');
const nextButton = document.querySelector('.nav-next');

// State
let allPokemonList = [];
let allPokemon = [];
let filteredPokemon = [];
let currentType = 'all';
let currentSort = 'id';
let currentPokemonIndex = 0;
let selectedTypes = ['all'];
let isLoading = false;
let offset = 0;
const limit = 30;

// Type color map for dark shades
const typeDarkColors = {
    normal: '#6D6D4E',
    fire: '#B22200',
    water: '#1552E1',
    electric: '#E2B500',
    grass: '#388A4A',
    ice: '#3FB8B4',
    fighting: '#7D1F1A',
    poison: '#682A68',
    ground: '#A8702D',
    flying: '#6D5E9C',
    psychic: '#A13959',
    bug: '#6A7817',
    rock: '#786824',
    ghost: '#493963',
    dragon: '#4924A1',
    dark: '#49392F',
    steel: '#787887',
    fairy: '#9B6470',
};

// Add a map for darker type colors for glow
const typeGlowColors = {
    normal: '#4d4d36',
    fire: '#7a1800',
    water: '#0d2a7a',
    electric: '#b28a00',
    grass: '#225c2e',
    ice: '#258080',
    fighting: '#4d1410',
    poison: '#3e1840',
    ground: '#6d4a1a',
    flying: '#473a6a',
    psychic: '#6a223a',
    bug: '#49520f',
    rock: '#4d4416',
    ghost: '#2d1e3a',
    dragon: '#2d186a',
    dark: '#2d1e16',
    steel: '#4d4d5a',
    fairy: '#6a3a40',
    all: '#444',
};

// Function to format Pokémon IDs for display
function formatPokemonId(id) {
    if (id < 1000) {
        return `#${String(id).padStart(3, '0')}`;
    } else {
        return `#${id}`;
    }
}

// Fetch the full list of Pokémon names/URLs on page load
async function fetchAllPokemonList() {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10277');
    const data = await response.json();
    allPokemonList = data.results;
}

// Fetch Pokémon details by name or url
async function fetchPokemonDetails(url) {
    const res = await fetch(url);
    return res.json();
}

// Modified filterByTypes to fetch and display only Pokémon matching the selected types
async function filterByTypes() {
    if (selectedTypes.includes('all') || selectedTypes.length === 0) {
        filteredPokemon = [...allPokemon];
    } else {
        filteredPokemon = allPokemon.filter(pokemon =>
            pokemon.types.some(t => selectedTypes.includes(t.type.name))
        );
    }
    applySearchAndSort();
    // If filter is active and not all Pokémon are loaded, and the filtered list is too short to fill the page, load more
    if (!selectedTypes.includes('all') && offset < allPokemonList.length) {
        // Estimate if the page is filled (e.g., less than 2 rows of cards visible)
        const cardsPerRow = Math.floor(pokemonContainer.offsetWidth / 220) || 4;
        const minCardsToFill = cardsPerRow * 2;
        if (filteredPokemon.length < minCardsToFill) {
            fetchPokemonBatch();
        }
    }
}

// Fetch a batch of Pokémon
async function fetchPokemonBatch() {
    if (isLoading || offset >= allPokemonList.length) return;
    isLoading = true;
    loading.style.display = 'flex';
    try {
        const batch = allPokemonList.slice(offset, offset + limit);
        const pokemonDetails = await Promise.all(
            batch.map(async (pokemon) => {
                const res = await fetch(pokemon.url);
                return res.json();
            })
        );
        // Filter out Pokémon with missing images or invalid data
        const validPokemon = pokemonDetails.filter(pokemon => pokemon && pokemon.sprites && pokemon.sprites.front_default);
        allPokemon = allPokemon.concat(validPokemon);
        offset += limit;
        // Instead of rendering all, always re-apply the filter after loading
        filterByTypes();
        // Hide loading if we've reached the end
        if (offset >= allPokemonList.length) {
            loading.style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching Pokémon:', error);
    } finally {
        if (offset < allPokemonList.length) {
            loading.style.display = 'none';
        }
        isLoading = false;
    }
}

// Render Pokémon cards
function renderPokemon(renderList = filteredPokemon) {
    pokemonContainer.innerHTML = '';

    renderList.forEach((pokemon, index) => {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        card.setAttribute('data-name', pokemon.name);
    
        const types = pokemon.types.map(type => type.type.name);
        const imageUrl = pokemon.sprites.front_default ? pokemon.sprites.front_default : FALLBACK_IMAGE_URL;
    
        card.innerHTML = `
            <div class="pokemon-image-container">
                <img src="${imageUrl}" alt="${pokemon.name} image not found" class="pokemon-image">
            </div>
            <div class="pokemon-info">
                <h2 class="pokemon-name">${pokemon.name}</h2>
                <p class="pokemon-id">${formatPokemonId(pokemon.id)}</p>
                <div class="pokemon-types">
                    ${types.map(type => `
                        <span class="type-badge ${type}">${type}</span>
                    `).join('')}
                </div>
            </div>
        `;
    
        card.addEventListener('click', () => {
            console.log('Card clicked:', pokemon.name, index);
            showPokemonDetails(index, renderList);
        });
        pokemonContainer.appendChild(card);
    });
}

// Show Pokémon details in modal
async function showPokemonDetails(index, list = null) {
    const useList = list || filteredPokemon;
    currentPokemonIndex = index;
    const pokemon = useList[index];
    
    // Update modal content
    const modalContent = document.querySelector('.modal-content');
    modalContent.className = 'modal-content';
    const primaryType = pokemon.types[0].type.name;
    modalContent.classList.add(`type-${primaryType}`);
    const statColor = typeDarkColors[primaryType] || '#b87333';
    
    document.querySelector('.modal-title').textContent = pokemon.name;
    document.querySelector('.modal-id').textContent = formatPokemonId(pokemon.id);
    document.querySelector('.modal-image').src = pokemon.sprites.front_default ? pokemon.sprites.front_default : 'path/to/fallback_image.png';
    document.querySelector('.modal-image').alt = pokemon.name;
    
    // Update types
    const typesContainer = document.querySelector('.modal-types');
    typesContainer.innerHTML = pokemon.types.map(type => `
        <span class="type-badge ${type.type.name}">${type.type.name}</span>
    `).join('');
    
    // About section
    document.querySelector('.height').textContent = `${pokemon.height / 10} m`;
    document.querySelector('.weight').textContent = `${pokemon.weight / 10} kg`;
    document.querySelector('.abilities').textContent = pokemon.abilities[0]?.ability.name.replace('-', ' ') || '-';
    
    // Fetch species data for description
    try {
        const speciesResponse = await fetch(pokemon.species.url);
        const speciesData = await speciesResponse.json();
        const description = speciesData.flavor_text_entries
            .find(entry => entry.language.name === 'en')
            ?.flavor_text.replace(/\f/g, ' ');
        document.querySelector('.description-text').textContent = description || 'No description available.';
    } catch (error) {
        console.error('Error fetching species data:', error);
        document.querySelector('.description-text').textContent = 'No description available.';
    }
    
    // Base Stats with bars
    const statsContainer = document.querySelector('.modal-stats');
    statsContainer.innerHTML = '';
    const statShortNames = {
        hp: 'HP',
        attack: 'ATK',
        defense: 'DEF',
        'special-attack': 'SATK',
        'special-defense': 'SDEF',
        speed: 'SPD',
    };
    const maxStat = 150; // for bar scaling
    const barWidths = [];
    pokemon.stats.forEach(stat => {
        const shortName = statShortNames[stat.stat.name] || stat.stat.name.toUpperCase();
        const value = stat.base_stat;
        const barWidth = Math.min(100, (value / maxStat) * 100);
        barWidths.push(barWidth);
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        statItem.innerHTML = `
            <span class="stat-name" style="color: ${statColor}">${shortName}</span>
            <span class="stat-value">${String(value).padStart(3, '0')}</span>
            <div class="stat-bar"><div class="stat-bar-inner" style="width: 0%; background: ${statColor}"></div></div>
        `;
        statsContainer.appendChild(statItem);
    });
    // Animate the bars
    setTimeout(() => {
        document.querySelectorAll('.stat-bar-inner').forEach((bar, i) => {
            bar.style.width = barWidths[i] + '%';
        });
    }, 50);
    
    // Set About icons color to match type
    document.querySelectorAll('.about-icon').forEach(icon => {
        icon.style.color = statColor;
    });
    
    // Show modal
    modal.style.display = 'flex';
    
    // Save the current list for navigation
    showPokemonDetails.currentList = useList;
    updateNavigationButtons();
}

// Update navigation buttons state
function updateNavigationButtons() {
    const list = showPokemonDetails.currentList || filteredPokemon;
    prevButton.style.display = currentPokemonIndex > 0 ? 'flex' : 'none';
    nextButton.style.display = currentPokemonIndex < list.length - 1 ? 'flex' : 'none';
}

// Navigate to previous Pokémon
function showPreviousPokemon() {
    const list = showPokemonDetails.currentList || filteredPokemon;
    if (currentPokemonIndex > 0) {
        showPokemonDetails(currentPokemonIndex - 1, list);
    }
}

// Navigate to next Pokémon
function showNextPokemon() {
    const list = showPokemonDetails.currentList || filteredPokemon;
    if (currentPokemonIndex < list.length - 1) {
        showPokemonDetails(currentPokemonIndex + 1, list);
    }
}

// Update filter button glow and active state
function updateFilterButtonStyles() {
    filterButtons.forEach(button => {
        const type = button.dataset.type;
        if (button.classList.contains('active')) {
            button.style.setProperty('--filter-glow', typeGlowColors[type] || '#444');
        } else {
            button.style.removeProperty('--filter-glow');
        }
    });
}

// Sort Pokémon
function sortPokemon() {
    currentSort = sortSelect.value;
    applySearchAndSort();
}

// Search Pokémon
function searchPokemon() {
    applySearchAndSort();
}

// Apply search and sort
function applySearchAndSort() {
    const searchTerm = searchInput.value.toLowerCase();
    
    // Filter by search term
    let results = filteredPokemon.filter(pokemon => 
        pokemon.name.toLowerCase().includes(searchTerm) ||
        String(pokemon.id).includes(searchTerm)
    );
    
    // Sort results
    results.sort((a, b) => {
        if (currentSort === 'name') {
            return a.name.localeCompare(b.name);
        } else {
            return a.id - b.id;
        }
    });
    
    // Do not overwrite filteredPokemon!
    renderPokemon(results);
}

// Event Listeners
searchInput.addEventListener('input', searchPokemon);
sortSelect.addEventListener('change', sortPokemon);

// Event Listeners for filter buttons (multi-select)
filterButtons.forEach(button => {
    button.addEventListener('click', async () => {
        const type = button.dataset.type;
        if (type === 'all') {
            selectedTypes = ['all'];
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        } else {
            selectedTypes = selectedTypes.filter(t => t !== 'all');
            if (button.classList.contains('active')) {
                button.classList.remove('active');
                selectedTypes = selectedTypes.filter(t => t !== type);
            } else {
                button.classList.add('active');
                selectedTypes.push(type);
            }
            if (selectedTypes.length === 0) {
                selectedTypes = ['all'];
                document.querySelector('.filter-btn[data-type="all"]').classList.add('active');
            } else {
                document.querySelector('.filter-btn[data-type="all"]').classList.remove('active');
            }
        }
        updateFilterButtonStyles();
        await filterByTypes();
    });
});

// Modal event listeners
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

prevButton.addEventListener('click', showPreviousPokemon);
nextButton.addEventListener('click', showNextPokemon);

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (modal.style.display === 'flex') {
        if (e.key === 'ArrowLeft') {
            showPreviousPokemon();
        } else if (e.key === 'ArrowRight') {
            showNextPokemon();
        } else if (e.key === 'Escape') {
            modal.style.display = 'none';
        }
    }
});

// Infinite scroll event
window.addEventListener('scroll', () => {
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight * 0.7;
    if (scrollPosition >= threshold && !isLoading) {
        fetchPokemonBatch();
    }
});

// On page load, fetch the full list and the first batch
(async function() {
    await fetchAllPokemonList();
    fetchPokemonBatch();
    updateFilterButtonStyles();
})();