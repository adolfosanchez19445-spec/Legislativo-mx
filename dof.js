"use strict";

// ==================================================
// LEGISLATIVO MX
// MOTOR DE CONSULTA Y CLASIFICACIÓN DEL DOF
// ==================================================

const DOF_API = "https://sidof.segob.gob.mx/dof/sidof";
const DIAS_CONSULTA = 7;
const ESPERA_ENTRE_NOTAS = 200;

let publicacionesDOF = [];
let consultaEnCurso = false;

// ==================================================
// ELEMENTOS DE LA INTERFAZ
// ==================================================

const elementosDOF = {
  resultados: document.getElementById("dof-results"),
  estado: document.getElementById("dof-status"),
  diagnostico: document.getElementById("juria-diagnostico"),
  busqueda: document.getElementById("search"),
  categoria: document.getElementById("category"),
  botonBuscar: document.getElementById("search-button"),
  botonActualizar: document.getElementById("refresh-button"),
  total: document.getElementById("stat-total"),
  identificadas: document.getElementById("stat-identificadas"),
  otras: document.getElementById("stat-otras"),
  pendientes: document.getElementById("stat-pendientes"),
  materias: document.getElementById("materias-list")
};

// ==================================================
// UTILIDADES GENERALES
// ==================================================

function obtenerFecha(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizarTexto(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escaparHTML(texto = "") {
  return String(texto).replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[caracter]);
}

function obtenerDependencia(nota = {}) {
  return (
    nota.organismo ||
    nota.dependencia ||
    nota.nombreOrganismo ||
    nota.nombre_dependencia ||
    nota.institucion ||
    "Dependencia no identificada"
  );
}

function obtenerTitulo(nota = {}) {
  return (
    nota.titulo ||
    nota.nombre ||
    nota.descripcion ||
    nota.rubro ||
    nota.texto ||
    "Publicación sin título"
  );
}

function obtenerCodigo(nota = {}) {
  return String(
    nota.codNota ||
    nota.codigo ||
    nota.id ||
    nota.cod_nota ||
    ""
  );
}

function obtenerFechaNota(nota = {}) {
  return (
    nota.fechaPublicacion ||
    nota.fecha ||
    nota.fecha_publicacion ||
    nota.fechaNota ||
    ""
  );
}

function obtenerNotasRespuesta(datos) {
  if (Array.isArray(datos)) return datos;

  if (!datos || typeof datos !== "object") return [];

  const posibles = [
    datos.NotasMatutinas,
    datos.notasMatutinas,
    datos.notas,
    datos.resultados,
    datos.data,
    datos.datos,
    datos.response
  ];

  for (const elemento of posibles) {
    if (Array.isArray(elemento)) return elemento;

    if (elemento && typeof elemento === "object") {
      const anidadas = obtenerNotasRespuesta(elemento);
      if (anidadas.length) return anidadas;
    }
  }

  return [];
}

// ==================================================
// REGLAS DE CLASIFICACIÓN JURÍDICA
// ==================================================

const REGLAS_JURIDICAS = {

  "Constitucional": [
    "constitucion politica",
    "constitucional",
    "derechos fundamentales",
    "poder ejecutivo",
    "poder legislativo",
    "poder judicial",
    "federalismo",
    "soberania"
  ],

  "Penal": [
    "codigo penal",
    "delito",
    "delitos",
    "penal",
    "fiscalia",
    "ministerio publico",
    "carpeta de investigacion",
    "sancion penal",
    "reclusion"
  ],

  "Procesal Penal": [
    "codigo nacional de procedimientos penales",
    "procedimiento penal",
    "proceso penal",
    "justicia penal",
    "audiencia penal",
    "sistema penal acusatorio"
  ],

  "Civil": [
    "codigo civil",
    "responsabilidad civil",
    "contrato civil",
    "obligaciones civiles",
    "bienes inmuebles",
    "derechos reales"
  ],

  "Familiar": [
    "derecho familiar",
    "familia",
    "matrimonio",
    "divorcio",
    "pension alimenticia",
    "alimentos",
    "adopcion",
    "filiacion",
    "patria potestad",
    "guarda y custodia"
  ],

  "Mercantil": [
    "codigo de comercio",
    "sociedad mercantil",
    "comercio",
    "comerciante",
    "titulos de credito",
    "concurso mercantil",
    "operaciones mercantiles"
  ],

  "Laboral": [
    "ley federal del trabajo",
    "trabajo",
    "trabajadores",
    "trabajador",
    "patron",
    "relaciones laborales",
    "salario minimo",
    "sindicato",
    "huelga",
    "contrato colectivo"
  ],

  "Administrativo": [
    "administracion publica",
    "procedimiento administrativo",
    "servidores publicos",
    "dependencias",
    "organismos publicos",
    "responsabilidades administrativas",
    "servicio publico"
  ],

  "Fiscal": [
    "codigo fiscal de la federacion",
    "impuesto",
    "impuestos",
    "contribuciones",
    "sat",
    "recaudacion",
    "obligaciones fiscales",
    "declaracion fiscal"
  ],

  "Financiero": [
    "sistema financiero",
    "instituciones financieras",
    "hacienda y credito publico",
    "financiamiento",
    "politica financiera"
  ],

  "Agrario": [
    "ley agraria",
    "ejido",
    "ejidatarios",
    "comunidad agraria",
    "propiedad ejidal",
    "registro agrario nacional"
  ],

  "Ambiental": [
    "medio ambiente",
    "impacto ambiental",
    "equilibrio ecologico",
    "recursos naturales",
    "proteccion ambiental",
    "biodiversidad",
    "contaminacion"
  ],

  "Electoral": [
    "materia electoral",
    "proceso electoral",
    "instituto nacional electoral",
    "tribunal electoral",
    "partidos politicos",
    "derechos politico electorales"
  ],

  "Internacional Público": [
    "derecho internacional publico",
    "tratado internacional",
    "relaciones exteriores",
    "convencion internacional",
    "organizacion de las naciones unidas",
    "cooperacion internacional"
  ],

  "Internacional Privado": [
    "derecho internacional privado",
    "conflicto de leyes",
    "jurisdiccion internacional",
    "reconocimiento de sentencias extranjeras"
  ],

  "Derechos Humanos": [
    "derechos humanos",
    "comision nacional de los derechos humanos",
    "no discriminacion",
    "igualdad sustantiva",
    "perspectiva de genero",
    "grupos vulnerables"
  ],

  "Migratorio": [
    "migracion",
    "migrantes",
    "instituto nacional de migracion",
    "condicion de estancia",
    "refugiados",
    "asilo"
  ],

  "Corporativo": [
    "gobierno corporativo",
    "sociedades",
    "fusion de sociedades",
    "escision",
    "administracion societaria"
  ],

  "Seguridad Social": [
    "seguridad social",
    "instituto mexicano del seguro social",
    "imss",
    "instituto de seguridad y servicios sociales",
    "issste",
    "pensiones",
    "jubilaciones"
  ],

  "Amparo": [
    "juicio de amparo",
    "ley de amparo",
    "amparo directo",
    "amparo indirecto",
    "suspension del acto reclamado"
  ],

  "Procesal Civil": [
    "procedimiento civil",
    "proceso civil",
    "juicio ordinario civil",
    "juicio ejecutivo civil",
    "codigo nacional de procedimientos civiles"
  ],

  "Procesal Administrativo": [
    "juicio contencioso administrativo",
    "tribunal federal de justicia administrativa",
    "proceso administrativo",
    "nulidad administrativa"
  ],

  "Económico": [
    "politica economica",
    "desarrollo economico",
    "actividad economica",
    "regulacion economica"
  ],

  "Bancario y Bursátil": [
    "instituciones de credito",
    "banca",
    "bancario",
    "bolsa de valores",
    "mercado de valores",
    "comision nacional bancaria"
  ],

  "Propiedad Intelectual": [
    "propiedad intelectual",
    "derechos de autor",
    "instituto mexicano de la propiedad industrial",
    "patentes",
    "marcas registradas"
  ],

  "Informático y Digital": [
    "proteccion de datos personales",
    "datos personales",
    "firma electronica",
    "medios electronicos",
    "plataforma digital",
    "inteligencia artificial",
    "ciberseguridad",
    "tecnologias de la informacion"
  ],

  "Notarial y Registral": [
    "notario publico",
    "notariado",
    "registro publico de la propiedad",
    "registro civil",
    "funcion notarial"
  ],

  "Aduanero": [
    "ley aduanera",
    "aduanas",
    "agente aduanal",
    "comercio exterior",
    "despacho aduanero"
  ],

  "Municipal": [
    "municipio",
    "ayuntamiento",
    "gobierno municipal",
    "cabildo",
    "reglamento municipal"
  ],

  "Competencia Económica": [
    "competencia economica",
    "practicas monopolicas",
    "monopolio",
    "concentraciones economicas",
    "comision nacional antimonopolio"
  ],

  "Derecho Comparado": [
    "derecho comparado",
    "legislacion comparada",
    "sistema juridico extranjero"
  ],

  "Derecho Médico y Sanitario": [
    "secretaria de salud",
    "salud publica",
    "insumos para la salud",
    "regulacion sanitaria",
    "expediente clinico",
    "servicios de salud"
  ],

  "Derecho Educativo": [
    "ley general de educacion",
    "educacion publica",
    "instituciones educativas",
    "sistema educativo nacional",
    "autoridad educativa"
  ],

  "Derecho Deportivo": [
    "deporte",
    "cultura fisica",
    "actividad deportiva",
    "comision nacional de cultura fisica"
  ],

  "Derecho Turístico": [
    "turismo",
    "actividad turistica",
    "prestadores de servicios turisticos",
    "secretaria de turismo"
  ],

  "Derecho de la Cultura": [
    "patrimonio cultural",
    "cultura",
    "bienes culturales",
    "instituto nacional de antropologia"
  ],

  "Derecho de Consumo": [
    "proteccion al consumidor",
    "consumidores",
    "profeco",
    "relaciones de consumo",
    "publicidad engañosa"
  ],

  "Derecho Energético": [
    "sector energetico",
    "energia electrica",
    "hidrocarburos",
    "petroleos mexicanos",
    "pemex",
    "comision federal de electricidad",
    "cfe"
  ],

  "Derecho de Telecomunicaciones": [
    "telecomunicaciones",
    "radiodifusion",
    "espectro radioelectrico",
    "servicios de telecomunicaciones",
    "telefonia"
  ]

};

// ==================================================
// CLASIFICACIÓN POR MATERIA
// ==================================================

function clasificarPublicacion(titulo, dependencia = "") {
  const texto = normalizarTexto(`${titulo} ${dependencia}`);
  const resultados = [];

  for (const [materia, palabras] of Object.entries(REGLAS_JURIDICAS)) {
    let puntos = 0;

    for (const palabra of palabras) {
      if (texto.includes(normalizarTexto(palabra))) {
        puntos += palabra.includes(" ") ? 3 : 2;
      }
    }

    if (puntos > 0) {
      resultados.push({ materia, puntos });
    }
  }

  resultados.sort((a, b) => b.puntos - a.puntos);

  if (!resultados.length) {
    return {
      principal: "No identificada",
      secundarias: [],
      confianza: "No determinada",
      puntos: 0
    };
  }

  const principal = resultados[0];
  const diferencia = resultados[1]
    ? principal.puntos - resultados[1].puntos
    : principal.puntos;

  let confianza = "Baja";

  if (principal.puntos >= 6 && diferencia >= 3) {
    confianza = "Alta";
  } else if (principal.puntos >= 3) {
    confianza = "Media";
  }

  return {
    principal: principal.materia,
    secundarias: resultados
      .slice(1, 4)
      .map(resultado => resultado.materia),
    confianza,
    puntos: principal.puntos
  };
}

// ==================================================
// IDENTIFICACIÓN DEL TIPO DOCUMENTAL
// ==================================================

function detectarTipoDocumental(titulo = "") {
  const texto = normalizarTexto(titulo);

  const reglas = [
    { tipo: "Constitución", palabras: ["constitucion politica"] },
    { tipo: "Decreto", palabras: ["decreto"] },
    { tipo: "Ley", palabras: ["ley general", "ley federal", "ley organica", "ley"] },
    { tipo: "Código", palabras: ["codigo"] },
    { tipo: "Reglamento", palabras: ["reglamento"] },
    { tipo: "Acuerdo administrativo", palabras: ["acuerdo"] },
    { tipo: "Convenio", palabras: ["convenio"] },
    { tipo: "Lineamiento", palabras: ["lineamientos", "lineamiento"] },
    { tipo: "Norma oficial mexicana", palabras: ["norma oficial mexicana", "nom "] },
    { tipo: "Reglas de operación", palabras: ["reglas de operacion"] },
    { tipo: "Circular", palabras: ["circular"] },
    { tipo: "Convocatoria", palabras: ["convocatoria"] },
    { tipo: "Aviso", palabras: ["aviso"] },
    { tipo: "Declaratoria", palabras: ["declaratoria"] },
    { tipo: "Resolución administrativa", palabras: ["resolucion"] }
  ];

  for (const regla of reglas) {
    if (regla.palabras.some(palabra => texto.includes(palabra))) {
      return {
        tipo: regla.tipo,
        confianza: "Media"
      };
    }
  }

  return {
    tipo: "Publicación oficial",
    confianza: "No determinada"
  };
}

// ==================================================
// IDENTIFICACIÓN DEL GRUPO DOCUMENTAL
// ==================================================

function detectarGrupo(tipo) {
  const catalogo = window.CATALOGO_JURIDICO;

  if (!catalogo || !catalogo.tiposDocumentales) {
    return "Sin clasificar";
  }

  for (const [grupo, tipos] of Object.entries(catalogo.tiposDocumentales)) {
    if (tipos.includes(tipo)) {
      return grupo.charAt(0).toUpperCase() + grupo.slice(1);
    }
  }

  return "Sin clasificar";
}

// ==================================================
// CONSULTA DEL DETALLE DE CADA PUBLICACIÓN
// ==================================================

async function consultarDetalle(codigo) {
  if (!codigo) return null;

  try {
    const respuesta = await fetch(
      `${DOF_API}/notas/nota/${encodeURIComponent(codigo)}`
    );

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    return datos;
  } catch (error) {
    console.warn("No se pudo consultar el detalle:", codigo, error);
    return null;
  }
}

// ==================================================
// EXTRAER CONTENIDO DE LA PUBLICACIÓN
// ==================================================

function obtenerContenidoDetalle(datos) {
  if (!datos) return "";

  const posibles = [
    datos.contenido,
    datos.texto,
    datos.nota,
    datos.descripcion,
    datos.html,
    datos.data?.contenido,
    datos.data?.texto,
    datos.datos?.contenido,
    datos.datos?.texto
  ];

  const contenido = posibles.find(
    valor => typeof valor === "string" && valor.trim()
  );

  return contenido || "";
}

// ==================================================
// CREAR TARJETA DE PUBLICACIÓN
// ==================================================

function crearTarjeta(nota, contenido = "") {
  const titulo = obtenerTitulo(nota);
  const dependencia = obtenerDependencia(nota);
  const codigo = obtenerCodigo(nota);
  const fecha = obtenerFechaNota(nota);

  const clasificacion = clasificarPublicacion(
    titulo,
    `${dependencia} ${contenido}`
  );

  const tipo = detectarTipoDocumental(titulo);
  const grupo = detectarGrupo(tipo.tipo);

  const tarjeta = document.createElement("article");
  tarjeta.className = "news-card";

  const fechaVisible = fecha
    ? escaparHTML(fecha)
    : "Fecha no disponible";

  const codigoVisible = codigo
    ? escaparHTML(codigo)
    : "No disponible";

  const materiasSecundarias = clasificacion.secundarias.length
    ? clasificacion.secundarias.join(", ")
    : "Ninguna identificada";

  const enlace = codigo
    ? `https://www.dof.gob.mx/nota_detalle.php?codigo=${encodeURIComponent(codigo)}`
    : "https://www.dof.gob.mx/";

  tarjeta.innerHTML = `
    <div class="news-card-content">

      <div class="news-card-meta">
        <span>${escaparHTML(grupo)}</span>
        <span>${fechaVisible}</span>
      </div>

      <h3>${escaparHTML(titulo)}</h3>

      <p>
        <strong>Dependencia:</strong>
        ${escaparHTML(dependencia)}
      </p>

      <p>
        <strong>Materia principal:</strong>
        ${escaparHTML(clasificacion.principal)}
      </p>

      <p>
        <strong>Materias relacionadas:</strong>
        ${escaparHTML(materiasSecundarias)}
      </p>

      <p>
        <strong>Tipo documental:</strong>
        ${escaparHTML(tipo.tipo)}
      </p>

      <p>
        <strong>Confianza de clasificación:</strong>
        ${escaparHTML(clasificacion.confianza)}
      </p>

      <p>
        <strong>Código DOF:</strong>
        ${codigoVisible}
      </p>

      <div class="news-card-footer">
        <a
          href="${escaparHTML(enlace)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Consultar publicación oficial
        </a>
      </div>

    </div>
  `;

  return {
    elemento: tarjeta,
    nota,
    titulo,
    dependencia,
    codigo,
    fecha,
    clasificacion,
    tipo: tipo.tipo,
    grupo
  };
}

// ==================================================
// ACTUALIZAR ESTADÍSTICAS
// ==================================================

function actualizarEstadisticas() {
  const total = publicacionesDOF.length;

  const identificadas = publicacionesDOF.filter(
    publicacion =>
      publicacion.clasificacion.principal !== "No identificada"
  ).length;

  const otras = total - identificadas;

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
    elementosDOF.pendientes.textContent = otras;
  }
}

