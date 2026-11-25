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

  estado.textContent = "Consultando el archivo del DOF de los últimos 365 días...";
  resultados.replaceChildren();

  let publicaciones = [];
  let errores = 0;

  try {
    for (let i = 0; i < 365; i++) {
      const fecha = obtenerFecha(i);

      try {
        const respuesta = await fetch(`${DOF_API}/notas/${fecha}`);

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
      }

      if (i % 10 === 0 || i === 364) {
        estado.textContent =
          `Consultando DOF: ${i + 1} de 365 días...`;
      }

      // Pequeña pausa para no saturar el servicio.
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    if (publicaciones.length === 0) {
      estado.textContent =
        "No se encontraron publicaciones. Errores de consulta: " + errores;
      return;
    }

    // Ordenar de la más reciente a la más antigua.
    publicaciones.sort((a, b) => {
      const fechaA = a.fechaConsulta.split("-").reverse().join("-");
      const fechaB = b.fechaConsulta.split("-").reverse().join("-");
      return fechaB.localeCompare(fechaA);
    });

    estado.textContent =
      `${publicaciones.length} publicaciones encontradas en los últimos 365 días.`;

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
      fecha.textContent = `Fecha: ${nota.fecha || nota.fechaConsulta}`;

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

    if (errores > 0) {
      estado.textContent +=
        ` Algunas fechas no pudieron consultarse (${errores}).`;
    }

  } catch (error) {
    estado.textContent =
      "No se pudo completar la consulta del DOF.";

    console.error("Error DOF:", error);
  }
}

document.addEventListener("DOMContentLoaded", consultarDOF);
