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

// Clasificación jurídica por materias.
function clasificarPublicacion(texto) {
  const contenido = normalizarTexto(texto);

  const reglas = {
    Penal: {
      fuertes: [
        "codigo penal",
        "derecho penal",
        "materia penal",
        "codigo nacional de procedimientos penales",
        "proceso penal",
        "carpeta de investigacion",
        "delincuencia organizada",
        "delitos contra",
        "ley nacional de ejecucion penal",
        "justicia penal",
        "feminicidio",
        "homicidio"
      ],
      debiles: [
        "delito", "delitos", "robo", "fraude",
        "extorsion", "ministerio publico"
      ]
    },

    Laboral: {
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
        "trabajador", "trabajadores", "sindicato",
        "salario", "jornada laboral", "prestaciones"
      ]
    },

    Fiscal: {
      fuertes: [
        "codigo fiscal de la federacion",
        "ley del impuesto sobre la renta",
        "ley del impuesto al valor agregado",
        "derecho fiscal",
        "materia fiscal",
        "creditos fiscales",
        "obligaciones fiscales",
        "administracion tributaria"
      ],
      debiles: [
        "impuestos", "contribuciones", "recaudacion",
        "declaracion fiscal", "autoridad fiscal"
      ]
    },

    Familiar: {
      fuertes: [
        "derecho familiar",
        "materia familiar",
        "codigo familiar",
        "derecho de familia",
        "pension alimenticia",
        "guarda y custodia",
        "patria potestad",
        "violencia familiar",
        "filiacion"
      ],
      debiles: [
        "divorcio", "matrimonio", "adopcion",
        "tutela", "alimentos"
      ]
    },

    Constitucional: {
      fuertes: [
        "derecho constitucional",
        "materia constitucional",
        "constitucion politica de los estados unidos mexicanos",
        "reforma constitucional",
        "controversia constitucional",
        "accion de inconstitucionalidad",
        "juicio de amparo",
        "derechos fundamentales"
      ],
      debiles: [
        "derechos humanos", "poder legislativo",
        "poder ejecutivo", "poder judicial",
        "garantias constitucionales"
      ]
    },

    Administrativo: {
      fuertes: [
        "derecho administrativo",
        "materia administrativa",
        "procedimiento administrativo",
        "acto administrativo",
        "responsabilidad administrativa",
        "administracion publica",
        "contratacion publica",
        "licitacion publica"
      ],
      debiles: [
        "servidores publicos", "dependencia",
        "concesiones", "sanciones administrativas",
        "organos administrativos"
      ]
    },

    Civil: {
      fuertes: [
        "derecho civil",
        "materia civil",
        "codigo civil",
        "responsabilidad civil",
        "contrato civil",
        "sucesion testamentaria",
        "sucesion intestamentaria",
        "derechos reales"
      ],
      debiles: [
        "arrendamiento", "bienes inmuebles",
        "obligaciones civiles", "patrimonio"
      ]
    },

    Mercantil: {
      fuertes: [
        "derecho mercantil",
        "materia mercantil",
        "codigo de comercio",
        "concurso mercantil",
        "sociedades mercantiles",
        "titulos de credito",
        "contratos mercantiles",
        "operaciones mercantiles"
      ],
      debiles: [
        "sociedad anonima", "comercio exterior",
        "actividad empresarial", "instituciones de credito"
      ]
    }
  };

  const detalles = [];

  for (const [materia, grupos] of Object.entries(reglas)) {
    const coincidenciasFuertes = grupos.fuertes.filter(palabra =>
      contenido.includes(normalizarTexto(palabra))
    );

    const coincidenciasDebiles = grupos.debiles.filter(palabra =>
      contenido.includes(normalizarTexto(palabra))
    );

    const puntuacion =
      coincidenciasFuertes.reduce((total, palabra) =>
        total + (
          normalizarTexto(palabra).split(" ").length >= 2 ? 4 : 3
        ), 0
      ) +
      coincidenciasDebiles.length;

    if (puntuacion === 0) continue;

    let confianza = "baja";

    if (puntuacion >= 7) {
      confianza = "alta";
    } else if (puntuacion >= 4) {
      confianza = "media";
    }

    detalles.push({
      materia,
      puntuacion,
      confianza,
      motivos: [
        ...coincidenciasFuertes,
        ...coincidenciasDebiles
      ]
    });
  }

  const materias = detalles
    .filter(detalle => detalle.puntuacion >= 4)
    .map(detalle => detalle.materia);

  const candidatas = detalles
    .filter(detalle => detalle.puntuacion < 4);

  return {
    materias,
    candidatas,
    detalles
  };
}

