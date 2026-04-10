async function guardarPagoRemoto(pago) {
  return await syncToSupabase("pagos", pago);
}

function obtenerPagosPorPrestamo(prestamoId) {
  return obtenerPagos().filter(p => p.prestamo_id === prestamoId);
}

function obtenerPagosPorCliente(clienteId) {
  return obtenerPagos().filter(p => p.cliente_id === clienteId);
}

function obtenerPagosDelMes(mes = new Date().getMonth()) {
  return obtenerPagos().filter(p => {
    const fecha = new Date(p.fecha_pago);
    return fecha.getMonth() === mes && p.estado === "confirmado";
  });
}

function calcularTotalPagadoPorPrestamo(prestamoId) {
  return obtenerPagos()
    .filter(p => p.prestamo_id === prestamoId && p.estado === "confirmado")
    .reduce((sum, p) => sum + (p.monto || 0), 0);
}
