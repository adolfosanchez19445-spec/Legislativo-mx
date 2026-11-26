 "use strict";

// ==================================================
// LEGISLATIVO MX - MONITOR DEL DIARIO OFICIAL
// ==================================================

const DOF_API = "https://sidof.segob.gob.mx/dof/sidof";
const DIAS_CONSULTA = 7;
const ESPERA_ENTRE_NOTAS = 250;

let publicacionesDOF = [];
let consultaEnCurso = false;

// ==================================================
// ELEMENTOS HTML
// ==================================================

const elementosDOF = {
  resultados: document.getElementById("dof-results"),
  estado: document.getElementById("dof-status"),
  diagnostico: document.getElementById("juria-diagnostico"),
  busqueda: document.getElementById("search"),
  categoria: document.getElementById("category"),
  buscar: document.getElementById("search-button"),
  actualizar: document.getElementById("refresh-button"),
  total: document.getElementById("stat-total"),
  identificadas: document.getElementById("stat-identificadas"),
  otras: document.getElementById("stat-otras"),
  pendientes: document.getElementById("stat-pendientes"),
  materias: document.getElementById("materias-list")
};

// ==================================================
// UTILIDADES
// ==================================================

function obtenerFecha(diasAtras = 0) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - diasAtras);

  return [
    String(fecha.getDate()).padStart(2, "0"),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    fecha.getFullYear()
  ].join("-");
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

function escaparHTML(texto) {
  return String(texto || "").replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[caracter]);
}

function obtenerDependencia(nota) {
  return [
    nota.nombOrganismo,
    nota.nombreOrganismo,
    nota.nombreCodOrgaUno,
    nota.nombreCodoOrgaUno,
    nota.codOrgaDos,
    nota.organismo,
    nota.dependencia
  ].find(valor =>
    valor && String(valor).toLowerCase() !== "null"
  ) || "Dependencia no identificada";
}

function obtenerTitulo(nota) {
  return nota.titulo ||
    nota.nombre ||
    nota.descripcion ||
    "Publicación sin título disponible";
}

function obtenerCodigo(nota) {
  return nota.codNota || nota.codigo || "";
}

function obtenerFechaNota(nota) {
  return nota.fecha || nota.fechaPublicacion || "";
}

function obtenerNotasRespuesta(datos) {
  const grupos = [
    datos.NotasMatutinas,
    datos.NotasVespertinas,
    datos.NotasExtraordinarias,
    datos.Notas,
    datos.notas
  ];

  return grupos.flatMap(grupo =>
    Array.isArray(grupo) ? grupo : []
  );
}

// ==================================================
// REGLAS JURÍDICAS
// ==================================================

