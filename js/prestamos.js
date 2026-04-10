async function guardarPrestamoRemoto(prestamo) {
  return await syncToSupabase("prestamos", prestamo);
}

function obtenerPrestamoPorId(id) {
  const prestamos = obtenerPrestamos();
  return prestamos.find(p => p.id === id) || null;
}

function obtenerPrestamosPorCliente(clienteId) {
  return obtenerPrestamos().filter(p => p.cliente_id === clienteId);
}

function obtenerPrestamosActivos() {
  return obtenerPrestamos().filter(p => p.estado === "activo");
}

function obtenerPrestamosAtrasados() {
  const hoy = new Date().toISOString().split("T")[0];
  return obtenerPrestamos().filter(p =>
    p.estado === "activo" &&
    p.fecha_proximo_pago &&
    p.fecha_proximo_pago < hoy
  );
}

async function liquidarPrestamo(id) {
  return await actualizarPrestamoLocal(id, {
    estado: "pagado",
    saldo_pendiente: 0,
    fecha_proximo_pago: null
  });
}
