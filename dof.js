const DOF_API = "https://sidof.segob.gob.mx/dof/sidof";
const DIAS_CONSULTA = 7;
const ESPERA_ENTRE_NOTAS = 250;

// ==================================================
// UTILIDADES
// ==================================================

function obtenerFecha(diasAtras = 0) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - diasAtras);

  return `${String(fecha.getDate()).padStart(2, "0")}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${fecha.getFullYear()}`;
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

function coincide(texto, frase) {
  return texto.includes(normalizarTexto(frase));
}

function extraerTextoHTML(html) {
  const contenedor = document.createElement("div");
  contenedor.innerHTML = String(html || "");

  contenedor.querySelectorAll("script, style, noscript").forEach(e => e.remove());

  return contenedor.textContent || contenedor.innerText || "";
}

// ==================================================
// REGLAS JURÍDICAS
// 39 MATERIAS
// ==================================================

const REGLAS_JURIDICAS = {

  "Constitucional": {
    fuertes: [
      "constitucion politica de los estados unidos mexicanos",
      "reforma constitucional",
      "controversia constitucional",
      "accion de inconstitucionalidad",
      "derecho constitucional",
      "materia constitucional",
      "control constitucional",
      "supremacia constitucional"
    ],
    debiles: [
      "division de poderes",
      "derechos fundamentales",
      "organos constitucionales autonomos"
    ]
  },

  "Penal": {
    fuertes: [
      "codigo penal federal",
      "ley nacional de ejecucion penal",
      "derecho penal",
      "materia penal",
      "delincuencia organizada",
      "justicia penal"
    ],
    debiles: [
      "feminicidio", "homicidio", "robo", "fraude",
      "extorsion", "delitos", "ministerio publico"
    ]
  },

  "Procesal Penal": {
    fuertes: [
      "codigo nacional de procedimientos penales",
      "proceso penal acusatorio",
      "sistema penal acusatorio",
      "audiencia inicial",
      "juicio oral penal",
      "medidas cautelares penales"
    ],
    debiles: [
      "imputado", "vinculacion a proceso",
      "juez de control", "carpeta de investigacion"
    ]
  },

  "Civil": {
    fuertes: [
      "codigo civil federal",
      "derecho civil",
      "materia civil",
      "responsabilidad civil",
      "obligaciones civiles",
      "contrato civil",
      "sucesion testamentaria"
    ],
    debiles: [
      "arrendamiento", "bienes inmuebles",
      "propiedad privada", "daño moral",
      "contratos civiles"
    ]
  },

  "Familiar": {
    fuertes: [
      "derecho familiar",
      "materia familiar",
      "codigo familiar",
      "pension alimenticia",
      "guarda y custodia",
      "patria potestad",
      "violencia familiar"
    ],
    debiles: [
      "divorcio", "matrimonio", "adopcion",
      "filiacion", "tutela", "alimentos"
    ]
  },

  "Mercantil": {
    fuertes: [
      "codigo de comercio",
      "derecho mercantil",
      "materia mercantil",
      "concurso mercantil",
      "sociedades mercantiles",
      "titulos de credito",
      "contratos mercantiles"
    ],
    debiles: [
      "sociedad anonima", "comerciante",
      "operaciones mercantiles", "pagares"
    ]
  },

  "Laboral": {
    fuertes: [
      "ley federal del trabajo",
      "derecho laboral",
      "materia laboral",
      "contrato colectivo de trabajo",
      "relaciones laborales",
      "justicia laboral",
      "tribunal laboral"
    ],
    debiles: [
      "trabajadores", "sindicato", "salario",
      "jornada laboral", "huelga"
    ]
  },

  "Administrativo": {
    fuertes: [
      "derecho administrativo",
      "materia administrativa",
      "procedimiento administrativo",
      "acto administrativo",
      "responsabilidad administrativa",
      "administracion publica",
      "contratacion publica",
      "licitacion publica",
      "concesion administrativa",
      "revocacion de autorizacion",
      "revocacion de concesion"
    ],
    debiles: [
      "servidores publicos",
      "dependencia gubernamental",
      "concesiones",
      "sanciones administrativas",
      "secretaria de estado",
      "oficio mediante el cual",
      "autorizacion administrativa"
    ]
  },

  "Fiscal": {
    fuertes: [
      "codigo fiscal de la federacion",
      "ley del impuesto sobre la renta",
      "ley del impuesto al valor agregado",
      "derecho fiscal",
      "materia fiscal",
      "creditos fiscales",
      "obligaciones fiscales",
      "resolucion miscelanea fiscal"
    ],
    debiles: [
      "impuestos", "contribuciones", "recaudacion",
      "declaracion fiscal", "autoridad fiscal", "isr", "iva"
    ]
  },

  "Financiero": {
    fuertes: [
      "derecho financiero",
      "sistema financiero mexicano",
      "ley de instituciones de credito",
      "ley de uniones de credito",
      "instituciones financieras",
      "operaciones financieras",
      "regulacion financiera",
      "servicios financieros",
      "entidades financieras",
      "comision nacional bancaria y de valores",
      "autorizacion para operar como entidad financiera",
      "revocacion de autorizacion financiera"
    ],
    debiles: [
      "financiamiento", "capital financiero",
      "mercados financieros", "union de credito",
      "entidad financiera"
    ]
  },

  "Agrario": {
    fuertes: [
      "ley agraria",
      "derecho agrario",
      "materia agraria",
      "tribunales agrarios",
      "registro agrario nacional",
      "propiedad ejidal",
      "propiedad comunal"
    ],
    debiles: [
      "ejido", "ejidatarios", "comuneros",
      "tierras ejidales", "asamblea ejidal"
    ]
  },

  "Ambiental": {
    fuertes: [
      "ley general del equilibrio ecologico",
      "derecho ambiental",
      "materia ambiental",
      "impacto ambiental",
      "proteccion ambiental",
      "ordenamiento ecologico",
      "responsabilidad ambiental",
      "areas naturales protegidas"
    ],
    debiles: [
      "contaminacion", "biodiversidad",
      "ecosistemas", "residuos peligrosos",
      "recursos naturales", "cambio climatico"
    ]
  },

  "Electoral": {
    fuertes: [
      "ley general de instituciones y procedimientos electorales",
      "derecho electoral",
      "materia electoral",
      "tribunal electoral",
      "proceso electoral",
      "justicia electoral",
      "autoridades electorales"
    ],
    debiles: [
      "elecciones", "voto", "sufragio",
      "candidaturas", "partidos politicos"
    ]
  },

  "Internacional Público": {
    fuertes: [
      "derecho internacional publico",
      "responsabilidad internacional del estado",
      "organizacion de las naciones unidas",
      "relaciones diplomaticas",
      "derecho de los tratados",
      "jurisdiccion internacional"
    ],
    debiles: [
      "relaciones internacionales",
      "cooperacion internacional",
      "organismos internacionales"
    ]
  },

  "Internacional Privado": {
    fuertes: [
      "derecho internacional privado",
      "conflicto de leyes",
      "conflicto de jurisdicciones",
      "competencia judicial internacional",
      "reconocimiento de sentencias extranjeras"
    ],
    debiles: [
      "ley aplicable", "domicilio internacional",
      "contratos internacionales", "derecho extranjero"
    ]
  },

  "Derechos Humanos": {
    fuertes: [
      "comision nacional de los derechos humanos",
      "sistema interamericano de derechos humanos",
      "convencion americana sobre derechos humanos",
      "proteccion de derechos humanos",
      "violaciones a derechos humanos"
    ],
    debiles: [
      "derechos humanos", "no discriminacion",
      "dignidad humana", "igualdad sustantiva"
    ]
  },

  "Migratorio": {
    fuertes: [
      "ley de migracion",
      "derecho migratorio",
      "materia migratoria",
      "instituto nacional de migracion",
      "politica migratoria",
      "regularizacion migratoria"
    ],
    debiles: [
      "migrantes", "personas extranjeras",
      "refugiados", "asilo", "deportacion"
    ]
  },

  "Corporativo": {
    fuertes: [
      "derecho corporativo",
      "gobierno corporativo",
      "responsabilidad corporativa",
      "cumplimiento corporativo",
      "reorganizacion societaria",
      "fusiones y adquisiciones"
    ],
    debiles: [
      "corporaciones", "consejo de administracion",
      "accionistas", "estructura empresarial"
    ]
  },

  "Seguridad Social": {
    fuertes: [
      "ley del seguro social",
      "ley del instituto de seguridad y servicios sociales",
      "derecho de la seguridad social",
      "instituto mexicano del seguro social",
      "pensiones de seguridad social"
    ],
    debiles: [
      "seguridad social", "pension", "jubilacion",
      "afiliacion", "cuotas obrero patronales"
    ]
  },

  "Amparo": {
    fuertes: [
      "ley de amparo",
      "juicio de amparo",
      "derecho de amparo",
      "amparo directo",
      "amparo indirecto",
      "suspension del acto reclamado"
    ],
    debiles: [
      "quejoso", "autoridad responsable",
      "acto reclamado", "sentencia de amparo"
    ]
  },

  "Procesal Civil": {
    fuertes: [
      "codigo nacional de procedimientos civiles y familiares",
      "derecho procesal civil",
      "procedimiento civil",
      "juicio ordinario civil",
      "juicio ejecutivo civil"
    ],
    debiles: [
      "demanda civil", "emplazamiento",
      "audiencia civil", "sentencia civil"
    ]
  },

  "Procesal Administrativo": {
    fuertes: [
      "juicio contencioso administrativo",
      "procedimiento contencioso administrativo",
      "derecho procesal administrativo",
      "tribunal federal de justicia administrativa",
      "recurso administrativo"
    ],
    debiles: [
      "nulidad administrativa", "demanda administrativa",
      "impugnacion administrativa"
    ]
  },

  "Económico": {
    fuertes: [
      "derecho economico",
      "orden economico",
      "regulacion economica",
      "politica economica",
      "intervencion del estado en la economia"
    ],
    debiles: [
      "actividad economica", "desarrollo economico",
      "mercado interno", "economia nacional"
    ]
  },

  "Bancario y Bursátil": {
    fuertes: [
      "ley de instituciones de credito",
      "ley del mercado de valores",
      "ley de uniones de credito",
      "derecho bancario",
      "derecho bursatil",
      "materia bancaria",
      "materia bursatil",
      "comision nacional bancaria y de valores",
      "mercado de valores",
      "union de credito",
      "uniones de credito",
      "autorizacion para operar como union de credito",
      "revocacion de autorizacion de una union de credito"
    ],
    debiles: [
      "instituciones de credito",
      "operaciones bancarias",
      "bolsa de valores",
      "intermediarios financieros",
      "entidad financiera"
    ]
  },

  "Propiedad Intelectual": {
    fuertes: [
      "ley federal de proteccion a la propiedad industrial",
      "ley federal del derecho de autor",
      "derecho de propiedad intelectual",
      "instituto mexicano de la propiedad industrial",
      "registro de marcas",
      "patentes"
    ],
    debiles: [
      "derechos de autor", "marcas",
      "propiedad industrial", "modelos de utilidad"
    ]
  },

  "Informático y Digital": {
    fuertes: [
      "delitos informaticos",
      "derecho informatico",
      "derecho digital",
      "proteccion de datos personales",
      "firma electronica avanzada",
      "comercio electronico",
      "servicios digitales"
    ],
    debiles: [
      "ciberseguridad", "datos personales",
      "plataformas digitales", "inteligencia artificial",
      "sistemas informaticos"
    ]
  },

  "Notarial y Registral": {
    fuertes: [
      "derecho notarial",
      "derecho registral",
      "ley del notariado",
      "registro publico de la propiedad",
      "registro publico de comercio",
      "funcion notarial"
    ],
    debiles: [
      "notario publico", "escritura publica",
      "instrumento notarial", "fe publica"
    ]
  },

  "Aduanero": {
    fuertes: [
      "ley aduanera",
      "derecho aduanero",
      "materia aduanera",
      "agencia nacional de aduanas de mexico",
      "despacho aduanero",
      "regimen aduanero"
    ],
    debiles: [
      "aduana", "importacion", "exportacion",
      "aranceles", "pedimento"
    ]
  },

  "Municipal": {
    fuertes: [
      "derecho municipal",
      "gobierno municipal",
      "administracion publica municipal",
      "reglamento municipal",
      "ayuntamiento",
      "hacienda municipal"
    ],
    debiles: [
      "municipio", "cabildo",
      "presidencia municipal", "regidores"
    ]
  },

  "Competencia Económica": {
    fuertes: [
      "ley federal de competencia economica",
      "derecho de la competencia economica",
      "practicas monopolicas",
      "concentraciones economicas",
      "comision federal de competencia economica",
      "barreras a la competencia"
    ],
    debiles: [
      "monopolio", "mercado relevante",
      "poder sustancial de mercado", "libre concurrencia"
    ]
  },

  "Derecho Comparado": {
    fuertes: [
      "derecho comparado",
      "estudio comparado de legislaciones",
      "comparacion de sistemas juridicos",
      "legislacion comparada"
    ],
    debiles: [
      "common law", "civil law",
      "sistema juridico extranjero", "derecho extranjero"
    ]
  },

  "Derecho Médico y Sanitario": {
    fuertes: [
      "ley general de salud",
      "derecho sanitario",
      "derecho medico",
      "materia sanitaria",
      "regulacion sanitaria",
      "responsabilidad medica",
      "comision federal para la proteccion contra riesgos sanitarios"
    ],
    debiles: [
      "servicios de salud", "expediente clinico",
      "consentimiento informado", "personal medico"
    ]
  },

  "Derecho Educativo": {
    fuertes: [
      "ley general de educacion",
      "derecho educativo",
      "materia educativa",
      "sistema educativo nacional",
      "legislacion educativa",
      "autoridad educativa"
    ],
    debiles: [
      "instituciones educativas", "planes de estudio",
      "personal docente", "estudiantes"
    ]
  },

  "Derecho Deportivo": {
    fuertes: [
      "ley general de cultura fisica y deporte",
      "derecho deportivo",
      "materia deportiva",
      "legislacion deportiva",
      "comision nacional de cultura fisica y deporte"
    ],
    debiles: [
      "deporte", "deportistas",
      "federaciones deportivas", "entrenadores"
    ]
  },

  "Derecho Turístico": {
    fuertes: [
      "ley general de turismo",
      "derecho turistico",
      "materia turistica",
      "legislacion turistica",
      "prestadores de servicios turisticos"
    ],
    debiles: [
      "turismo", "actividad turistica",
      "destinos turisticos", "servicios turisticos"
    ]
  },

  "Derecho de la Cultura": {
    fuertes: [
      "ley general de cultura y derechos culturales",
      "derecho cultural",
      "derecho de la cultura",
      "materia cultural",
      "patrimonio cultural",
      "derechos culturales"
    ],
    debiles: [
      "cultura", "museos", "monumentos historicos",
      "bienes culturales", "patrimonio artistico"
    ]
  },

  "Derecho de Consumo": {
    fuertes: [
      "ley federal de proteccion al consumidor",
      "derecho del consumidor",
      "derecho de consumo",
      "proteccion al consumidor",
      "procuraduria federal del consumidor",
      "relaciones de consumo"
    ],
    debiles: [
      "consumidores", "proveedores",
      "publicidad engañosa", "garantias de productos"
    ]
  },

  "Derecho Energético": {
    fuertes: [
      "derecho energetico",
      "ley del sector electrico",
      "ley del sector hidrocarburos",
      "industria electrica",
      "industria de hidrocarburos",
      "regulacion energetica"
    ],
    debiles: [
      "energia electrica", "hidrocarburos",
      "petroleo", "gas natural", "electricidad"
    ]
  },

  "Derecho de Telecomunicaciones": {
    fuertes: [
      "ley en materia de telecomunicaciones",
      "derecho de las telecomunicaciones",
      "regulacion de telecomunicaciones",
      "radiodifusion",
      "espectro radioelectrico",
      "servicios de telecomunicaciones"
    ],
    debiles: [
      "telecomunicaciones", "telefonia",
      "internet", "redes publicas", "radiodifusoras"
    ]
  }
};