const REGLAS_JURIDICAS = {

  "Constitucional": [
    "constitucion politica de los estados unidos mexicanos",
    "reforma constitucional",
    "controversia constitucional",
    "accion de inconstitucionalidad",
    "control constitucional",
    "supremacia constitucional",
    "division de poderes"
  ],

  "Penal": [
    "codigo penal federal",
    "codigo penal",
    "derecho penal",
    "delincuencia organizada",
    "feminicidio",
    "homicidio",
    "robo",
    "fraude",
    "delitos",
    "ministerio publico"
  ],

  "Procesal Penal": [
    "codigo nacional de procedimientos penales",
    "proceso penal acusatorio",
    "sistema penal acusatorio",
    "audiencia inicial",
    "juicio oral penal",
    "vinculacion a proceso",
    "juez de control",
    "carpeta de investigacion"
  ],

  "Civil": [
    "codigo civil federal",
    "codigo civil",
    "derecho civil",
    "responsabilidad civil",
    "obligaciones civiles",
    "arrendamiento",
    "daño moral"
  ],

  "Familiar": [
    "codigo nacional de procedimientos civiles y familiares",
    "derecho familiar",
    "pension alimenticia",
    "guarda y custodia",
    "patria potestad",
    "violencia familiar",
    "divorcio",
    "adopcion",
    "filiacion"
  ],

  "Mercantil": [
    "codigo de comercio",
    "derecho mercantil",
    "concurso mercantil",
    "sociedades mercantiles",
    "titulos de credito",
    "sociedad anonima",
    "operaciones mercantiles"
  ],

  "Laboral": [
    "ley federal del trabajo",
    "derecho laboral",
    "contrato colectivo de trabajo",
    "relaciones laborales",
    "justicia laboral",
    "sindicato",
    "jornada laboral",
    "huelga"
  ],

  "Administrativo": [
    "derecho administrativo",
    "procedimiento administrativo",
    "acto administrativo",
    "responsabilidad administrativa",
    "administracion publica",
    "contratacion publica",
    "licitacion publica",
    "concesion administrativa",
    "revocacion de autorizacion",
    "servidores publicos",
    "sanciones administrativas"
  ],

  "Fiscal": [
    "codigo fiscal de la federacion",
    "ley del impuesto sobre la renta",
    "ley del impuesto al valor agregado",
    "derecho fiscal",
    "creditos fiscales",
    "resolucion miscelanea fiscal",
    "impuestos",
    "contribuciones",
    "recaudacion"
  ],

  "Financiero": [
    "derecho financiero",
    "sistema financiero mexicano",
    "ley de instituciones de credito",
    "instituciones financieras",
    "operaciones financieras",
    "servicios financieros",
    "entidades financieras",
    "financiamiento"
  ],

  "Agrario": [
    "ley agraria",
    "derecho agrario",
    "tribunales agrarios",
    "registro agrario nacional",
    "propiedad ejidal",
    "ejidatarios",
    "tierras ejidales"
  ],

  "Ambiental": [
    "ley general del equilibrio ecologico",
    "derecho ambiental",
    "impacto ambiental",
    "proteccion ambiental",
    "responsabilidad ambiental",
    "contaminacion",
    "biodiversidad",
    "residuos peligrosos"
  ],

  "Electoral": [
    "ley general de instituciones y procedimientos electorales",
    "derecho electoral",
    "tribunal electoral",
    "proceso electoral",
    "elecciones",
    "sufragio",
    "partidos politicos"
  ],

  "Internacional Público": [
    "derecho internacional publico",
    "responsabilidad internacional del estado",
    "organizacion de las naciones unidas",
    "relaciones diplomaticas",
    "derecho de los tratados",
    "organismos internacionales"
  ],

  "Internacional Privado": [
    "derecho internacional privado",
    "conflicto de leyes",
    "conflicto de jurisdicciones",
    "competencia judicial internacional",
    "contratos internacionales"
  ],

  "Derechos Humanos": [
    "comision nacional de los derechos humanos",
    "sistema interamericano de derechos humanos",
    "convencion americana sobre derechos humanos",
    "proteccion de derechos humanos",
    "no discriminacion",
    "igualdad sustantiva"
  ],

  "Migratorio": [
    "ley de migracion",
    "derecho migratorio",
    "instituto nacional de migracion",
    "politica migratoria",
    "migrantes",
    "refugiados",
    "deportacion"
  ],

  "Corporativo": [
    "derecho corporativo",
    "gobierno corporativo",
    "responsabilidad corporativa",
    "cumplimiento corporativo",
    "fusiones y adquisiciones",
    "consejo de administracion"
  ],

  "Seguridad Social": [
    "ley del seguro social",
    "ley del instituto de seguridad y servicios sociales",
    "derecho de la seguridad social",
    "instituto mexicano del seguro social",
    "cuotas obrero patronales",
    "jubilacion"
  ],

  "Amparo": [
    "ley de amparo",
    "juicio de amparo",
    "amparo directo",
    "amparo indirecto",
    "suspension del acto reclamado",
    "quejoso",
    "autoridad responsable"
  ],

  "Procesal Civil": [
    "codigo nacional de procedimientos civiles y familiares",
    "derecho procesal civil",
    "procedimiento civil",
    "juicio ordinario civil",
    "emplazamiento",
    "audiencia civil"
  ],

  "Procesal Administrativo": [
    "juicio contencioso administrativo",
    "procedimiento contencioso administrativo",
    "derecho procesal administrativo",
    "tribunal federal de justicia administrativa",
    "recurso administrativo",
    "nulidad administrativa"
  ],

  "Económico": [
    "derecho economico",
    "orden economico",
    "regulacion economica",
    "politica economica",
    "desarrollo economico",
    "mercado interno"
  ],

  "Bancario y Bursátil": [
    "ley del mercado de valores",
    "derecho bancario",
    "derecho bursatil",
    "materia bancaria",
    "materia bursatil",
    "comision nacional bancaria y de valores",
    "union de credito",
    "operaciones bancarias"
  ],

  "Propiedad Intelectual": [
    "ley federal de proteccion a la propiedad industrial",
    "ley federal del derecho de autor",
    "derecho de propiedad intelectual",
    "instituto mexicano de la propiedad industrial",
    "registro de marcas",
    "patentes",
    "propiedad industrial"
  ],

  "Informático y Digital": [
    "delitos informaticos",
    "derecho informatico",
    "derecho digital",
    "proteccion de datos personales",
    "firma electronica avanzada",
    "comercio electronico",
    "ciberseguridad",
    "inteligencia artificial"
  ],

  "Notarial y Registral": [
    "derecho notarial",
    "derecho registral",
    "ley del notariado",
    "registro publico de la propiedad",
    "registro publico de comercio",
    "notario publico",
    "escritura publica"
  ],

  "Aduanero": [
    "ley aduanera",
    "derecho aduanero",
    "materia aduanera",
    "agencia nacional de aduanas de mexico",
    "despacho aduanero",
    "importacion",
    "exportacion",
    "pedimento"
  ],

  "Municipal": [
    "derecho municipal",
    "gobierno municipal",
    "administracion publica municipal",
    "reglamento municipal",
    "ayuntamiento",
    "cabildo",
    "presidencia municipal"
  ],

  "Competencia Económica": [
    "ley federal de competencia economica",
    "derecho de la competencia economica",
    "practicas monopolicas",
    "concentraciones economicas",
    "comision federal de competencia economica",
    "mercado relevante",
    "libre concurrencia"
  ],

  "Derecho Comparado": [
    "derecho comparado",
    "estudio comparado de legislaciones",
    "comparacion de sistemas juridicos",
    "legislacion comparada",
    "common law",
    "civil law"
  ],

  "Derecho Médico y Sanitario": [
    "ley general de salud",
    "derecho sanitario",
    "derecho medico",
    "regulacion sanitaria",
    "responsabilidad medica",
    "expediente clinico",
    "consentimiento informado"
  ],

  "Derecho Educativo": [
    "ley general de educacion",
    "derecho educativo",
    "sistema educativo nacional",
    "legislacion educativa",
    "instituciones educativas",
    "personal docente"
  ],

  "Derecho Deportivo": [
    "ley general de cultura fisica y deporte",
    "derecho deportivo",
    "legislacion deportiva",
    "federaciones deportivas",
    "deportistas"
  ],

  "Derecho Turístico": [
    "ley general de turismo",
    "derecho turistico",
    "materia turistica",
    "legislacion turistica",
    "servicios turisticos"
  ],

  "Derecho de la Cultura": [
    "ley general de cultura y derechos culturales",
    "derecho cultural",
    "derecho de la cultura",
    "patrimonio cultural",
    "monumentos historicos",
    "bienes culturales"
  ],

  "Derecho de Consumo": [
    "ley federal de proteccion al consumidor",
    "derecho del consumidor",
    "derecho de consumo",
    "proteccion al consumidor",
    "procuraduria federal del consumidor",
    "publicidad engañosa"
  ],

  "Derecho Energético": [
    "derecho energetico",
    "ley del sector electrico",
    "ley del sector hidrocarburos",
    "industria electrica",
    "industria de hidrocarburos",
    "gas natural"
  ],

  "Derecho de Telecomunicaciones": [
    "ley en materia de telecomunicaciones",
    "derecho de las telecomunicaciones",
    "regulacion de telecomunicaciones",
    "radiodifusion",
    "espectro radioelectrico",
    "redes publicas"
  ]

};

// ==================================================
// CLASIFICACIÓN JURÍDICA
// ==================================================

