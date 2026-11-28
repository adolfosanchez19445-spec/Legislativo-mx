"use strict";

// ==================================================
// LEGISLATIVO MX
// SERVICE WORKER
// ==================================================

const CACHE_NAME = "legislativo-mx-v2";

const ARCHIVOS_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./catalogo-juridico.js",
  "./dof.js",
  "./juria.js"
];

// ==================================================
// INSTALACIÓN
// ==================================================

self.addEventListener("install", evento => {
  evento.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ARCHIVOS_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ==================================================
// ACTIVACIÓN Y LIMPIEZA
// ==================================================

self.addEventListener("activate", evento => {
  evento.waitUntil(
    caches.keys()
      .then(claves => {
        return Promise.all(
          claves
            .filter(clave => clave !== CACHE_NAME)
            .map(clave => caches.delete(clave))
        );
      })
      .then(() => self.clients.claim())
  );
});

// ==================================================
// INTERCEPTAR SOLICITUDES
// ==================================================

self.addEventListener("fetch", evento => {
  const solicitud = evento.request;
  const url = new URL(solicitud.url);

  // No interceptar solicitudes externas ni la API del DOF.
  if (url.origin !== self.location.origin) {
    return;
  }

  // No interceptar solicitudes que no sean GET.
  if (solicitud.method !== "GET") {
    return;
  }

  // Los documentos principales se consultan primero en la red.
  if (
    solicitud.mode === "navigate" ||
    url.pathname.endsWith(".html")
  ) {
    evento.respondWith(
      fetch(solicitud)
        .then(respuesta => {
          if (respuesta.ok) {
            const copia = respuesta.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(solicitud, copia));
          }

          return respuesta;
        })
        .catch(() => caches.match(solicitud))
    );

    return;
  }

  // Los demás recursos utilizan caché y después red.
  evento.respondWith(
    caches.match(solicitud)
      .then(respuestaGuardada => {
        if (respuestaGuardada) {
          return respuestaGuardada;
        }

        return fetch(solicitud).then(respuesta => {
          if (respuesta.ok) {
            const copia = respuesta.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(solicitud, copia));
          }

          return respuesta;
        });
      })
  );
});