// Identificación del tipo de documento jurídico.
function detectarTipoDocumental(nota, texto) {
  const titulo = normalizarTexto(nota.titulo || "");
  const contenido = normalizarTexto(texto || "");

  const tipos = [
    {
      tipo: "Tratado internacional",
      grupo: "Internacional",
      claves: [
        "tratado internacional",
        "tratado de",
        "convenio internacional"
      ]
    },
    {
      tipo: "Convención",
      grupo: "Internacional",
      claves: [
        "convencion internacional",
        "convencion sobre"
      ]
    },
    {
      tipo: "Jurisprudencia",
      grupo: "Judicial",
      claves: [
        "jurisprudencia",
        "jurisprudencia por reiteracion"
      ]
    },
    {
      tipo: "Tesis aislada",
      grupo: "Judicial",
      claves: ["tesis aislada"]
    },
    {
      tipo: "Sentencia",
      grupo: "Judicial",
      claves: [
        "sentencia",
        "resolucion judicial"
      ]
    },
    {
      tipo: "Ejecutoria",
      grupo: "Judicial",
      claves: ["ejecutoria"]
    },
    {
      tipo: "Acuerdo judicial",
      grupo: "Judicial",
      claves: [
        "acuerdo general del consejo de la judicatura",
        "acuerdo del tribunal"
      ]
    },
    {
      tipo: "Constitución",
      grupo: "Legislativo",
      claves: ["constitucion politica"]
    },
    {
      tipo: "Código",
      grupo: "Legislativo",
      claves: [
        "codigo penal",
        "codigo civil",
        "codigo de comercio",
        "codigo nacional",
        "codigo fiscal"
      ]
    },
    {
      tipo: "Decreto",
      grupo: "Legislativo",
      claves: [
        "decreto por el que",
        "decreto que reforma",
        "decreto por el cual"
      ]
    },
    {
      tipo: "Reforma o adición legislativa",
      grupo: "Legislativo",
      claves: [
        "reforma",
        "adicion",
        "derogacion",
        "abrogacion"
      ]
    },
    {
      tipo: "Ley",
      grupo: "Legislativo",
      claves: [
        "ley federal",
        "ley general",
        "ley organica",
        "ley nacional",
        "ley de"
      ]
    },
    {
      tipo: "Reglamento",
      grupo: "Legislativo",
      claves: [
        "reglamento de",
        "reglamento interior"
      ]
    },
    {
      tipo: "Convenio",
      grupo: "Administrativo",
      claves: [
        "convenio",
        "convenio marco"
      ]
    },
    {
      tipo: "Acuerdo administrativo",
      grupo: "Administrativo",
      claves: [
        "acuerdo por el que",
        "acuerdo mediante el cual",
        "acuerdo que establece"
      ]
    },
    {
      tipo: "Circular",
      grupo: "Administrativo",
      claves: ["circular"]
    },
    {
      tipo: "Lineamiento",
      grupo: "Administrativo",
      claves: [
        "lineamientos",
        "lineamiento"
      ]
    },
    {
      tipo: "Norma oficial",
      grupo: "Administrativo",
      claves: [
        "norma oficial mexicana",
        "nom-"
      ]
    },
    {
      tipo: "Regla de operación",
      grupo: "Administrativo",
      claves: ["reglas de operacion"]
    },
    {
      tipo: "Iniciativa de ley",
      grupo: "Legislativo",
      claves: [
        "iniciativa de ley",
        "iniciativa con proyecto de decreto"
      ]
    }
  ];

  // Primero se analiza el título.
  for (const item of tipos) {
    if (item.claves.some(clave => titulo.includes(clave))) {
      return {
        ...item,
        confianza: "Alta",
        motivo: "Identificado en el título"
      };
    }
  }

  // Después se analiza el contenido.
  for (const item of tipos) {
    if (item.claves.some(clave => contenido.includes(clave))) {
      return {
        ...item,
        confianza: "Media",
        motivo: "Identificado en el contenido"
      };
    }
  }

  return {
    tipo: "No determinado",
    grupo: "Pendiente de clasificación",
    confianza: "Baja",
    motivo: "No se encontraron elementos suficientes"
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

  const textoCompleto = [
    nota.titulo,
    nota.nombreCodOrgaUno,
    nota.codOrgaDos
  ].join(" ");

  const tipoDocumento = detectarTipoDocumental(
    nota,
    textoCompleto
  );

  tarjeta.dataset.tipoDocumento = tipoDocumento.tipo;
  tarjeta.dataset.grupoDocumental = tipoDocumento.grupo;

  const titulo = document.createElement("h3");
  titulo.textContent = nota.titulo;

  const organismo = document.createElement("p");
  organismo.textContent =
    nota.codOrgaDos ||
    nota.nombreCodOrgaUno ||
    "Diario Oficial de la Federación";

  const tipo = document.createElement("p");
  tipo.textContent =
    `Tipo de documento: ${tipoDocumento.tipo}. ` +
    `Grupo: ${tipoDocumento.grupo}. ` +
    `Confianza: ${tipoDocumento.confianza}.`;

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
    tipo,
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

  // Consultar publicaciones de los últimos siete días.
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