function clasificarPublicacion(titulo, dependencia) {
  const texto = normalizarTexto(
    `${titulo} ${dependencia}`
  );

  const resultados = [];

  for (const [materia, palabras] of Object.entries(REGLAS_JURIDICAS)) {
    const coincidencias = palabras.filter(palabra =>
      texto.includes(normalizarTexto(palabra))
    );

    if (coincidencias.length) {
      resultados.push({
        materia,
        puntuacion: coincidencias.length,
        motivos: coincidencias
      });
    }
  }

  resultados.sort((a, b) =>
    b.puntuacion - a.puntuacion
  );

  const principal = resultados[0];

  if (!principal) {
    return {
      materiaPrincipal: null,
      materias: [],
      secundarias: [],
      detalles: [],
      confianza: "Baja"
    };
  }

  const secundarias = resultados
    .slice(1)
    .filter(resultado =>
      resultado.puntuacion >= 2 &&
      resultado.puntuacion >= principal.puntuacion * 0.5
    );

  const confianza =
    principal.puntuacion >= 3 ? "Alta" :
    principal.puntuacion >= 2 ? "Media" : "Baja";

  return {
    materiaPrincipal: principal.materia,
    materias: [
      principal.materia,
      ...secundarias.map(r => r.materia)
    ],
    secundarias: secundarias.map(r => r.materia),
    detalles: resultados,
    confianza
  };
}

// ==================================================
// TIPO DOCUMENTAL
// ==================================================

function detectarTipoDocumental(titulo) {
  const texto = normalizarTexto(titulo);

  const tipos = [
    ["Tratado internacional", ["tratado"]],
    ["Convención", ["convencion"]],
    ["Protocolo internacional", ["protocolo"]],
    ["Jurisprudencia", ["jurisprudencia"]],
    ["Tesis aislada", ["tesis aislada"]],
    ["Sentencia", ["sentencia"]],
    ["Ejecutoria", ["ejecutoria"]],
    ["Constitución", ["constitucion politica"]],
    ["Código", ["codigo penal", "codigo civil", "codigo fiscal", "codigo de comercio", "codigo nacional"]],
    ["Decreto", ["decreto"]],
    ["Reforma o adición", ["reforma", "adicion"]],
    ["Iniciativa de ley", ["iniciativa con proyecto de decreto"]],
    ["Reglamento", ["reglamento"]],
    ["Ley", ["ley general", "ley federal", "ley organica", "ley de"]],
    ["Convenio", ["convenio"]],
    ["Oficio administrativo", ["oficio mediante el cual", "oficio por el que"]],
    ["Resolución administrativa", ["resolucion administrativa", "resolucion por la que"]],
    ["Acuerdo administrativo", ["acuerdo por el que", "acuerdo mediante el cual"]],
    ["Circular", ["circular"]],
    ["Lineamiento", ["lineamientos"]],
    ["Norma oficial mexicana", ["norma oficial mexicana"]],
    ["Reglas de operación", ["reglas de operacion"]],
    ["Aviso", ["aviso"]],
    ["Convocatoria", ["convocatoria"]],
    ["Declaratoria", ["declaratoria"]]
  ];

  for (const [tipo, palabras] of tipos) {
    if (palabras.some(palabra =>
      texto.includes(normalizarTexto(palabra))
    )) {
      return tipo;
    }
  }

  return "No determinado";
}

function detectarGrupo(tipo) {
  const grupos = {
    "Constitución": "Legislativo",
    "Ley": "Legislativo",
    "Código": "Legislativo",
    "Decreto": "Legislativo",
    "Reforma o adición": "Legislativo",
    "Iniciativa de ley": "Legislativo",
    "Reglamento": "Normativo",
    "Jurisprudencia": "Judicial",
    "Tesis aislada": "Judicial",
    "Sentencia": "Judicial",
    "Ejecutoria": "Judicial",
    "Tratado internacional": "Internacional",
    "Convención": "Internacional",
    "Protocolo internacional": "Internacional"
  };

  return grupos[tipo] || "Administrativo";
}

// ==================================================
// CREAR TARJETA
// ==================================================

function crearTarjeta(nota) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "card";

  const titulo = obtenerTitulo(nota);
  const dependencia = obtenerDependencia(nota);
  const codigo = obtenerCodigo(nota);
  const fecha = obtenerFechaNota(nota);

  const clasificacion = clasificarPublicacion(
    titulo,
    dependencia
  );

  const tipo = detectarTipoDocumental(titulo);
  const grupo = detectarGrupo(tipo);

  tarjeta.dataset.materias =
    clasificacion.materias.join("|");

  tarjeta.dataset.materiaPrincipal =
    clasificacion.materiaPrincipal || "";

  // Clasificación integrada:
  // identificada, pendiente u otras.

  tarjeta.dataset.clasificacion =
    !clasificacion.materiaPrincipal
      ? "otras"
      : clasificacion.confianza === "Baja"
        ? "pendientes"
        : "identificada";

  const h3 = document.createElement("h3");
  h3.textContent = titulo;

  const pDependencia = document.createElement("p");
  pDependencia.textContent = dependencia;

  const pFecha = document.createElement("p");
  pFecha.textContent =
    `Fecha: ${fecha || "No disponible"}`;

  const pTipo = document.createElement("p");
  pTipo.textContent =
    `Tipo documental: ${tipo}. Grupo: ${grupo}.`;

  const pMateria = document.createElement("p");

  pMateria.textContent = clasificacion.materiaPrincipal
    ? `Materia principal: Derecho ${clasificacion.materiaPrincipal}. Confianza: ${clasificacion.confianza}.`
    : "Materia principal: No identificada.";

  const pSecundarias = document.createElement("p");

  pSecundarias.textContent =
    clasificacion.secundarias.length
      ? `Materias secundarias: ${clasificacion.secundarias.join(", ")}.`
      : "Materias secundarias: Ninguna identificada.";

  tarjeta.append(
    h3,
    pDependencia,
    pFecha,
    pTipo,
    pMateria,
    pSecundarias
  );

  if (clasificacion.detalles.length) {
    const motivos = document.createElement("p");

    motivos.textContent =
      "Motivos: " +
      clasificacion.detalles
        .slice(0, 3)
        .flatMap(d => d.motivos.slice(0, 2))
        .join(", ");

    tarjeta.appendChild(motivos);
  }

  if (codigo) {
    const enlace = document.createElement("a");

    enlace.href =
      `https://www.dof.gob.mx/nota_detalle.php?codigo=${encodeURIComponent(codigo)}&fecha=${encodeURIComponent(fecha)}`;

    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    enlace.textContent = "Consultar publicación oficial";

    tarjeta.appendChild(enlace);
  }

  return tarjeta;
}

