"use strict";

// ==================================================
// LEGISLATIVO MX
// CATÁLOGO JURÍDICO GENERAL
// ==================================================

const CATALOGO_JURIDICO = {

  // ==================================================
  // MATERIAS JURÍDICAS
  // ==================================================

  materias: [
    "Constitucional",
    "Penal",
    "Procesal Penal",
    "Civil",
    "Familiar",
    "Mercantil",
    "Laboral",
    "Administrativo",
    "Fiscal",
    "Financiero",
    "Agrario",
    "Ambiental",
    "Electoral",
    "Internacional Público",
    "Internacional Privado",
    "Derechos Humanos",
    "Migratorio",
    "Corporativo",
    "Seguridad Social",
    "Amparo",
    "Procesal Civil",
    "Procesal Administrativo",
    "Económico",
    "Bancario y Bursátil",
    "Propiedad Intelectual",
    "Informático y Digital",
    "Notarial y Registral",
    "Aduanero",
    "Municipal",
    "Competencia Económica",
    "Derecho Comparado",
    "Derecho Médico y Sanitario",
    "Derecho Educativo",
    "Derecho Deportivo",
    "Derecho Turístico",
    "Derecho de la Cultura",
    "Derecho de Consumo",
    "Derecho Energético",
    "Derecho de Telecomunicaciones"
  ],

  // ==================================================
  // GRUPOS DOCUMENTALES
  // ==================================================

  gruposDocumentales: [
    "Legislativo",
    "Normativo",
    "Judicial",
    "Administrativo",
    "Internacional",
    "Doctrinal"
  ],

  // ==================================================
  // TIPOS DOCUMENTALES
  // ==================================================

  tiposDocumentales: {

    legislativo: [
      "Constitución",
      "Ley",
      "Código",
      "Decreto",
      "Reforma",
      "Adición",
      "Derogación",
      "Abrogación",
      "Iniciativa de ley"
    ],

    normativo: [
      "Reglamento",
      "Norma oficial mexicana",
      "Lineamiento",
      "Reglas de operación",
      "Disposición general"
    ],

    judicial: [
      "Jurisprudencia",
      "Tesis aislada",
      "Sentencia",
      "Resolución judicial",
      "Precedente",
      "Acuerdo judicial",
      "Ejecutoria"
    ],

    administrativo: [
      "Acuerdo administrativo",
      "Convenio",
      "Circular",
      "Resolución administrativa",
      "Oficio administrativo",
      "Convocatoria",
      "Aviso",
      "Declaratoria"
    ],

    internacional: [
      "Tratado internacional",
      "Convención",
      "Protocolo",
      "Resolución internacional",
      "Decisión de tribunal internacional"
    ],

    doctrinal: [
      "Libro jurídico",
      "Artículo académico",
      "Ensayo jurídico",
      "Investigación",
      "Comentario doctrinal"
    ],

    academico: [
      "Guía de estudio",
      "Caso práctico",
      "Glosario",
      "Cuestionario",
      "Material didáctico",
      "Ejercicio jurídico"
    ]

  },

  // ==================================================
  // ÁMBITOS JURÍDICOS
  // ==================================================

  ambitos: [
    "Federal",
    "Estatal",
    "Municipal",
    "Internacional",
    "Extranjero",
    "Comparado"
  ],

  // ==================================================
  // SISTEMAS JURÍDICOS
  // ==================================================

  sistemasJuridicos: [
    "Mexicano",
    "Common Law",
    "Civil Law",
    "Derecho Islámico",
    "Derecho Consuetudinario",
    "Sistema Mixto",
    "Sistema Internacional"
  ],

  // ==================================================
  // NIVELES DE CONFIANZA
  // ==================================================

  nivelesConfianza: [
    "Alta",
    "Media",
    "Baja",
    "No determinada"
  ]

};

// ==================================================
// DISPONIBILIDAD GLOBAL
// ==================================================

window.CATALOGO_JURIDICO = CATALOGO_JURIDICO;