// ==================================================
// PREPARAR FILTROS Y MATERIAS
// ==================================================

function prepararFiltros() {
  const catalogo = window.CATALOGO_JURIDICO;

  if (!catalogo) {
    console.error("No se encontró el catálogo jurídico.");
    return;
  }

  if (elementosDOF.categoria) {
    elementosDOF.categoria.innerHTML =
      '<option value="">Todas las materias</option>';

    catalogo.materias.forEach(materia => {
      const opcion = document.createElement("option");
      opcion.value = materia;
      opcion.textContent = materia;

      elementosDOF.categoria.appendChild(opcion);
    });
  }

  if (elementosDOF.materias) {
    elementosDOF.materias.innerHTML = "";

    catalogo.materias.forEach(materia => {
      const elemento = document.createElement("span");

      elemento.className = "materia-item";
      elemento.textContent = materia;

      elementosDOF.materias.appendChild(elemento);
    });
  }

  if (elementosDOF.diagnostico) {
    elementosDOF.diagnostico.textContent =
      "Catálogo jurídico disponible. La identificación de materias se realiza mediante reglas de clasificación textual. El análisis con inteligencia artificial se incorporará cuando JURIA esté conectada.";
  }
}

// ==================================================
// FILTRAR PUBLICACIONES
// ==================================================