// ==================================================
// ESTADÍSTICAS
// ==================================================

function actualizarEstadisticas() {
  const total = publicacionesDOF.length;

  const identificadas = publicacionesDOF.filter(publicacion =>
    publicacion.clasificacion.materiaPrincipal &&
    publicacion.clasificacion.confianza !== "Baja"
  ).length;

  const pendientes = publicacionesDOF.filter(publicacion =>
    publicacion.clasificacion.materiaPrincipal &&
    publicacion.clasificacion.confianza === "Baja"
  ).length;

  const otras = publicacionesDOF.filter(publicacion =>
    !publicacion.clasificacion.materiaPrincipal
  ).length;

  if (elementosDOF.total) {
    elementosDOF.total.textContent = total;
  }

  if (elementosDOF.identificadas) {
    elementosDOF.identificadas.textContent = identificadas;
  }

  if (elementosDOF.otras) {
    elementosDOF.otras.textContent = otras;
  }

  if (elementosDOF.pendientes) {
    elementosDOF.pendientes.textContent = pendientes;
  }
}

// ==================================================
// FILTROS
// ==================================================

function prepararFiltros() {
  const select = elementosDOF.categoria;

  if (!select || !window.CATALOGO_JURIDICO) return;

  const materias = CATALOGO_JURIDICO.materias;

  materias.forEach(materia => {
    const existe = Array.from(select.options).some(
      opcion => opcion.value === materia
    );

  if (!existe) {
    const opcion = document.createElement("option");

    opcion.value = materia;
    opcion.textContent = "Derecho " + materia;

    select.appendChild(opcion);
  }
});

if (elementosDOF.materias) {
  elementosDOF.materias.textContent =
    materias.map(materia =>
      "Derecho " + materia
    ).join(" · ");
}

if (elementosDOF.diagnostico) {
  elementosDOF.diagnostico.textContent =
    `JURIA tiene disponible un catálogo de ${materias.length} materias jurídicas. La clasificación actual utiliza reglas de identificación textual.`;
}
}

// ==================================================
// FILTROS DE PUBLICACIONES
// ==================================================

function filtrarPublicaciones() {
  const termino = normalizarTexto(
    elementosDOF.busqueda?.value || ""
  );

  const seleccion =
    elementosDOF.categoria?.value || "todos";

  const tarjetas =
    elementosDOF.resultados.querySelectorAll(".card");

  tarjetas.forEach(tarjeta => {
    const texto = normalizarTexto(tarjeta.textContent);

    const materias = (
      tarjeta.dataset.materias || ""
    ).split("|");

    const coincideTexto = texto.includes(termino);

    let coincideMateria = true;

    if (seleccion === "otras") {
      coincideMateria =
        tarjeta.dataset.clasificacion === "otras";

    } else if (seleccion === "pendientes") {
      coincideMateria =
        tarjeta.dataset.clasificacion === "pendientes";

    } else if (seleccion !== "todos") {
      coincideMateria =
        materias.includes(seleccion);
    }

    tarjeta.style.display =
      coincideTexto && coincideMateria ? "" : "none";
  });
}

 "use strict";

// ==================================================
// LEGISLATIVO MX - MONITOR DEL DIARIO OFICIAL
// ==================================================

const DOF_API = "https://sidof.segob.gob.mx/dof/sidof";
const DIAS_CONSULTA = 7;
const ESPERA_ENTRE_NOTAS = 250;

let publicacionesDOF = [];
let consultaEnCurso = false;

// ==================================================
// ELEMENTOS HTML
// ==================================================

const elementosDOF = {
  resultados: document.getElementById("dof-results"),
  estado: document.getElementById("dof-status"),
  diagnostico: document.getElementById("juria-diagnostico"),
  busqueda: document.getElementById("search"),
  categoria: document.getElementById("category"),
  buscar: document.getElementById("search-button"),
  actualizar: document.getElementById("refresh-button"),
  total: document.getElementById("stat-total"),
  identificadas: document.getElementById("stat-identificadas"),
  otras: document.getElementById("stat-otras"),
  pendientes: document.getElementById("stat-pendientes"),
  materias: document.getElementById("materias-list")
};

// ==================================================
// UTILIDADES
// ==================================================

function obtenerFecha(diasAtras = 0) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - diasAtras);

  return [
    String(fecha.getDate()).padStart(2, "0"),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    fecha.getFullYear()
  ].join("-");
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

function escaparHTML(texto) {
  return String(texto || "").replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[caracter]);
}

function obtenerDependencia(nota) {
  return [
    nota.nombOrganismo,
    nota.nombreOrganismo,
    nota.nombreCodOrgaUno,
    nota.nombreCodoOrgaUno,
    nota.codOrgaDos,
    nota.organismo,
    nota.dependencia
  ].find(valor =>
    valor && String(valor).toLowerCase() !== "null"
  ) || "Dependencia no identificada";
}

function obtenerTitulo(nota) {
  return nota.titulo ||
    nota.nombre ||
    nota.descripcion ||
    "Publicación sin título disponible";
}

function obtenerCodigo(nota) {
  return nota.codNota || nota.codigo || "";
}

function obtenerFechaNota(nota) {
  return nota.fecha || nota.fechaPublicacion || "";
}

function obtenerNotasRespuesta(datos) {
  const grupos = [
    datos.NotasMatutinas,
    datos.NotasVespertinas,
    datos.NotasExtraordinarias,
    datos.Notas,
    datos.notas
  ];

  return grupos.flatMap(grupo =>
    Array.isArray(grupo) ? grupo : []
  );
}

// ==================================================
// REGLAS JURÍDICAS
// ==================================================

