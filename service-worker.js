const CACHE_NAME = 'pokedex-v2'; // <--- VERSIÓN CLAVE
const POKEAPI_URL = 'https://pokeapi.co/api/v2/pokemon/';

// Archivos estáticos esenciales para la aplicación
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    // Asegúrate de tener estos iconos en la carpeta /images
    '/images/icon-192x192.png',
    '/images/icon-512x512.png'
];

// 1. Instalación: Abrir caché y agregar archivos estáticos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW: Cache de assets estáticos abierta y lista.');
                return cache.addAll(urlsToCache);
            })
            .catch(error => console.error('SW: Error al precachear:', error))
    );
});

// 2. Activación: Limpiar cachés viejas
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('SW: Eliminando caché vieja:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. Estrategia de Fetch: Network-First para datos de API y Cache-First para assets
self.addEventListener('fetch', event => {
    // Si es una petición a la PokeAPI, intenta primero la red (Network-First)
    if (event.request.url.includes(POKEAPI_URL)) {
         event.respondWith(
            fetch(event.request).then(response => {
                // Si la red es exitosa, guarda la respuesta en caché para uso futuro
                // Esto permite la funcionalidad offline una vez cargada la página
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            }).catch(() => {
                // Si la red falla, devuelve la versión cacheada (offline)
                return caches.match(event.request);
            })
        );
        return;
    }
    
    // Para todos los demás assets (HTML, CSS, JS, etc.), usa Cache-First
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response; // Devuelve desde caché
                }
                return fetch(event.request); // Si no está en caché, ve a la red
            }
        )
    );
});