function filtrarPublicaciones() {
  const busqueda = normalizarTexto(
    elementosDOF.busqueda?.value || ""
  );

  const categoria = elementosDOF.categoria?.value || "";

  const filtradas = publicacionesDOF.filter(publicacion => {
    const texto = normalizarTexto(
      `${publicacion.titulo} ${publicacion.dependencia} ${publicacion.codigo} ${publicacion.tipo} ${publicacion.clasificacion.principal} ${publicacion.clasificacion.secundarias.join(" ")}`
    );

    const coincideBusqueda =
      !busqueda || texto.includes(busqueda);

    const coincideCategoria =
      !categoria ||
      publicacion.clasificacion.principal === categoria ||
      publicacion.clasificacion.secundarias.includes(categoria);

    return coincideBusqueda && coincideCategoria;
  });

  mostrarPublicaciones(filtradas);
}

// ==================================================
// MOSTRAR PUBLICACIONES
// ==================================================

function mostrarPublicaciones(lista = publicacionesDOF) {
  if (!elementosDOF.resultados) return;

  elementosDOF.resultados.innerHTML = "";

  if (!lista.length) {
    elementosDOF.resultados.innerHTML = `
      <div class="empty-state">
        <p>No se encontraron publicaciones con esos criterios.</p>
      </div>
    `;
    return;
  }

  lista.forEach(publicacion => {
    elementosDOF.resultados.appendChild(
      publicacion.elemento
    );
  });
}

