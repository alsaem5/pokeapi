const CACHE_NAME = 'pokedex-v3'; // <--- VERSIÓN ACTUALIZADA
const POKEAPI_URL = 'https://pokeapi.co/api/v2/pokemon/';

// 1. Archivos estáticos esenciales para la aplicación (Se guardan siempre)
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json'
];

// Instalación: Abrir caché y agregar archivos estáticos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW: Pre-cache de assets estáticos lista.');
                return cache.addAll(urlsToCache);
            })
            .catch(error => console.error('SW: Error al precachear:', error))
    );
});

// Activación: Limpiar cachés viejas
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
    // IMPORTANTE: Tomar control inmediato de la página
    event.waitUntil(self.clients.claim());
});

// Estrategia de Fetch: Manejo de solicitudes
self.addEventListener('fetch', event => {
    // A) Si es una petición a la PokeAPI (Datos de Pokémon):
    if (event.request.url.includes(POKEAPI_URL) || event.request.url.includes('pokeres.bastionbot.org')) {
         // Estrategia: Network-First con Fallback a Cache
         event.respondWith(
            fetch(event.request).then(response => {
                // Guarda la respuesta exitosa en caché y luego la devuelve
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
    
    // B) Para todos los demás assets (HTML, CSS, JS, imágenes locales):
    // Estrategia: Cache-First
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response; // Devuelve desde caché si existe
                }
                return fetch(event.request); // Si no, va a la red
            }
        )
    );
});