const REGLAS_JURIDICAS = {

  "Constitucional": [
    "constitucion politica de los estados unidos mexicanos",
    "reforma constitucional",
    "controversia constitucional",
    "accion de inconstitucionalidad",
    "control constitucional",
    "supremacia constitucional",
    "division de poderes"
  ],

  "Penal": [
    "codigo penal federal",
    "codigo penal",
    "derecho penal",
    "delincuencia organizada",
    "feminicidio",
    "homicidio",
    "robo",
    "fraude",
    "delitos",
    "ministerio publico"
  ],

  "Procesal Penal": [
    "codigo nacional de procedimientos penales",
    "proceso penal acusatorio",
    "sistema penal acusatorio",
    "audiencia inicial",
    "juicio oral penal",
    "vinculacion a proceso",
    "juez de control",
    "carpeta de investigacion"
  ],

  "Civil": [
    "codigo civil federal",
    "codigo civil",
    "derecho civil",
    "responsabilidad civil",
    "obligaciones civiles",
    "arrendamiento",
    "daño moral"
  ],

  "Familiar": [
    "codigo nacional de procedimientos civiles y familiares",
    "derecho familiar",
    "pension alimenticia",
    "guarda y custodia",
    "patria potestad",
    "violencia familiar",
    "divorcio",
    "adopcion",
    "filiacion"
  ],

  "Mercantil": [
    "codigo de comercio",
    "derecho mercantil",
    "concurso mercantil",
    "sociedades mercantiles",
    "titulos de credito",
    "sociedad anonima",
    "operaciones mercantiles"
  ],

  "Laboral": [
    "ley federal del trabajo",
    "derecho laboral",
    "contrato colectivo de trabajo",
    "relaciones laborales",
    "justicia laboral",
    "sindicato",
    "jornada laboral",
    "huelga"
  ],

  "Administrativo": [
    "derecho administrativo",
    "procedimiento administrativo",
    "acto administrativo",
    "responsabilidad administrativa",
    "administracion publica",
    "contratacion publica",
    "licitacion publica",
    "concesion administrativa",
    "revocacion de autorizacion",
    "servidores publicos",
    "sanciones administrativas"
  ],

  "Fiscal": [
    "codigo fiscal de la federacion",
    "ley del impuesto sobre la renta",
    "ley del impuesto al valor agregado",
    "derecho fiscal",
    "creditos fiscales",
    "resolucion miscelanea fiscal",
    "impuestos",
    "contribuciones",
    "recaudacion"
  ],

  "Financiero": [
    "derecho financiero",
    "sistema financiero mexicano",
    "ley de instituciones de credito",
    "instituciones financieras",
    "operaciones financieras",
    "servicios financieros",
    "entidades financieras",
    "financiamiento"
  ],

  "Agrario": [
    "ley agraria",
    "derecho agrario",
    "tribunales agrarios",
    "registro agrario nacional",
    "propiedad ejidal",
    "ejidatarios",
    "tierras ejidales"
  ],

  "Ambiental": [
    "ley general del equilibrio ecologico",
    "derecho ambiental",
    "impacto ambiental",
    "proteccion ambiental",
    "responsabilidad ambiental",
    "contaminacion",
    "biodiversidad",
    "residuos peligrosos"
  ],

  "Electoral": [
    "ley general de instituciones y procedimientos electorales",
    "derecho electoral",
    "tribunal electoral",
    "proceso electoral",
    "elecciones",
    "sufragio",
    "partidos politicos"
  ],

  "Internacional Público": [
    "derecho internacional publico",
    "responsabilidad internacional del estado",
    "organizacion de las naciones unidas",
    "relaciones diplomaticas",
    "derecho de los tratados",
    "organismos internacionales"
  ],

  "Internacional Privado": [
    "derecho internacional privado",
    "conflicto de leyes",
    "conflicto de jurisdicciones",
    "competencia judicial internacional",
    "contratos internacionales"
  ],

  "Derechos Humanos": [
    "comision nacional de los derechos humanos",
    "sistema interamericano de derechos humanos",
    "convencion americana sobre derechos humanos",
    "proteccion de derechos humanos",
    "no discriminacion",
    "igualdad sustantiva"
  ],

  "Migratorio": [
    "ley de migracion",
    "derecho migratorio",
    "instituto nacional de migracion",
    "politica migratoria",
    "migrantes",
    "refugiados",
    "deportacion"
  ],

  "Corporativo": [
    "derecho corporativo",
    "gobierno corporativo",
    "responsabilidad corporativa",
    "cumplimiento corporativo",
    "fusiones y adquisiciones",
    "consejo de administracion"
  ],

  "Seguridad Social": [
    "ley del seguro social",
    "ley del instituto de seguridad y servicios sociales",
    "derecho de la seguridad social",
    "instituto mexicano del seguro social",
    "cuotas obrero patronales",
    "jubilacion"
  ],

  "Amparo": [
    "ley de amparo",
    "juicio de amparo",
    "amparo directo",
    "amparo indirecto",
    "suspension del acto reclamado",
    "quejoso",
    "autoridad responsable"
  ],

  "Procesal Civil": [
    "codigo nacional de procedimientos civiles y familiares",
    "derecho procesal civil",
    "procedimiento civil",
    "juicio ordinario civil",
    "emplazamiento",
    "audiencia civil"
  ],

  "Procesal Administrativo": [
    "juicio contencioso administrativo",
    "procedimiento contencioso administrativo",
    "derecho procesal administrativo",
    "tribunal federal de justicia administrativa",
    "recurso administrativo",
    "nulidad administrativa"
  ],

  "Económico": [
    "derecho economico",
    "orden economico",
    "regulacion economica",
    "politica economica",
    "desarrollo economico",
    "mercado interno"
  ],

  "Bancario y Bursátil": [
    "ley del mercado de valores",
    "derecho bancario",
    "derecho bursatil",
    "materia bancaria",
    "materia bursatil",
    "comision nacional bancaria y de valores",
    "union de credito",
    "operaciones bancarias"
  ],

  "Propiedad Intelectual": [
    "ley federal de proteccion a la propiedad industrial",
    "ley federal del derecho de autor",
    "derecho de propiedad intelectual",
    "instituto mexicano de la propiedad industrial",
    "registro de marcas",
    "patentes",
    "propiedad industrial"
  ],

  "Informático y Digital": [
    "delitos informaticos",
    "derecho informatico",
    "derecho digital",
    "proteccion de datos personales",
    "firma electronica avanzada",
    "comercio electronico",
    "ciberseguridad",
    "inteligencia artificial"
  ],

  "Notarial y Registral": [
    "derecho notarial",
    "derecho registral",
    "ley del notariado",
    "registro publico de la propiedad",
    "registro publico de comercio",
    "notario publico",
    "escritura publica"
  ],

  "Aduanero": [
    "ley aduanera",
    "derecho aduanero",
    "materia aduanera",
    "agencia nacional de aduanas de mexico",
    "despacho aduanero",
    "importacion",
    "exportacion",
    "pedimento"
  ],

  "Municipal": [
    "derecho municipal",
    "gobierno municipal",
    "administracion publica municipal",
    "reglamento municipal",
    "ayuntamiento",
    "cabildo",
    "presidencia municipal"
  ],

  "Competencia Económica": [
    "ley federal de competencia economica",
    "derecho de la competencia economica",
    "practicas monopolicas",
    "concentraciones economicas",
    "comision federal de competencia economica",
    "mercado relevante",
    "libre concurrencia"
  ],

  "Derecho Comparado": [
    "derecho comparado",
    "estudio comparado de legislaciones",
    "comparacion de sistemas juridicos",
    "legislacion comparada",
    "common law",
    "civil law"
  ],

  "Derecho Médico y Sanitario": [
    "ley general de salud",
    "derecho sanitario",
    "derecho medico",
    "regulacion sanitaria",
    "responsabilidad medica",
    "expediente clinico",
    "consentimiento informado"
  ],

  "Derecho Educativo": [
    "ley general de educacion",
    "derecho educativo",
    "sistema educativo nacional",
    "legislacion educativa",
    "instituciones educativas",
    "personal docente"
  ],

  "Derecho Deportivo": [
    "ley general de cultura fisica y deporte",
    "derecho deportivo",
    "legislacion deportiva",
    "federaciones deportivas",
    "deportistas"
  ],

  "Derecho Turístico": [
    "ley general de turismo",
    "derecho turistico",
    "materia turistica",
    "legislacion turistica",
    "servicios turisticos"
  ],

  "Derecho de la Cultura": [
    "ley general de cultura y derechos culturales",
    "derecho cultural",
    "derecho de la cultura",
    "patrimonio cultural",
    "monumentos historicos",
    "bienes culturales"
  ],

  "Derecho de Consumo": [
    "ley federal de proteccion al consumidor",
    "derecho del consumidor",
    "derecho de consumo",
    "proteccion al consumidor",
    "procuraduria federal del consumidor",
    "publicidad engañosa"
  ],

  "Derecho Energético": [
    "derecho energetico",
    "ley del sector electrico",
    "ley del sector hidrocarburos",
    "industria electrica",
    "industria de hidrocarburos",
    "gas natural"
  ],

  "Derecho de Telecomunicaciones": [
    "ley en materia de telecomunicaciones",
    "derecho de las telecomunicaciones",
    "regulacion de telecomunicaciones",
    "radiodifusion",
    "espectro radioelectrico",
    "redes publicas"
  ]

};

