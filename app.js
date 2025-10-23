const POKEMON_COUNT = 151;
const POKEAPI_URL = 'https://pokeapi.co/api/v2/pokemon/';
const container = document.getElementById('pokemon-list-container');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

// Variable global para almacenar todos los Pokémon cargados (Memoria Cache)
let allPokemon = [];

// ===================================
// A. Registro del Service Worker
// ===================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => console.log('SW registrado con éxito:', registration.scope))
            .catch(error => console.error('Fallo en el registro de SW:', error));
    });
}

// ===================================
// B. Consumo y Carga Inicial de Datos
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
        console.error("Error al obtener Pokémon:", error);
        return null;
    }
}

async function loadAllPokemon() {
    container.innerHTML = '<p class="loading-message">Cargando los 151 Pokémon. Esto puede tardar unos segundos...</p>';
    
    // Crea un array de promesas para cargar todos los Pokémon en paralelo
    const pokemonPromises = [];
    for (let i = 1; i <= POKEMON_COUNT; i++) {
        pokemonPromises.push(fetchPokemon(i));
    }

    // Espera a que todas las promesas se resuelvan y filtra nulos
    allPokemon = (await Promise.all(pokemonPromises)).filter(p => p !== null);
    
    displayPokemon(allPokemon);
}

function createPokemonCardHTML(pokemon) {
    const primaryType = pokemon.types[0].type.name; 
    const paddedId = pokemon.id.toString().padStart(3, '0');
    
    // Usamos el Official Artwork (imagen de alta calidad)
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
    container.innerHTML = ''; // Limpia el contenedor
    if (pokemonList.length === 0) {
        container.innerHTML = '<p class="loading-message">No se encontraron Pokémon con ese criterio. Intenta con ID o nombre.</p>';
        return;
    }

    pokemonList.forEach(pokemon => {
        const card = document.createElement('div');
        const primaryType = pokemon.types[0].type.name; 
        
        card.classList.add('pokemon-card', `type-${primaryType}`);
        card.innerHTML = createPokemonCardHTML(pokemon);
        container.appendChild(card);
    });
}

// ===================================
// C. Funcionalidad de Búsqueda
// ===================================

function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (!query) {
        // Si la caja de búsqueda está vacía, muestra todos
        displayPokemon(allPokemon);
        return;
    }

    const filteredPokemon = allPokemon.filter(pokemon => {
        const name = pokemon.name.toLowerCase();
        const id = pokemon.id.toString();

        // Búsqueda por ID exacto
        if (id === query) {
            return true;
        }
        // Búsqueda por coincidencia de nombre (parcial)
        if (name.includes(query)) {
            return true;
        }
        return false;
    });

    displayPokemon(filteredPokemon);
}

// Asignar los event listeners
searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        handleSearch();
    }
    // Opcional: Búsqueda instantánea al teclear
    // handleSearch(); 
});

// Inicia la carga de datos al cargar la página
window.onload = loadAllPokemon;