// ==================================================
// CONSULTAR EL DIARIO OFICIAL
// ==================================================

async function consultarDOF() {
  if (consultaEnCurso) return;

  consultaEnCurso = true;

  if (elementosDOF.estado) {
    elementosDOF.estado.textContent =
      "Consultando el Diario Oficial de la Federación...";
  }

  if (elementosDOF.botonActualizar) {
    elementosDOF.botonActualizar.disabled = true;
  }

  const publicaciones = [];
  const codigosRegistrados = new Set();

  let diasConsultados = 0;
  let errores = 0;

  try {
    for (let i = 0; i < DIAS_CONSULTA; i++) {
      const fecha = new Date();

      fecha.setDate(fecha.getDate() - i);

      const fechaConsulta = obtenerFecha(fecha);

      try {
        const respuesta = await fetch(
          `${DOF_API}/notas/${fechaConsulta}`,
          {
            method: "GET",
            headers: {
              "Accept": "application/json"
            }
          }
        );

        if (!respuesta.ok) {
          throw new Error(`Error HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        const notas = obtenerNotasRespuesta(datos);

        diasConsultados++;

        for (const nota of notas) {
          const codigo = obtenerCodigo(nota);

          const identificador = codigo ||
            `${obtenerTitulo(nota)}-${obtenerFechaNota(nota)}`;

          if (codigosRegistrados.has(identificador)) {
            continue;
          }

          codigosRegistrados.add(identificador);

          publicaciones.push({
            nota,
            titulo: obtenerTitulo(nota),
            dependencia: obtenerDependencia(nota),
            codigo,
            fecha: obtenerFechaNota(nota)
          });
        }

      } catch (error) {
        errores++;

        console.warn(
          `Error al consultar el DOF del ${fechaConsulta}:`,
          error
        );
      }

      await esperar(ESPERA_ENTRE_NOTAS);
    }

    // Consultar el detalle de las publicaciones.
    const procesadas = [];

    for (const publicacion of publicaciones) {
      let contenido = "";

      if (publicacion.codigo) {
        const detalle = await consultarDetalle(publicacion.codigo);

        contenido = obtenerContenidoDetalle(detalle);
      }

      procesadas.push(
        crearTarjeta(publicacion.nota, contenido)
      );

      await esperar(ESPERA_ENTRE_NOTAS);
    }

    publicacionesDOF = procesadas;

    publicacionesDOF.sort((a, b) => {
      const fechaA = new Date(a.fecha || 0).getTime();
      const fechaB = new Date(b.fecha || 0).getTime();

      return fechaB - fechaA;
    });

    actualizarEstadisticas();
    filtrarPublicaciones();

    if (elementosDOF.estado) {
      elementosDOF.estado.textContent =
        `Consulta terminada. Se encontraron ${publicacionesDOF.length} publicaciones en ${diasConsultados} días consultados.`;

      if (errores > 0) {
        elementosDOF.estado.textContent +=
          ` Hubo ${errores} días que no pudieron consultarse.`;
      }
    }

  } catch (error) {
    console.error("Error general al consultar el DOF:", error);

    if (elementosDOF.estado) {
      elementosDOF.estado.textContent =
        "No fue posible completar la consulta del Diario Oficial. Intenta actualizar nuevamente.";
    }

  } finally {
    consultaEnCurso = false;

    if (elementosDOF.botonActualizar) {
      elementosDOF.botonActualizar.disabled = false;
    }
  }
}

// ==================================================
// INICIAR LEGISLATIVO MX
// ==================================================

function iniciarLEGISLATIVOMX() {
  prepararFiltros();

  if (elementosDOF.botonBuscar) {
    elementosDOF.botonBuscar.addEventListener(
      "click",
      filtrarPublicaciones
    );
  }

  if (elementosDOF.botonActualizar) {
    elementosDOF.botonActualizar.addEventListener(
      "click",
      consultarDOF
    );
  }

  if (elementosDOF.busqueda) {
    elementosDOF.busqueda.addEventListener(
      "input",
      filtrarPublicaciones
    );
  }

  if (elementosDOF.categoria) {
    elementosDOF.categoria.addEventListener(
      "change",
      filtrarPublicaciones
    );
  }

  consultarDOF();
}

// ==================================================
// ARRANQUE AUTOMÁTICO
// ==================================================

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    iniciarLEGISLATIVOMX
  );
} else {
  iniciarLEGISLATIVOMX();
}
