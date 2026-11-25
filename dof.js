const DOF_API = "https://sidof.segob.gob.mx/dof/sidof";

function obtenerFecha(diasAtras = 0) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - diasAtras);

  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");

  return `${dia}-${mes}-${fecha.getFullYear()}`;
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

  for (let i = 0; i < 7; i++) {
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
      `Consultando DOF: ${i + 1} de 7 días...`;
  }

  if (publicaciones.length === 0) {
    estado.textContent =
      errores === 7
        ? "No fue posible conectar con el Diario Oficial de la Federación. Intenta nuevamente."
        : "No se encontraron publicaciones en los últimos 7 días.";

    return;
  }

  publicaciones.sort((a, b) =>
    b.fechaConsulta.split("-").reverse().join("-")
      .localeCompare(
        a.fechaConsulta.split("-").reverse().join("-")
      )
  );

  const fragmento = document.createDocumentFragment();

  publicaciones.forEach(nota => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "card";

    const titulo = document.createElement("h3");
    titulo.textContent = nota.titulo;

    const organismo = document.createElement("p");
    organismo.textContent =
      nota.codOrgaDos ||
      nota.nombreCodOrgaUno ||
      "Diario Oficial de la Federación";

    const fecha = document.createElement("small");
    fecha.textContent =
      `Fecha: ${nota.fecha || nota.fechaConsulta}`;

    const enlace = document.createElement("a");
    enlace.href =
      `https://www.dof.gob.mx/nota_detalle.php?codigo=${encodeURIComponent(nota.codNota)}`;

    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    enlace.textContent = "Consultar publicación oficial";

    tarjeta.append(titulo, organismo, fecha, enlace);
    fragmento.appendChild(tarjeta);
  });

  resultados.appendChild(fragmento);

  estado.textContent =
    `${publicaciones.length} publicaciones encontradas en los últimos 7 días.`;

  if (errores > 0) {
    estado.textContent +=
      ` Algunas fechas no pudieron consultarse (${errores}).`;
  }
}

consultarDOF();
