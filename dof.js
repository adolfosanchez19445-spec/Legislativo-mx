const DOF_API = "https://sidof.segob.gob.mx/dof/sidof";

const DIAS_CONSULTA = 7;
const ESPERA_ENTRE_NOTAS = 250;

function obtenerFecha(diasAtras = 0) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - diasAtras);

  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");

  return `${dia}-${mes}-${fecha.getFullYear()}`;
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CLASIFICACION = {
  Penal: [
    "codigo penal", "derecho penal", "materia penal",
    "delito", "delitos", "feminicidio", "homicidio",
    "robo", "fraude", "extorsion",
    "delincuencia organizada", "proceso penal",
    "justicia penal", "ministerio publico",
    "carpeta de investigacion"
  ],

  Laboral: [
    "derecho laboral", "materia laboral",
    "ley federal del trabajo", "relaciones laborales",
    "relacion de trabajo", "trabajadores", "trabajador",
    "sindicato", "contrato colectivo", "salario minimo",
    "prestaciones laborales", "jornada laboral",
    "riesgos de trabajo", "seguridad social",
    "reparto de utilidades"
  ],

  Fiscal: [
    "derecho fiscal", "materia fiscal",
    "codigo fiscal de la federacion",
    "ley del impuesto sobre la renta",
    "impuesto sobre la renta",
    "impuesto al valor agregado",
    "contribuciones", "obligaciones fiscales",
    "creditos fiscales", "autoridad fiscal",
    "servicio de administracion tributaria",
    "recaudacion", "declaracion fiscal"
  ],

  Familiar: [
    "derecho familiar", "materia familiar",
    "codigo familiar", "derecho de familia",
    "pension alimenticia", "alimentos", "divorcio",
    "matrimonio", "adopcion", "filiacion",
    "patria potestad", "guarda y custodia",
    "violencia familiar", "tutela"
  ],

  Constitucional: [
    "derecho constitucional", "materia constitucional",
    "constitucion politica", "reforma constitucional",
    "articulo constitucional", "derechos humanos",
    "garantias constitucionales",
    "controversia constitucional",
    "accion de inconstitucionalidad",
    "poder legislativo", "poder ejecutivo",
    "poder judicial"
  ],

  Administrativo: [
    "derecho administrativo", "materia administrativa",
    "procedimiento administrativo", "acto administrativo",
    "responsabilidad administrativa",
    "servidores publicos", "administracion publica",
    "contratacion publica", "licitacion publica",
    "concesiones", "sanciones administrativas",
    "organos administrativos"
  ],

  Civil: [
    "derecho civil", "materia civil", "codigo civil",
    "responsabilidad civil", "contrato civil",
    "arrendamiento", "sucesion testamentaria",
    "sucesion intestamentaria", "bienes inmuebles",
    "derechos reales", "obligaciones civiles",
    "patrimonio civil"
  ],

  Mercantil: [
    "derecho mercantil", "materia mercantil",
    "codigo de comercio", "concurso mercantil",
    "sociedad anonima", "sociedades mercantiles",
    "titulos de credito", "operaciones mercantiles",
    "comercio exterior", "contratos mercantiles",
    "instituciones de credito", "actividad empresarial"
  ]
};

// Clasificación con puntuación y motivos.
function clasificarPublicacion(texto) {
  const contenido = normalizarTexto(texto);

  const detalles = [];

  for (const [materia, palabras] of Object.entries(CLASIFICACION)) {
    const coincidencias = palabras.filter(palabra =>
      contenido.includes(normalizarTexto(palabra))
    );

    if (coincidencias.length === 0) continue;

    // Las expresiones de varias palabras tienen mayor peso.
    const puntuacion = coincidencias.reduce((total, palabra) => {
      const peso = palabra.trim().split(/\s+/).length >= 2 ? 3 : 1;
      return total + peso;
    }, 0);

    let confianza = "baja";

    if (puntuacion >= 6) {
      confianza = "alta";
    } else if (puntuacion >= 3) {
      confianza = "media";
    }

    detalles.push({
      materia,
      puntuacion,
      confianza,
      motivos: coincidencias
    });
  }

  // Solo se asignan como materias identificadas
  // las que alcanzan una puntuación mínima de 3.
  const materias = detalles
    .filter(detalle => detalle.puntuacion >= 3)
    .map(detalle => detalle.materia);

  const candidatas = detalles
    .filter(detalle => detalle.puntuacion < 3);

  return {
    materias,
    candidatas,
    detalles
  };
}

function extraerTextoHTML(html) {
  if (!html) return "";

  const documento = new DOMParser().parseFromString(
    html,
    "text/html"
  );

  documento.querySelectorAll(
    "script, style, noscript"
  ).forEach(elemento => elemento.remove());

  return documento.body.textContent || "";
}

async function consultarDetalle(codNota) {
  try {
    const respuesta = await fetch(
      `${DOF_API}/notas/nota/${encodeURIComponent(codNota)}`
    );

    if (!respuesta.ok) return "";

    const datos = await respuesta.json();
    const nota = datos.Nota || datos.nota || {};

    if (Array.isArray(nota)) return "";

    const contenido =
      nota.cadenaContenido ||
      nota.contenido ||
      nota.contenidoTxt ||
      "";

    return extraerTextoHTML(contenido);

  } catch (error) {
    console.error("Error al consultar detalle:", codNota, error);
    return "";
  }
}