// ==================================================
// CLASIFICACIÓN JURÍDICA
// ==================================================

function clasificarPublicacion(titulo, dependencia) {
  const texto = normalizarTexto(
    `${titulo} ${dependencia}`
  );

  const resultados = [];

  for (const [materia, palabras] of Object.entries(REGLAS_JURIDICAS)) {
    const coincidencias = palabras.filter(palabra =>
      texto.includes(normalizarTexto(palabra))
    );

    if (coincidencias.length) {
      resultados.push({
        materia,
        puntuacion: coincidencias.length,
        motivos: coincidencias
      });
    }
  }

  resultados.sort((a, b) =>
    b.puntuacion - a.puntuacion
  );

  const principal = resultados[0];

  if (!principal) {
    return {
      materiaPrincipal: null,
      materias: [],
      secundarias: [],
      detalles: [],
      confianza: "Baja"
    };
  }

  const secundarias = resultados
    .slice(1)
    .filter(resultado =>
      resultado.puntuacion >= 2 &&
      resultado.puntuacion >= principal.puntuacion * 0.5
    );

  const confianza =
    principal.puntuacion >= 3 ? "Alta" :
    principal.puntuacion >= 2 ? "Media" : "Baja";

  return {
    materiaPrincipal: principal.materia,
    materias: [
      principal.materia,
      ...secundarias.map(r => r.materia)
    ],
    secundarias: secundarias.map(r => r.materia),
    detalles: resultados,
    confianza
  };
}

// ==================================================
// TIPO DOCUMENTAL
// ==================================================

function detectarTipoDocumental(titulo) {
  const texto = normalizarTexto(titulo);

  const tipos = [
    ["Tratado internacional", ["tratado"]],
    ["Convención", ["convencion"]],
    ["Protocolo internacional", ["protocolo"]],
    ["Jurisprudencia", ["jurisprudencia"]],
    ["Tesis aislada", ["tesis aislada"]],
    ["Sentencia", ["sentencia"]],
    ["Ejecutoria", ["ejecutoria"]],
    ["Constitución", ["constitucion politica"]],
    ["Código", ["codigo penal", "codigo civil", "codigo fiscal", "codigo de comercio", "codigo nacional"]],
    ["Decreto", ["decreto"]],
    ["Reforma o adición", ["reforma", "adicion"]],
    ["Iniciativa de ley", ["iniciativa con proyecto de decreto"]],
    ["Reglamento", ["reglamento"]],
    ["Ley", ["ley general", "ley federal", "ley organica", "ley de"]],
    ["Convenio", ["convenio"]],
    ["Oficio administrativo", ["oficio mediante el cual", "oficio por el que"]],
    ["Resolución administrativa", ["resolucion administrativa", "resolucion por la que"]],
    ["Acuerdo administrativo", ["acuerdo por el que", "acuerdo mediante el cual"]],
    ["Circular", ["circular"]],
    ["Lineamiento", ["lineamientos"]],
    ["Norma oficial mexicana", ["norma oficial mexicana"]],
    ["Reglas de operación", ["reglas de operacion"]],
    ["Aviso", ["aviso"]],
    ["Convocatoria", ["convocatoria"]],
    ["Declaratoria", ["declaratoria"]]
  ];

  for (const [tipo, palabras] of tipos) {
    if (palabras.some(palabra =>
      texto.includes(normalizarTexto(palabra))
    )) {
      return tipo;
    }
  }

  return "No determinado";
}

