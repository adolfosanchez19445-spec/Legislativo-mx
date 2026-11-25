const DOF_API = "https://sidof.segob.gob.mx/dof/sidof";

function obtenerFechaActual() {
  const fecha = new Date();

  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();

  return `${dia}-${mes}-${anio}`;
}

async function consultarDOF() {
  const estado = document.getElementById("dof-status");
  const resultados = document.getElementById("dof-results");

  estado.textContent = "Consultando el Diario Oficial de la Federación...";

  try {
    const fecha = obtenerFechaActual();
    const respuesta = await fetch(`${DOF_API}/notas/${fecha}`);

    if (!respuesta.ok) {
      throw new Error("No fue posible consultar el DOF.");
    }

    const datos = await respuesta.json();

    const publicaciones = datos?.Notas || datos?.notas || [];

    if (!publicaciones.length) {
      estado.textContent = "No se encontraron publicaciones para esta fecha.";
      return;
    }

    estado.textContent = `${publicaciones.length} publicaciones encontradas.`;

    resultados.innerHTML = "";

    publicaciones.forEach(publicacion => {
      const tarjeta = document.createElement("article");
      tarjeta.className = "card";

      const titulo = document.createElement("h3");
      titulo.textContent = publicacion.titulo || "Publicación oficial";

      const descripcion = document.createElement("p");
      descripcion.textContent = publicacion.descripcion || "Consulta el documento oficial.";

      tarjeta.appendChild(titulo);
      tarjeta.appendChild(descripcion);

      resultados.appendChild(tarjeta);
    });

  } catch (error) {
    estado.textContent = "No se pudo conectar con el DOF. Intenta nuevamente.";
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", consultarDOF);
