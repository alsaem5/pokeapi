const POKEMON_COUNT = 151;
const POKEAPI_URL = 'https://pokeapi.co/api/v2/pokemon/';
const container = document.getElementById('pokemon-list-container');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

// Elementos del Modal (DEBEN existir en index.html)
const pokemonModal = document.getElementById('pokemon-modal');
const modalDetails = document.getElementById('modal-details');
const closeButton = document.querySelector('.close-button');

let allPokemon = [];

// ===================================
// A. Configuración del Modal
// ===================================

// Cierra el modal al hacer clic en la 'x'
if (closeButton) {
    closeButton.addEventListener('click', () => {
        pokemonModal.style.display = 'none';
    });
}

// Cierra el modal si el usuario hace clic fuera de la ventana de contenido
window.addEventListener('click', (event) => {
    if (event.target === pokemonModal) {
        pokemonModal.style.display = 'none';
    }
});


// ===================================
// B. Registro del Service Worker (Debe ser la primera función llamada)
// ===================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // La ruta DEBE ser solo '/service-worker.js' si está en la raíz.
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => console.log('SW registrado con éxito:', registration.scope))
            .catch(error => console.error('Fallo en el registro de SW:', error));
    });
}

// ===================================
// C. Consumo y Carga Inicial de Datos
// ===================================

async function fetchPokemon(id) {
    try {
        const response = await fetch(POKEAPI_URL + id);
        if (!response.ok) {
            throw new Error(`Pokémon con ID ${id} no encontrado`);
        }
        const pokemon = await response.json();
        return pokemon;
    } catch (error) {
        // console.error("Error al obtener Pokémon:", error);
        return null;
    }
}

async function loadAllPokemon() {
    container.innerHTML = '<p class="loading-message">Cargando los 151 Pokémon. Esto puede tardar unos segundos...</p>';
    
    const pokemonPromises = [];
    for (let i = 1; i <= POKEMON_COUNT; i++) {
        pokemonPromises.push(fetchPokemon(i));
    }

    allPokemon = (await Promise.all(pokemonPromises)).filter(p => p !== null);
    
    displayPokemon(allPokemon);
}

function renderModalDetails(pokemon) {
    const paddedId = pokemon.id.toString().padStart(3, '0');
    // Usamos 'official-artwork' para las imágenes de alta calidad
    const imageUrl = pokemon.sprites.other['official-artwork'].front_default;
    const typeBadges = pokemon.types.map(t => `<span class="type-badge type-${t.type.name}">${t.type.name.toUpperCase()}</span>`).join('');
    // Manejo seguro de habilidades, asegurando que no haya errores si faltan
    const abilitiesList = pokemon.abilities ? pokemon.abilities.map(a => a.ability.name.toUpperCase()).join(', ') : 'Desconocidas';

    modalDetails.innerHTML = `
        <h2>${pokemon.name.toUpperCase()}</h2>
        <img src="${imageUrl}" alt="${pokemon.name}">
        
        <p><strong>ID Pokédex:</strong> #${paddedId}</p>
        <p><strong>Altura:</strong> ${pokemon.height / 10} m</p>
        <p><strong>Peso:</strong> ${pokemon.weight / 10} kg</p>
        <p><strong>Habilidades:</strong> ${abilitiesList}</p>
        
        <div class="pokemon-types">
            ${typeBadges}
        </div>
    `;
}

function handleCardClick(pokemon) {
    // 1. Renderiza el contenido dentro del modal
    renderModalDetails(pokemon);
    // 2. Muestra el modal
    pokemonModal.style.display = 'block';
}

function createPokemonCardHTML(pokemon) {
    const paddedId = pokemon.id.toString().padStart(3, '0');
    const imageUrl = pokemon.sprites.other['official-artwork'].front_default;

    return `
        <span class="pokemon-id-background">#${paddedId}</span>
        <img src="${imageUrl}" alt="${pokemon.name}" loading="lazy">
        <p class="pokemon-id">#${paddedId}</p>
        <h2 class="pokemon-name">${pokemon.name.toUpperCase()}</h2>
        <div class="pokemon-types">
            ${pokemon.types.map(t => `<span class="type-badge type-${t.type.name}">${t.type.name.toUpperCase()}</span>`).join('')}
        </div>
    `;
}

function displayPokemon(pokemonList) {
    container.innerHTML = ''; 
    if (pokemonList.length === 0) {
        container.innerHTML = '<p class="loading-message">No se encontraron Pokémon con ese criterio. Intenta con ID o nombre.</p>';
        return;
    }

    pokemonList.forEach(pokemon => {
        const card = document.createElement('div');
        const primaryType = pokemon.types[0].type.name; 
        
        card.classList.add('pokemon-card', `type-${primaryType}`);
        card.innerHTML = createPokemonCardHTML(pokemon);
        
        // Asignación del evento click que abre el modal
        card.addEventListener('click', () => handleCardClick(pokemon));
        
        container.appendChild(card);
    });
}

// ===================================
// D. Funcionalidad de Búsqueda
// ===================================

function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (!query) {
        displayPokemon(allPokemon);
        return;
    }

    const filteredPokemon = allPokemon.filter(pokemon => {
        const name = pokemon.name.toLowerCase();
        const id = pokemon.id.toString();

        return id === query || name.includes(query);
    });

    displayPokemon(filteredPokemon);
}

// Asignar los event listeners
searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        handleSearch();
    }
});

// Inicia la carga de datos al cargar la página
window.onload = loadAllPokemon;