function detectarGrupo(tipo) {
  const grupos = {
    "Constitución": "Legislativo",
    "Ley": "Legislativo",
    "Código": "Legislativo",
    "Decreto": "Legislativo",
    "Reforma o adición": "Legislativo",
    "Iniciativa de ley": "Legislativo",
    "Reglamento": "Normativo",
    "Jurisprudencia": "Judicial",
    "Tesis aislada": "Judicial",
    "Sentencia": "Judicial",
    "Ejecutoria": "Judicial",
    "Tratado internacional": "Internacional",
    "Convención": "Internacional",
    "Protocolo internacional": "Internacional"
  };

  return grupos[tipo] || "Administrativo";
}

// ==================================================
// CREAR TARJETA
// ==================================================

function crearTarjeta(nota) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "card";

  const titulo = obtenerTitulo(nota);
  const dependencia = obtenerDependencia(nota);
  const codigo = obtenerCodigo(nota);
  const fecha = obtenerFechaNota(nota);

  const clasificacion = clasificarPublicacion(
    titulo,
    dependencia
  );

  const tipo = detectarTipoDocumental(titulo);
  const grupo = detectarGrupo(tipo);

  tarjeta.dataset.materias =
    clasificacion.materias.join("|");

  tarjeta.dataset.materiaPrincipal =
    clasificacion.materiaPrincipal || "";

  // Clasificación integrada:
  // identificada, pendiente u otras.

  tarjeta.dataset.clasificacion =
    !clasificacion.materiaPrincipal
      ? "otras"
      : clasificacion.confianza === "Baja"
        ? "pendientes"
        : "identificada";

  const h3 = document.createElement("h3");
  h3.textContent = titulo;

  const pDependencia = document.createElement("p");
  pDependencia.textContent = dependencia;

  const pFecha = document.createElement("p");
  pFecha.textContent =
    `Fecha: ${fecha || "No disponible"}`;

  const pTipo = document.createElement("p");
  pTipo.textContent =
    `Tipo documental: ${tipo}. Grupo: ${grupo}.`;

  const pMateria = document.createElement("p");

  pMateria.textContent = clasificacion.materiaPrincipal
    ? `Materia principal: Derecho ${clasificacion.materiaPrincipal}. Confianza: ${clasificacion.confianza}.`
    : "Materia principal: No identificada.";

  const pSecundarias = document.createElement("p");

  pSecundarias.textContent =
    clasificacion.secundarias.length
      ? `Materias secundarias: ${clasificacion.secundarias.join(", ")}.`
      : "Materias secundarias: Ninguna identificada.";

  tarjeta.append(
    h3,
    pDependencia,
    pFecha,
    pTipo,
    pMateria,
    pSecundarias
  );

  if (clasificacion.detalles.length) {
    const motivos = document.createElement("p");

    motivos.textContent =
      "Motivos: " +
      clasificacion.detalles
        .slice(0, 3)
        .flatMap(d => d.motivos.slice(0, 2))
        .join(", ");

    tarjeta.appendChild(motivos);
  }

  if (codigo) {
    const enlace = document.createElement("a");

    enlace.href =
      `https://www.dof.gob.mx/nota_detalle.php?codigo=${encodeURIComponent(codigo)}&fecha=${encodeURIComponent(fecha)}`;

    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    enlace.textContent = "Consultar publicación oficial";

    tarjeta.appendChild(enlace);
  }

  return tarjeta;
}

// ==================================================
// ESTADÍSTICAS
// ==================================================

function actualizarEstadisticas() {
  const total = publicacionesDOF.length;

  const identificadas = publicacionesDOF.filter(publicacion =>
    publicacion.clasificacion.materiaPrincipal &&
    publicacion.clasificacion.confianza !== "Baja"
  ).length;

  const pendientes = publicacionesDOF.filter(publicacion =>
    publicacion.clasificacion.materiaPrincipal &&
    publicacion.clasificacion.confianza === "Baja"
  ).length;

  const otras = publicacionesDOF.filter(publicacion =>
    !publicacion.clasificacion.materiaPrincipal
  ).length;

  if (elementosDOF.total) {
    elementosDOF.total.textContent = total;
  }

  if (elementosDOF.identificadas) {
    elementosDOF.identificadas.textContent = identificadas;
  }

  if (elementosDOF.otras) {
    elementosDOF.otras.textContent = otras;
  }

  if (elementosDOF.pendientes) {
    elementosDOF.pendientes.textContent = pendientes;
  }
}

// ==================================================
// FILTROS
// ==================================================

function prepararFiltros() {
  const select = elementosDOF.categoria;

  if (!select || !window.CATALOGO_JURIDICO) return;

  const materias = CATALOGO_JURIDICO.materias;

  materias.forEach(materia => {
    const existe = Array.from(select.options).some(
      opcion => opcion.value === materia
    );

  if (!existe) {
    const opcion = document.createElement("option");

    opcion.value = materia;
    opcion.textContent = "Derecho " + materia;

    select.appendChild(opcion);
  }
});

if (elementosDOF.materias) {
  elementosDOF.materias.textContent =
    materias.map(materia =>
      "Derecho " + materia
    ).join(" · ");
}

if (elementosDOF.diagnostico) {
  elementosDOF.diagnostico.textContent =
    `JURIA tiene disponible un catálogo de ${materias.length} materias jurídicas. La clasificación actual utiliza reglas de identificación textual.`;
}
}

// ==================================================
// FILTROS DE PUBLICACIONES
// ==================================================