// ==================================================
// CLASIFICACIÓN DE MATERIAS
// ==================================================

function clasificarPublicacion(texto, titulo = "") {
  const contenido = normalizarTexto(texto);
  const tituloN = normalizarTexto(titulo);
  const detalles = [];

  for (const [materia, reglas] of Object.entries(REGLAS_JURIDICAS)) {
    let puntuacion = 0;
    let hitsTitulo = 0;
    const motivos = [];

    for (const frase of reglas.fuertes) {
      const clave = normalizarTexto(frase);

      if (tituloN.includes(clave)) {
        puntuacion += 9;
        hitsTitulo++;
        motivos.push(frase + " (título)");
      } else if (contenido.includes(clave)) {
        puntuacion += 4;
        motivos.push(frase);
      }
    }

    for (const frase of reglas.debiles) {
      const clave = normalizarTexto(frase);

      if (tituloN.includes(clave)) {
        puntuacion += 3;
        hitsTitulo++;
        motivos.push(frase + " (título)");
      } else if (contenido.includes(clave)) {
        puntuacion += 1;
        motivos.push(frase);
      }
    }

    if (puntuacion > 0) {
      detalles.push({
        materia,
        puntuacion,
        hitsTitulo,
        motivos
      });
    }
  }

  detalles.sort((a, b) => b.puntuacion - a.puntuacion);

  const principal = detalles.find(d =>
    d.puntuacion >= 4 || d.hitsTitulo > 0
  );

  const candidatas = detalles.filter(d =>
    d !== principal && d.puntuacion >= 4
  );

  const secundarias = principal
    ? candidatas.filter(d =>
        d.puntuacion >= Math.max(4, principal.puntuacion * 0.55)
      )
    : [];

  let confianza = "Baja";

  if (principal) {
    if (
      principal.hitsTitulo >= 1 ||
      principal.puntuacion >= 9
    ) {
      confianza = "Alta";
    } else if (principal.puntuacion >= 4) {
      confianza = "Media";
    }
  }

  return {
    materiaPrincipal: principal ? principal.materia : null,
    materias: principal
      ? [principal.materia, ...secundarias.map(d => d.materia)]
      : [],
    secundarias: secundarias.map(d => d.materia),
    candidatas: candidatas.map(d => d.materia),
    detalles,
    confianza
  };
}

// ==================================================
// TIPO DOCUMENTAL
// ==================================================

function detectarTipoDocumental(titulo, texto) {
  const t = normalizarTexto(titulo);
  const c = normalizarTexto(texto);

  const tipos = [
    ["Tratado internacional", ["tratado internacional"]],
    ["Convención", ["convencion internacional"]],
    ["Protocolo internacional", ["protocolo internacional"]],
    ["Jurisprudencia", ["jurisprudencia"]],
    ["Tesis aislada", ["tesis aislada"]],
    ["Sentencia", ["sentencia"]],
    ["Ejecutoria", ["ejecutoria"]],
    ["Acuerdo judicial", ["acuerdo general del consejo de la judicatura"]],
    ["Constitución", ["constitucion politica de los estados unidos mexicanos"]],
    ["Código", ["codigo penal", "codigo civil", "codigo fiscal", "codigo de comercio", "codigo nacional"]],
    ["Decreto", ["decreto"]],
    ["Reforma o adición", ["reforma", "adicion"]],
    ["Iniciativa de ley", ["iniciativa con proyecto de decreto"]],
    ["Ley", ["ley general", "ley federal", "ley organica", "ley de"]],
    ["Reglamento", ["reglamento"]],
    ["Conven
