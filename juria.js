"use strict";

// ==================================================
// LEGISLATIVO MX
// ASISTENTE JURÍDICO JURIA
// ==================================================

const JURIA_CONFIG = {
  nombre: "JURIA",
  version: "1.0.0",
  iaConectada: false
};

// ==================================================
// ELEMENTOS DE LA INTERFAZ
// ==================================================

const JURIA = {
  estado: document.getElementById("juria-status"),
  mensajes: document.getElementById("juria-messages"),
  entrada: document.getElementById("juria-input"),
  boton: document.getElementById("juria-send")
};

// ==================================================
// ESTADO DEL ASISTENTE
// ==================================================

let juriaConversacion = [];
let juriaProcesando = false;

// ==================================================
// MENSAJES
// ==================================================

function juriaAgregarMensaje(contenido, tipo = "assistant") {
  if (!JURIA.mensajes) return;

  const mensaje = document.createElement("div");

  mensaje.className = `juria-message juria-${tipo}`;
  mensaje.textContent = contenido;

  JURIA.mensajes.appendChild(mensaje);

  JURIA.mensajes.scrollTop = JURIA.mensajes.scrollHeight;

  juriaConversacion.push({
    tipo,
    contenido,
    fecha: new Date().toISOString()
  });
}

// ==================================================
// ESTADO DE CONEXIÓN
// ==================================================

function juriaActualizarEstado(texto, conectado = false) {
  if (!JURIA.estado) return;

  JURIA.estado.textContent = texto;

  JURIA.estado.classList.toggle(
    "connected",
    conectado
  );

  JURIA.estado.classList.toggle(
    "disconnected",
    !conectado
  );
}

// ==================================================
// RESPUESTA TEMPORAL
// ==================================================

function juriaRespuestaNoDisponible() {
  return (
    "JURIA todavía no tiene conectada su inteligencia artificial. " +
    "La interfaz está preparada, pero para realizar consultas jurídicas " +
    "y generar análisis será necesario configurar el servicio de IA."
  );
}

// ==================================================
// PROCESAR MENSAJE
// ==================================================

async function juriaEnviarMensaje() {
  if (juriaProcesando) return;

  if (!JURIA.entrada) return;

  const consulta = JURIA.entrada.value.trim();

  if (!consulta) return;

  juriaProcesando = true;

  JURIA.entrada.value = "";

  juriaAgregarMensaje(consulta, "user");

  if (JURIA.boton) {
    JURIA.boton.disabled = true;
  }

  juriaActualizarEstado("IA pendiente de configuración");

  await new Promise(resolve => setTimeout(resolve, 400));

  juriaAgregarMensaje(
    juriaRespuestaNoDisponible(),
    "assistant"
  );

  juriaProcesando = false;

  if (JURIA.boton) {
    JURIA.boton.disabled = false;
  }
}

// ==================================================
// EVENTOS
// ==================================================

function juriaInicializar() {
  juriaActualizarEstado(
    "Interfaz disponible · IA pendiente de conexión"
  );

  if (JURIA.boton) {
    JURIA.boton.addEventListener(
      "click",
      juriaEnviarMensaje
    );
  }

  if (JURIA.entrada) {
    JURIA.entrada.addEventListener("keydown", evento => {
      if (
        evento.key === "Enter" &&
        !evento.shiftKey
      ) {
        evento.preventDefault();
        juriaEnviarMensaje();
      }
    });
  }

  if (JURIA.mensajes && !JURIA.mensajes.children.length) {
    juriaAgregarMensaje(
      "Hola. Soy JURIA, el asistente jurídico de LEGISLATIVO MX. Mi inteligencia artificial todavía está pendiente de conexión."
    );
  }
}

// ==================================================
// ARRANQUE
// ==================================================

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    juriaInicializar
  );
} else {
  juriaInicializar();
}