function filtrarPublicaciones() {
  const termino = normalizarTexto(
    elementosDOF.busqueda?.value || ""
  );

  const seleccion =
    elementosDOF.categoria?.value || "todos";

  const tarjetas =
    elementosDOF.resultados.querySelectorAll(".card");

  tarjetas.forEach(tarjeta => {
    const texto = normalizarTexto(tarjeta.textContent);

    const materias = (
      tarjeta.dataset.materias || ""
    ).split("|");

    const coincideTexto = texto.includes(termino);

    let coincideMateria = true;

    if (seleccion === "otras") {
      coincideMateria =
        tarjeta.dataset.clasificacion === "otras";

    } else if (seleccion === "pendientes") {
      coincideMateria =
        tarjeta.dataset.clasificacion === "pendientes";

    } else if (seleccion !== "todos") {
      coincideMateria =
        materias.includes(seleccion);
    }

    tarjeta.style.display =
      coincideTexto && coincideMateria ? "" : "none";
  });
}

// ==================================================
// CONSULTA DEL DIARIO OFICIAL
// ==================================================

async function consultarDOF() {
  if (consultaEnCurso) return;

  consultaEnCurso = true;

  const boton = elementosDOF.actualizar;

  if (boton) {
    boton.disabled = true;
  }

  elementosDOF.estado.textContent =
    "Conectando con el Diario Oficial de la Federación...";

  elementosDOF.resultados.replaceChildren();

  publicacionesDOF = [];

  try {
    const mapaPublicaciones = new Map();

    for (let dia = 0; dia < DIAS_CONSULTA; dia++) {
      const fecha = obtenerFecha(dia);

      elementosDOF.estado.textContent =
        `Consultando publicaciones del ${fecha}...`;

      const respuesta = await fetch(
        `${DOF_API}/notas/${fecha}`,
        {
          method: "GET",
          headers: {
            "Accept": "application/json"
          },
          cache: "no-store"
        }
      );

      if (!respuesta.ok) {
        throw new Error(
          `El SIDOF respondió con HTTP ${respuesta.status} al consultar ${fecha}.`
        );
      }

      const datos = await respuesta.json();

      if (
        datos.messageCode &&
        Number(datos.messageCode) !== 200
      ) {
        throw new Error(
          datos.response || "El SIDOF rechazó la consulta."
        );
      }

      const notas = obtenerNotasRespuesta(datos);

      for (const nota of notas) {
        const codigo = obtenerCodigo(nota);

        if (!codigo) continue;

        mapaPublicaciones.set(String(codigo), nota);
      }

      await esperar(ESPERA_ENTRE_NOTAS);
    }

    publicacionesDOF = Array.from(
      mapaPublicaciones.values()
    ).map(nota => ({
      nota,
      clasificacion: clasificarPublicacion(
        obtenerTitulo(nota),
        obtenerDependencia(nota)
      )
    }));

    publicacionesDOF.sort((a, b) => {
      const codigoA = Number(obtenerCodigo(a.nota));
      const codigoB = Number(obtenerCodigo(b.nota));

      return codigoB - codigoA;
    });

    mostrarPublicaciones();

    actualizarEstadisticas();

    elementosDOF.estado.textContent =
      `${publicacionesDOF.length} publicaciones encontradas en los últimos ${DIAS_CONSULTA} días. Consulta finalizada.`;

  } catch (error) {
    console.error("Error al consultar el DOF:", error);

    elementosDOF.estado.textContent =
      "No fue posible consultar el Diario Oficial: " +
      error.message;

    elementosDOF.resultados.innerHTML = `
      <article class="card">
        <h3>Error de conexión</h3>
        <p>${escaparHTML(error.message)}</p>
        <p>Comprueba tu conexión y vuelve a intentarlo.</p>
        <a href="https://sidof.segob.gob.mx/datos_abiertos"
           target="_blank"
           rel="noopener noreferrer">
          Consultar servicio oficial SIDOF
        </a>
      </article>
    `;

  } finally {
    consultaEnCurso = false;

    if (boton) {
      boton.disabled = false;
    }
  }
}

// ==================================================
// MOSTRAR PUBLICACIONES
// ==================================================

function mostrarPublicaciones() {
  elementosDOF.resultados.replaceChildren();

  if (!publicacionesDOF.length) {
    elementosDOF.resultados.textContent =
      "No se encontraron publicaciones en el periodo consultado.";

    return;
  }

  const fragmento = document.createDocumentFragment();

  publicacionesDOF.forEach(publicacion => {
    fragmento.appendChild(
      crearTarjeta(publicacion.nota)
    );
  });

  elementosDOF.resultados.appendChild(fragmento);

  filtrarPublicaciones();
}

// ==================================================
// INICIALIZACIÓN
// ==================================================

function iniciarLEGISLATIVOMX() {
  prepararFiltros();

  elementosDOF.busqueda?.addEventListener(
    "input",
    filtrarPublicaciones
  );

  elementosDOF.buscar?.addEventListener(
    "click",
    filtrarPublicaciones
  );

  elementosDOF.categoria?.addEventListener(
    "change",
    filtrarPublicaciones
  );

  elementosDOF.actualizar?.addEventListener(
    "click",
    consultarDOF
  );

  consultarDOF();
}

iniciarLEGISLATIVOMX();

// ==================================================
// MOSTRAR PUBLICACIONES
// ==================================================

function mostrarPublicaciones() {
  elementosDOF.resultados.replaceChildren();

  if (!publicacionesDOF.length) {
    elementosDOF.resultados.textContent =
      "No se encontraron publicaciones en el periodo consultado.";

    return;
  }

  const fragmento = document.createDocumentFragment();

  publicacionesDOF.forEach(publicacion => {
    fragmento.appendChild(
      crearTarjeta(publicacion.nota)
    );
  });

  elementosDOF.resultados.appendChild(fragmento);

  filtrarPublicaciones();
}

// ==================================================
// INICIALIZACIÓN
// ==================================================

function iniciarLEGISLATIVOMX() {
  prepararFiltros();

  elementosDOF.busqueda?.addEventListener(
    "input",
    filtrarPublicaciones
  );

  elementosDOF.buscar?.addEventListener(
    "click",
    filtrarPublicaciones
  );

  elementosDOF.categoria?.addEventListener(
    "change",
    filtrarPublicaciones
  );

  elementosDOF.actualizar?.addEventListener(
    "click",
    consultarDOF
  );

  consultarDOF();
}

iniciarLEGISLATIVOMX();