function crearTarjeta(nota, resultado, contenidoDisponible) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "card";

  tarjeta.dataset.materias = resultado.materias.join("|");

  tarjeta.dataset.clasificacion =
    resultado.materias.length > 0
      ? "clasificadas"
      : contenidoDisponible && resultado.candidatas.length === 0
        ? "otras"
        : "pendientes";

  const titulo = document.createElement("h3");
  titulo.textContent = nota.titulo;

  const organismo = document.createElement("p");
  organismo.textContent =
    nota.codOrgaDos ||
    nota.nombreCodOrgaUno ||
    "Diario Oficial de la Federación";

  const clasificacion = document.createElement("p");

  if (resultado.materias.length > 0) {
    clasificacion.textContent =
      "Materias identificadas: " +
      resultado.materias.join(", ");

    clasificacion.style.fontWeight = "bold";

    resultado.detalles
      .filter(detalle => resultado.materias.includes(detalle.materia))
      .forEach(detalle => {
        const informacion = document.createElement("p");

        informacion.textContent =
          `Derecho ${detalle.materia}: confianza ${detalle.confianza}. ` +
          `Motivos: ${detalle.motivos.join(", ")}.`;

        tarjeta.appendChild(informacion);
      });

  } else if (resultado.candidatas.length > 0) {
    clasificacion.textContent =
      "Clasificación pendiente: se encontraron indicios débiles.";

    resultado.candidatas.forEach(detalle => {
      const informacion = document.createElement("p");

      informacion.textContent =
        `Posible materia: ${detalle.materia}. ` +
        `Motivos: ${detalle.motivos.join(", ")}. Requiere revisión.`;

      tarjeta.appendChild(informacion);
    });

  } else if (contenidoDisponible) {
    clasificacion.textContent =
      "Otras publicaciones: sin materia identificada.";
  } else {
    clasificacion.textContent =
      "Pendiente: no se pudo recuperar el contenido.";
  }

  const fecha = document.createElement("small");
  fecha.textContent =
    `Fecha: ${nota.fecha || nota.fechaConsulta}`;

  const enlace = document.createElement("a");
  enlace.href =
    `https://www.dof.gob.mx/nota_detalle.php?codigo=${encodeURIComponent(nota.codNota)}`;

  enlace.target = "_blank";
  enlace.rel = "noopener noreferrer";
  enlace.textContent = "Consultar publicación oficial";

  tarjeta.append(
    titulo,
    organismo,
    clasificacion,
    fecha,
    enlace
  );

  return tarjeta;
}

async function consultarDOF() {
  const estado = document.getElementById("dof-status");
  const resultados = document.getElementById("dof-results");

  if (!estado || !resultados) return;

  estado.textContent =
    "Consultando publicaciones de los últimos 7 días...";

  resultados.replaceChildren();

  let publicaciones = [];
  let errores = 0;

  // Consultar las publicaciones de los últimos siete días.
  for (let i = 0; i < DIAS_CONSULTA; i++) {
    const fecha = obtenerFecha(i);

    try {
      const respuesta = await fetch(
        `${DOF_API}/notas/${fecha}`
      );

      if (!respuesta.ok) {
        errores++;
        continue;
      }

      const datos = await respuesta.json();

      const notas = [
        ...(datos.NotasMatutinas || []),
        ...(datos.NotasVespertinas || []),
        ...(datos.NotasExtraordinarias || [])
      ];

      notas.forEach(nota => {
        if (nota.titulo && nota.codNota) {
          publicaciones.push({
            ...nota,
            fechaConsulta: fecha
          });
        }
      });

    } catch (error) {
      errores++;
      console.error("Error consultando fecha:", fecha, error);
    }

    estado.textContent =
      `Consultando DOF: ${i + 1} de ${DIAS_CONSULTA} días...`;
  }

  // Eliminar duplicados.
  const unicas = new Map();

  publicaciones.forEach(nota => {
    unicas.set(String(nota.codNota), nota);
  });

  publicaciones = Array.from(unicas.values());

  if (publicaciones.length === 0) {
    estado.textContent =
      errores === DIAS_CONSULTA
        ? "No fue posible conectar con el DOF. Intenta nuevamente."
        : "No se encontraron publicaciones en los últimos 7 días.";

    return;
  }

  // Ordenar por fecha.
  publicaciones.sort((a, b) => {
    const fechaA = a.fechaConsulta.split("-").reverse().join("");
    const fechaB = b.fechaConsulta.split("-").reverse().join("");

    return fechaB.localeCompare(fechaA);
  });

  const fragmento = document.createDocumentFragment();

  let clasificadas = 0;
  let otras = 0;
  let pendientes = 0;

  // Recuperar contenido y clasificar.
  for (let i = 0; i < publicaciones.length; i++) {
    const nota = publicaciones[i];

    estado.textContent =
      `Analizando publicación ${i + 1} de ${publicaciones.length}...`;

    const contenido = await consultarDetalle(nota.codNota);

    const textoAnalizar = [
      nota.titulo,
      nota.nombreCodOrgaUno,
      nota.codOrgaDos,
      contenido
    ].join(" ");

    const resultado = clasificarPublicacion(textoAnalizar);

    if (resultado.materias.length > 0) {
      clasificadas++;
    } else if (contenido && resultado.candidatas.length === 0) {
      otras++;
    } else {
      pendientes++;
    }

    fragmento.appendChild(
      crearTarjeta(nota, resultado, Boolean(contenido))
    );

    if (i < publicaciones.length - 1) {
      await esperar(ESPERA_ENTRE_NOTAS);
    }
  }

  resultados.appendChild(fragmento);

  estado.textContent =
    `${publicaciones.length} publicaciones encontradas. ` +
    `${clasificadas} con materias identificadas, ` +
    `${otras} en otras publicaciones y ` +
    `${pendientes} pendientes de clasificación.`;

  if (errores > 0) {
    estado.textContent +=
      ` Algunas fechas no pudieron consultarse (${errores}).`;
  }

  if (typeof filterNews === "function") {
    filterNews();
  }
}

consultarDOF();
