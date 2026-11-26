const DOF_API = "https://sidof.segob.gob.mx/dof/sidof";

const DIAS_CONSULTA = 7;
const ESPERA_ENTRE_NOTAS = 250;

// --------------------------------------------------
// FECHAS Y UTILIDADES
// --------------------------------------------------

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

function contieneFrase(texto, frase) {
  return texto.includes(normalizarTexto(frase));
}

// --------------------------------------------------
// CATÁLOGO DE REGLAS PARA LAS 39 MATERIAS
// --------------------------------------------------

const REGLAS_JURIDICAS = {

  "Constitucional": {
    fuertes: [
      "constitucion politica de los estados unidos mexicanos",
      "reforma constitucional",
      "controversia constitucional",
      "accion de inconstitucionalidad",
      "derecho constitucional",
      "materia constitucional",
      "poder legislativo federal",
      "organos constitucionales autonomos"
    ],
    debiles: [
      "derechos fundamentales",
      "division de poderes",
      "supremacia constitucional",
      "control constitucional",
      "constitucion politica"
    ]
  },

  "Penal": {
    fuertes: [
      "codigo penal federal",
      "codigo nacional de procedimientos penales",
      "ley nacional de ejecucion penal",
      "derecho penal",
      "materia penal",
      "proceso penal",
      "carpeta de investigacion",
      "delincuencia organizada",
      "justicia penal"
    ],
    debiles: [
      "feminicidio",
      "homicidio",
      "robo",
      "fraude",
      "extorsion",
      "delito",
      "delitos",
      "ministerio publico"
    ]
  },

  "Procesal Penal": {
    fuertes: [
      "codigo nacional de procedimientos penales",
      "procedimiento penal",
      "proceso penal acusatorio",
      "sistema penal acusatorio",
      "audiencia inicial",
      "etapa de investigacion",
      "etapa intermedia",
      "juicio oral penal",
      "medidas cautelares penales"
    ],
    debiles: [
      "imputado",
      "vinculacion a proceso",
      "prueba pericial",
      "juez de control",
      "carpeta de investigacion"
    ]
  },

  "Civil": {
    fuertes: [
      "codigo civil federal",
      "derecho civil",
      "materia civil",
      "responsabilidad civil",
      "obligaciones civiles",
      "derechos reales",
      "contrato civil",
      "sucesion testamentaria",
      "sucesion intestamentaria"
    ],
    debiles: [
      "arrendamiento",
      "bienes inmuebles",
      "propiedad privada",
      "daño moral",
      "patrimonio",
      "contratos civiles"
    ]
  },

  "Familiar": {
    fuertes: [
      "derecho familiar",
      "materia familiar",
      "codigo familiar",
      "derecho de familia",
      "pension alimenticia",
      "guarda y custodia",
      "patria potestad",
      "violencia familiar",
      "interes superior de la niñez"
    ],
    debiles: [
      "divorcio",
      "matrimonio",
      "adopcion",
      "filiacion",
      "tutela",
      "alimentos",
      "convivencia familiar"
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
      "contratos mercantiles",
      "operaciones mercantiles",
      "juicio ejecutivo mercantil"
    ],
    debiles: [
      "sociedad anonima",
      "actividad empresarial",
      "comerciante",
      "comercio",
      "pagares",
      "letras de cambio"
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
      "tribunal laboral",
      "riesgos de trabajo",
      "reparto de utilidades"
    ],
    debiles: [
      "trabajador",
      "trabajadores",
      "sindicato",
      "salario",
      "jornada laboral",
      "prestaciones laborales",
      "huelga"
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
      "justicia administrativa"
    ],
    debiles: [
      "servidores publicos",
      "dependencia gubernamental",
      "concesiones",
      "sanciones administrativas",
      "organos administrativos",
      "secretaria de estado"
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
      "administracion tributaria",
      "resolucion miscelanea fiscal"
    ],
    debiles: [
      "impuestos",
      "contribuciones",
      "recaudacion",
      "declaracion fiscal",
      "autoridad fiscal",
      "servicio de administracion tributaria",
      "isr",
      "iva"
    ]
  },

  "Financiero": {
    fuertes: [
      "derecho financiero",
      "sistema financiero mexicano",
      "ley de instituciones de credito",
      "instituciones financieras",
      "operaciones financieras",
      "regulacion financiera",
      "servicios financieros"
    ],
    debiles: [
      "financiamiento",
      "entidades financieras",
      "capital financiero",
      "mercados financieros"
    ]
  },

  "Agrario": {
    fuertes: [
      "ley agraria",
      "derecho agrario",
      "materia agraria",
      "tribunales agrarios",
      "registro agrario nacional",
      "nucleo agrario",
      "propiedad ejidal",
      "propiedad comunal"
    ],
    debiles: [
      "ejido",
      "ejidatarios",
      "comuneros",
      "tierras ejidales",
      "asamblea ejidal",
      "procuraduria agraria"
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
      "contaminacion",
      "biodiversidad",
      "ecosistemas",
      "residuos peligrosos",
      "recursos naturales",
      "cambio climatico"
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
      "autoridades electorales",
      "delitos electorales"
    ],
    debiles: [
      "elecciones",
      "voto",
      "sufragio",
      "candidaturas",
      "partidos politicos",
      "instituto nacional electoral"
    ]
  },

  "Internacional Público": {
    fuertes: [
      "derecho internacional publico",
      "materia internacional publica",
      "responsabilidad internacional del estado",
      "organizacion de las naciones unidas",
      "relaciones diplomaticas",
      "derecho de los tratados",
      "jurisdiccion internacional"
    ],
    debiles: [
      "relaciones internacionales",
      "cooperacion internacional",
      "soberania estatal",
      "organismos internacionales"
    ]
  },

  "Internacional Privado": {
    fuertes: [
      "derecho internacional privado",
      "materia internacional privada",
      "conflicto de leyes",
      "conflicto de jurisdicciones",
      "competencia judicial internacional",
      "reconocimiento de sentencias extranjeras",
      "exequatur"
    ],
    debiles: [
      "ley aplicable",
      "domicilio internacional",
      "contratos internacionales",
      "derecho extranjero"
    ]
  },

  "Derechos Humanos": {
    fuertes: [
      "comision nacional de los derechos humanos",
      "sistema interamericano de derechos humanos",
      "convencion americana sobre derechos humanos",
      "derecho internacional de los derechos humanos",
      "proteccion de derechos humanos",
      "violaciones a derechos humanos"
    ],
    debiles: [
      "derechos humanos",
      "no discriminacion",
      "dignidad humana",
      "igualdad sustantiva",
      "libertades fundamentales"
    ]
  },

  "Migratorio": {
    fuertes: [
      "ley de migracion",
      "derecho migratorio",
      "materia migratoria",
      "instituto nacional de migracion",
      "politica migratoria",
      "situacion migratoria",
      "regularizacion migratoria"
    ],
    debiles: [
      "migrantes",
      "personas extranjeras",
      "refugiados",
      "asilo",
      "estancia migratoria",
      "deportacion"
    ]
  },

  "Corporativo": {
    fuertes: [
      "derecho corporativo",
      "gobierno corporativo",
      "responsabilidad corporativa",
      "cumplimiento corporativo",
      "compliance empresarial",
      "reorganizacion societaria",
      "fusiones y adquisiciones"
    ],
    debiles: [
      "corporaciones",
      "consejo de administracion",
      "accionistas",
      "estructura empresarial",
      "control corporativo"
    ]
  },

  "Seguridad Social": {
    fuertes: [
      "ley del seguro social",
      "ley del instituto de seguridad y servicios sociales",
      "derecho de la seguridad social",
      "materia de seguridad social",
      "instituto mexicano del seguro social",
      "instituto de seguridad y servicios sociales",
      "pensiones de seguridad social"
    ],
    debiles: [
      "seguridad social",
      "pension",
      "jubilacion",
      "afiliacion",
      "cuotas obrero patronales",
      "guarderias"
    ]
  },

  "Amparo": {
    fuertes: [
      "ley de amparo",
      "juicio de amparo",
      "derecho de amparo",
      "materia de amparo",
      "amparo directo",
      "amparo indirecto",
      "suspension del acto reclamado",
      "recurso de revision en amparo"
    ],
    debiles: [
      "quejoso",
      "autoridad responsable",
      "acto reclamado",
      "sentencia de amparo",
      "interes juridico"
    ]
  },

  "Procesal Civil": {
    fuertes: [
      "codigo nacional de procedimientos civiles y familiares",
      "derecho procesal civil",
      "materia procesal civil",
      "procedimiento civil",
      "juicio ordinario civil",
      "juicio ejecutivo civil",
      "medios de impugnacion civiles"
    ],
    debiles: [
      "demanda civil",
      "emplazamiento",
      "prueba testimonial",
      "audiencia civil",
      "sentencia civil"
    ]
  },

  "Procesal Administrativo": {
    fuertes: [
      "juicio contencioso administrativo",
      "procedimiento contencioso administrativo",
      "derecho procesal administrativo",
      "materia procesal administrativa",
      "tribunal federal de justicia administrativa",
      "recurso administrativo"
    ],
    debiles: [
      "nulidad administrativa",
      "demanda administrativa",
      "impugnacion administrativa",
      "procedimiento de nulidad"
    ]
  },

  "Económico": {
    fuertes: [
      "derecho economico",
      "materia economica",
      "orden economico",
      "regulacion economica",
      "politica economica",
      "intervencion del estado en la economia"
    ],
    debiles: [
      "actividad economica",
      "desarrollo economico",
      "mercado interno",
      "planeacion economica",
      "economia nacional"
    ]
  },

  "Bancario y Bursátil": {
    fuertes: [
      "ley de instituciones de credito",
      "ley del mercado de valores",
      "derecho bancario",
      "derecho bursatil",
      "materia bancaria",
      "materia bursatil",
      "comision nacional bancaria y de valores",
      "mercado de valores"
    ],
    debiles: [
      "bancos",
      "instituciones de credito",
      "valores",
      "bolsa de valores",
      "intermediarios financieros",
      "operaciones bancarias"
    ]
  },

  "Propiedad Intelectual": {
    fuertes: [
      "ley federal de proteccion a la propiedad industrial",
      "ley federal del derecho de autor",
      "derecho de propiedad intelectual",
      "materia de propiedad intelectual",
      "instituto mexicano de la propiedad industrial",
      "registro de marcas",
      "patentes"
    ],
    debiles: [
      "derechos de autor",
      "marcas",
      "propiedad industrial",
      "modelos de utilidad",
      "denominaciones de origen",
      "secretos industriales"
    ]
  },

  "Informático y Digital": {
    fuertes: [
      "delitos informaticos",
      "derecho informatico",
      "derecho digital",
      "materia informatica",
      "proteccion de datos personales",
      "firma electronica avanzada",
      "comercio electronico",
      "servicios digitales"
    ],
    debiles: [
      "ciberseguridad",
      "datos personales",
      "plataformas digitales",
      "inteligencia artificial",
      "sistemas informaticos",
      "tecnologias de la informacion"
    ]
  },

  "Notarial y Registral": {
    fuertes: [
      "derecho notarial",
      "derecho registral",
      "materia notarial",
      "materia registral",
      "ley del notariado",
      "registro publico de la propiedad",
      "registro publico de comercio",
      "funcion notarial"
    ],
    debiles: [
      "notario publico",
      "escritura publica",
      "instrumento notarial",
      "fe publica",
      "inscripcion registral",
      "corredor publico"
    ]
  },

  "Aduanero": {
    fuertes: [
      "ley aduanera",
      "derecho aduanero",
      "materia aduanera",
      "codigo fiscal aduanero",
      "agencia nacional de aduanas de mexico",
      "despacho aduanero",
      "regimen aduanero"
    ],
    debiles: [
      "aduana",
      "importacion",
      "exportacion",
      "aranceles",
      "pedimento",
      "mercancias"
    ]
  },

  "Municipal": {
    fuertes: [
      "derecho municipal",
      "materia municipal",
      "gobierno municipal",
      "administracion publica municipal",
      "reglamento municipal",
      "ayuntamiento",
      "hacienda municipal"
    ],
    debiles: [
      "municipio",
      "municipal",
      "cabildo",
      "presidencia municipal",
      "servicios publicos municipales",
      "regidores"
    ]
  },

  "Competencia Económica": {
    fuertes: [
      "ley federal de competencia economica",
      "derecho de la competencia economica",
      "materia de competencia economica",
      "practicas monopolicas",
      "concentraciones economicas",
      "comision federal de competencia economica",
      "barreras a la competencia"
    ],
    debiles: [
      "monopolio",
      "competencia economica",
      "mercado relevante",
      "poder sustancial de mercado",
      "libre concurrencia"
    ]
  },

  "Derecho Comparado": {
    fuertes: [
      "derecho comparado",
      "estudio comparado de legislaciones",
      "comparacion de sistemas juridicos",
      "sistemas juridicos comparados",
      "legislacion comparada"
    ],
    debiles: [
      "common law",
      "civil law",
      "sistema juridico extranjero",
      "derecho extranjero"
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
      "servicios de salud",
      "expediente clinico",
      "consentimiento informado",
      "personal medico",
      "establecimientos de salud",
      "insumos para la salud"
    ]
  },

  "Derecho Educativo": {
    fuertes: [
      "ley general de educacion",
      "derecho educativo",
      "materia educativa",
      "sistema educativo nacional",
      "legislacion educativa",
      "autoridad educativa",
      "educacion superior"
    ],
    debiles: [
      "instituciones educativas",
      "planes de estudio",
      "personal docente",
      "estudiantes",
      "servicios educativos",
      "educacion publica"
    ]
  },

  "Derecho Deportivo": {
    fuertes: [
      "ley general de cultura fisica y deporte",
      "derecho deportivo",
      "materia deportiva",
      "legislacion deportiva",
      "comision nacional de cultura fisica y deporte",
      "justicia deportiva"
    ],
    debiles: [
      "deporte",
      "deportistas",
      "federaciones deportivas",
      "entrenadores",
      "competencias deportivas"
    ]
  },

  "Derecho Turístico": {
    fuertes: [
      "ley general de turismo",
      "derecho turistico",
      "materia turistica",
      "legislacion turistica",
      "prestadores de servicios turisticos",
      "politica nacional turistica"
    ],
    debiles: [
      "turismo",
      "actividad turistica",
      "destinos turisticos",
      "servicios turisticos",
      "promocion turistica"
    ]
  },

  "Derecho de la Cultura": {
    fuertes: [
      "ley general de cultura y derechos culturales",
      "derecho cultural",
      "derecho de la cultura",
      "materia cultural",
      "patrimonio cultural",
      "derechos culturales",
      "instituciones culturales"
    ],
    debiles: [
      "cultura",
      "museos",
      "monumentos historicos",
      "bienes culturales",
      "actividades culturales",
      "patrimonio artistico"
    ]
  },

  "Derecho de Consumo": {
    fuertes: [
      "ley federal de proteccion al consumidor",
      "derecho del consumidor",
      "derecho de consumo",
      "materia de consumo",
      "proteccion al consumidor",
      "procuraduria federal del consumidor",
      "relaciones de consumo"
    ],
    debiles: [
      "consumidores",
      "proveedores",
      "publicidad engañosa",
      "garantias de productos",
      "quejas de consumidores",
      "bienes y servicios"
    ]
  },

  "Derecho Energético": {
    fuertes: [
      "derecho energetico",
      "materia energetica",
      "ley del sector electrico",
      "ley del sector hidrocarburos",
      "industria electrica",
      "industria de hidrocarburos",
      "regulacion energetica"
    ],
    debiles: [
      "energia electrica",
      "hidrocarburos",
      "petroleo",
      "gas natural",
      "electricidad",
      "sector energetico"
    ]
  },

  "Derecho de Telecomunicaciones": {
    fuertes: [
      "ley en materia de telecomunicaciones",
      "derecho de las telecomunicaciones",
      "materia de telecomunicaciones",
      "regulacion de telecomunicaciones",
      "radiodifusion",
      "espectro radioelectrico",
      "servicios de telecomunicaciones"
    ],
    debiles: [
      "telecomunicaciones",
      "telefonia",
      "internet",
      "concesion de frecuencias",
      "redes publicas",
      "radiodifusoras"
    ]
  }

};

// --------------------------------------------------
// CLASIFICADOR JURÍDICO
// --------------------------------------------------

function clasificarPublicacion(texto, titulo = "") {
  const contenido = normalizarTexto(texto);
  const tituloNormalizado = normalizarTexto(titulo);

  const detalles = [];

  for (const [materia, reglas] of Object.entries(REGLAS_JURIDICAS)) {

    let puntuacion = 0;
    const motivos = [];
    let coincidenciasTitulo = 0;

    reglas.fuertes.forEach(frase => {
      const clave = normalizarTexto(frase);

      if (tituloNormalizado.includes(clave)) {
        puntuacion += 7;
        coincidenciasTitulo++;
        motivos.push(frase + " (título)");
      } else if (contenido.includes(clave)) {
        puntuacion += 4;
        motivos
