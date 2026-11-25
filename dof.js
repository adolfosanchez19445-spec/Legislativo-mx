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
    .replace(/[\u0300-\u036f]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Palabras y expresiones para identificar materias jurídicas.
const CLASIFICACION = {
  Penal: [
    "codigo penal",
    "derecho penal",
    "materia penal",
    "delito",
    "delitos",
    "feminicidio",
    "homicidio",
    "robo",
    "fraude",
    "extorsion",
    "delincuencia organizada",
    "proceso penal",
    "justicia penal",
    "ministerio publico",
    "carpeta de investigacion"
  ],

  Laboral: [
    "derecho laboral",
    "materia laboral",
    "ley federal del trabajo",
    "relaciones laborales",
    "relacion de trabajo",
    "trabajadores",
    "trabajador",
    "sindicato",
    "contrato colectivo",
    "salario minimo",
    "prestaciones laborales",
    "jornada laboral",
    "riesgos de trabajo",
    "seguridad social",
    "reparto de utilidades"
  ],

  Fiscal: [
    "derecho fiscal",
    "materia fiscal",
    "codigo fiscal de la federacion",
    "ley del impuesto sobre la renta",
    "impuesto sobre la renta",
    "impuesto al valor agregado",
    "contribuciones",
    "obligaciones fiscales",
    "creditos fiscales",
    "autoridad fiscal",
    "servicio de administracion tributaria",
    "recaudacion",
    "declaracion fiscal"
  ],

  Familiar: [
    "derecho familiar",
    "materia familiar",
    "codigo familiar",
    "derecho de familia",
    "pension alimenticia",
    "alimentos",
    "divorcio",
    "matrimonio",
    "adopcion",
    "filiacion",
    "patria potestad",
    "guarda y custodia",
    "violencia familiar",
    "tutela"
  ],

  Constitucional: [
    "derecho constitucional",
    "materia constitucional",
    "constitucion politica",
    "reforma constitucional",
    "articulo constitucional",
    "derechos humanos",
    "garantias constitucionales",
    "controversia constitucional",
    "accion de inconstitucionalidad",
    "poder legislativo",
    "poder ejecutivo",
    "poder judicial"
  ],

  Administrativo: [
    "derecho administrativo",
    "materia administrativa",
    "procedimiento administrativo",
    "acto administrativo",
    "responsabilidad administrativa",
    "servidores publicos",
    "administracion publica",
    "contratacion publica",
    "licitacion publica",
    "concesiones",
    "sanciones administrativas",
    "organos administrativos"
  ],

  Civil: [
    "derecho civil",
    "materia civil",
    "codigo civil",
    "responsabilidad civil",
    "contrato civil",
    "arrendamiento",
    "sucesion testamentaria",
    "sucesion intestamentaria",
    "bienes inmuebles",
    "derechos reales",
    "obligaciones civiles",
    "patrimonio civil"
  ],

  Mercantil: [
    "derecho mercantil",
    "materia mercantil",
    "codigo de comercio",
    "concurso mercantil",
    "sociedad anonima",
    "sociedades mercantiles",
    "titulos de credito",
    "operaciones mercantiles",
    "comercio exterior",
    "contratos mercantiles",
    "instituciones de credito",
    "actividad empresarial"
  ]
};

function clasificarPublicacion(texto) {
  const contenido = normalizarTexto(texto);

  const materias = [];

  for (const [materia, palabras] of Object.entries(CLASIFICACION)) {
    const coincidencias = palabras.filter(palabra =>
      contenido.includes(normalizarTexto(palabra))
    );

    if (coincidencias.length > 0) {
      materias.push(materia);
    }
  }

  return materias;
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

    if (!respuesta.ok) {
      return "";
    }

    const datos = await respuesta.json();

    const nota = datos.Nota || datos.nota || {};

    if (Array.isArray(nota)) {
      return "";
    }

    const contenido =
      nota.cadenaContenido ||
      nota.contenido ||
      nota.contenidoTxt ||
      "";

    return extraerTextoHTML(contenido);

  } catch (error) {
    console.error(
      "No se pudo consultar el detalle:",
      codNota,
      error
    );

    return "";
  }
}

function crearTarjeta(nota, materias, contenidoDisponible) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "card";

  const titulo = document.createElement("h3");
  titulo.textContent = nota.titulo;

  const organismo = document.createElement("p");
  organismo.textContent =
    nota.codOrgaDos ||
    nota.nombreCodOrgaUno ||
    "Diario Oficial de la Federación";

  const clasificacion = document.createElement("p");

  if (materias.length > 0) {
    clasificacion.textContent =
      "Materias detectadas: " +
      materias.map(materia => "Derecho " + materia.toLowerCase()).join(", ");
  } else if (contenidoDisponible) {
    clasificacion.textContent =
      "Clasificación: Otras publicaciones";
  } else {
    clasificacion.textContent =
      "Clasificación pendiente: contenido no disponible";
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

  // Primera etapa: consultar las publicaciones de cada fecha.
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

      console.error(
        "Error consultando fecha:",
        fecha,
        error
      );
    }

    estado.textContent =
      `Consultando DOF: ${i + 1} de ${DIAS_CONSULTA} días...`;
  }

  // Evitar publicaciones duplicadas.
  const unicas = new Map();

  publicaciones.forEach(nota => {
    unicas.set(String(nota.codNota), nota);
  });

  publicaciones = Array.from(unicas.values());

  if (publicaciones.length === 0) {
    estado.textContent =
      errores === DIAS_CONSULTA
        ? "No fue posible conectar con el Diario Oficial de la Federación. Intenta nuevamente."
        : "No se encontraron publicaciones en los últimos 7 días.";

    return;
  }

  // Ordenar publicaciones por fecha.
  publicaciones.sort((a, b) => {
    const fechaA = a.fechaConsulta.split("-").reverse().join("");
    const fechaB = b.fechaConsulta.split("-").reverse().join("");

    return fechaB.localeCompare(fechaA);
  });

  const fragmento = document.createDocumentFragment();

  let clasificadas = 0;
  let otras = 0;
  let pendientes = 0;

  // Segunda etapa: consultar el contenido y clasificar.
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

    const materias = clasificarPublicacion(textoAnalizar);

    if (materias.length > 0) {
      clasificadas++;
    } else if (contenido) {
      otras++;
    } else {
      pendientes++;
    }

    const tarjeta = crearTarjeta(
      nota,
      materias,
      Boolean(contenido)
    );

    fragmento.appendChild(tarjeta);

    // Respetar una pausa entre consultas al servicio.
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
      ` No se pudieron consultar ${errores} fechas.`;
  }

  // Aplicar los filtros actuales después de cargar los resultados.
  if (typeof filterNews === "function") {
    filterNews();
  }
}

consultarDOF();
