const DOF_API = "https://sidof.segob.gob.mx/dof/sidof";

function obtenerFechaActual() {
  const fecha = new Date();

  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();

  return `${dia}-${mes}-${anio}`;
}

async function consultarDOF() {
  const fecha = obtenerFechaActual();

  const url = `${DOF_API}/notas/${fecha}`;

  try {
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
      throw new Error("No se pudo consultar el DOF");
    }

    const datos = await respuesta.json();

    console.log("Publicaciones oficiales del DOF:", datos);

    return datos;

  } catch (error) {
    console.error("Error al conectar con el DOF:", error);
    return null;
  }
}
