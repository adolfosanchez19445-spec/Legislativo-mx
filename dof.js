const DOF_API = "https://sidof.segob.gob.mx/dof/sidof";

function obtenerFechaActual() {
  const fecha = new Date();
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");

  return `${dia}-${mes}-${fecha.getFullYear()}`;
}

async function consultarDOF() {
  const estado = document.getElementById("dof-status");
  const resultados = document.getElementById("dof-results");

  estado.textContent = "Consultando publicaciones oficiales...";
  resultados.replaceChildren();

  try {
    const fecha = obtenerFechaActual();

    const respuesta = await fetch(`${DOF_API}/notas/${fecha}`);

    if (!respuesta.ok) {
      throw new Error("Error al consultar el servicio.");
    }

    const datos = await respuesta.json();

    const publicaciones = [
      ...(datos.NotasMatutinas || []),
      ...(datos.NotasVespertinas || []),
      ...(datos.NotasExtraordinarias || [])
    ];

    const notasConTitulo = publicaciones.filter(nota => nota.titulo);

    if (notasConTitulo.length === 0) {
      estado.textContent =
        "No se encontraron publicaciones con título para esta fecha.";
      return;
    }

    estado.textContent =
      `${notasConTitulo.length} publicaciones encontradas.`;

    notasConTitulo.forEach(nota => {
      const tarjeta = document.createElement("article");
      tarjeta.className = "card";

      const titulo = document.createElement("h3");
      titulo.textContent = nota.titulo;

      const organismo = document.createElement("p");
      organismo.textContent =
        nota.nombreCodOrgaUno || "Diario Oficial de la Federación";

      const enlace = document.createElement("a");
      enlace.href =
        `https://www.dof.gob.mx/nota_detalle.php?codigo=${encodeURIComponent(nota.codNota)}`;
      enlace.target = "_blank";
      enlace.rel = "noopener noreferrer";
      enlace.textContent = "Consultar publicación oficial";

      tarjeta.append(titulo, organismo, enlace);
      resultados.appendChild(tarjeta);
    });

  } catch (error) {
    estado.textContent =
      "No se pudo consultar el DOF. Verificaremos la conexión.";
    console.error("Error DOF:", error);
  }
}

document.addEventListener("DOMContentLoaded", consultarDOF);
   

     
