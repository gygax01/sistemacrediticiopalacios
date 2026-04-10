function formatearMoneda(num) {
  return Number(num || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function generarCSV(data, headers) {
  const headerRow = headers.map(h => h.label).join(",");
  const rows = data.map(item =>
    headers.map(h => {
      let value = item[h.key];
      if (value === null || value === undefined) value = "";
      value = String(value).replace(/"/g, '""');
      if (value.includes(",") || value.includes("\n") || value.includes('"')) {
        value = `"${value}"`;
      }
      return value;
    }).join(",")
  );
  return [headerRow, ...rows].join("\n");
}

function descargarCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function generarReportePrestamosCsv() {
  const prestamos = obtenerPrestamos();
  const clientes = obtenerClientes();

  const data = prestamos.map(p => {
    const cliente = clientes.find(c => c.id === p.cliente_id);
    return {
      nombre: cliente?.nombre || "N/A",
      matricula: cliente?.matricula || "N/A",
      monto_total: p.monto_total,
      interes: p.interes_total,
      total_pagar: p.total_pagar,
      saldo_pendiente: p.saldo_pendiente,
      pagos_realizados: p.pagos_realizados,
      total_pagos: p.total_pagos,
      fecha_inicio: p.fecha_inicio,
      fecha_proximo_pago: p.fecha_proximo_pago || "N/A",
      estado: p.estado
    };
  });

  const headers = [
    { key: "nombre", label: "Cliente" },
    { key: "matricula", label: "Matrícula" },
    { key: "monto_total", label: "Monto Total" },
    { key: "interes", label: "Interés" },
    { key: "total_pagar", label: "Total a Pagar" },
    { key: "saldo_pendiente", label: "Saldo Pendiente" },
    { key: "pagos_realizados", label: "Pagos Realizados" },
    { key: "total_pagos", label: "Total Pagos" },
    { key: "fecha_inicio", label: "Fecha Inicio" },
    { key: "fecha_proximo_pago", label: "Próximo Pago" },
    { key: "estado", label: "Estado" }
  ];

  const csv = generarCSV(data, headers);
  const fecha = new Date().toISOString().split("T")[0];
  descargarCSV(csv, `prestamos_${fecha}.csv`);
}

async function generarReportePagosCsv() {
  const pagos = obtenerPagos().filter(p => p.estado === "confirmado");
  const clientes = obtenerClientes();
  const prestamos = obtenerPrestamos();

  const data = pagos.map(p => {
    const cliente = clientes.find(c => c.id === p.cliente_id);
    const prestamo = prestamos.find(pr => pr.id === p.prestamo_id);
    return {
      fecha_pago: p.fecha_pago,
      nombre: cliente?.nombre || "N/A",
      matricula: cliente?.matricula || "N/A",
      monto: p.monto,
      nota: p.nota || "",
      total_prestamo: prestamo?.monto_total || "N/A",
      saldo_restante: prestamo?.saldo_pendiente || "N/A"
    };
  });

  const headers = [
    { key: "fecha_pago", label: "Fecha" },
    { key: "nombre", label: "Cliente" },
    { key: "matricula", label: "Matrícula" },
    { key: "monto", label: "Monto Pagado" },
    { key: "nota", label: "Nota" },
    { key: "total_prestamo", label: "Total Préstamo" },
    { key: "saldo_restante", label: "Saldo Restante" }
  ];

  const csv = generarCSV(data, headers);
  const fecha = new Date().toISOString().split("T")[0];
  descargarCSV(csv, `pagos_${fecha}.csv`);
}

async function generarReporteResumenGeneralCsv() {
  const prestamos = obtenerPrestamos();
  const clientes = obtenerClientes();
  const pagos = obtenerPagos().filter(p => p.estado === "confirmado");

  const activos = prestamos.filter(p => p.estado === "activo");
  const pagados = prestamos.filter(p => p.estado === "pagado");
  const hoy = new Date().toISOString().split("T")[0];
  const atrasados = activos.filter(p => p.fecha_proximo_pago && p.fecha_proximo_pago < hoy);

  const data = [{
    metric: "Total Préstamos",
    valor: prestamos.length
  }, {
    metric: "Préstamos Activos",
    valor: activos.length
  }, {
    metric: "Préstamos Pagados",
    valor: pagados.length
  }, {
    metric: "Préstamos Atrasados",
    valor: atrasados.length
  }, {
    metric: "Total Clientes",
    valor: clientes.length
  }, {
    metric: "Total Prestado",
    valor: formatearMoneda(prestamos.reduce((s, p) => s + (p.monto_total || 0), 0))
  }, {
    metric: "Total Interés",
    valor: formatearMoneda(prestamos.reduce((s, p) => s + (p.interes_total || 0), 0))
  }, {
    metric: "Total Cobrado",
    valor: formatearMoneda(pagos.reduce((s, p) => s + (p.monto || 0), 0))
  }, {
    metric: "Total Pendiente",
    valor: formatearMoneda(activos.reduce((s, p) => s + (p.saldo_pendiente || 0), 0))
  }];

  const csv = generarCSV(data, [
    { key: "metric", label: "Métrica" },
    { key: "valor", label: "Valor" }
  ]);
  const fecha = new Date().toISOString().split("T")[0];
  descargarCSV(csv, `resumen_general_${fecha}.csv`);
}

async function generarReporteEstadoCuentaCsv() {
  const clientes = obtenerClientes();
  const prestamos = obtenerPrestamos();
  const pagos = obtenerPagos().filter(p => p.estado === "confirmado");

  const data = clientes.map(c => {
    const prests = prestamos.filter(p => p.cliente_id === c.id);
    const ps = pagos.filter(p => p.cliente_id === c.id);
    return {
      nombre: c.nombre,
      matricula: c.matricula || "N/A",
      telefono: c.telefono || "N/A",
      email: c.email || "N/A",
      total_prestado: formatearMoneda(prests.reduce((s, p) => s + (p.monto_total || 0), 0)),
      total_pagado: formatearMoneda(ps.reduce((s, p) => s + (p.monto || 0), 0)),
      saldo_pendiente: formatearMoneda(prests.filter(p => p.estado !== "pagado").reduce((s, p) => s + (p.saldo_pendiente || 0), 0)),
      prestamos_totales: prests.length,
      prestamos_activos: prests.filter(p => p.estado === "activo").length
    };
  });

  const headers = [
    { key: "nombre", label: "Cliente" },
    { key: "matricula", label: "Matrícula" },
    { key: "telefono", label: "Teléfono" },
    { key: "email", label: "Email" },
    { key: "total_prestado", label: "Total Prestado" },
    { key: "total_pagado", label: "Total Pagado" },
    { key: "saldo_pendiente", label: "Saldo Pendiente" },
    { key: "prestamos_totales", label: "Total Préstamos" },
    { key: "prestamos_activos", label: "Préstamos Activos" }
  ];

  const csv = generarCSV(data, headers);
  const fecha = new Date().toISOString().split("T")[0];
  descargarCSV(csv, `estado_cuenta_${fecha}.csv`);
}

async function generarReporteAtrasadosCsv() {
  const hoy = new Date().toISOString().split("T")[0];
  const atrasados = obtenerPrestamos().filter(p =>
    p.estado !== "pagado" && p.fecha_proximo_pago && p.fecha_proximo_pago < hoy
  );
  const clientes = obtenerClientes();

  const data = atrasados.map(p => {
    const cliente = clientes.find(c => c.id === p.cliente_id);
    const diasAtraso = Math.floor((new Date() - new Date(p.fecha_proximo_pago)) / (1000 * 60 * 60 * 24));
    return {
      nombre: cliente?.nombre || "N/A",
      matricula: cliente?.matricula || "N/A",
      telefono: cliente?.telefono || "N/A",
      monto_total: p.monto_total,
      saldo_pendiente: p.saldo_pendiente,
      fecha_proximo_pago: p.fecha_proximo_pago,
      dias_atraso: diasAtraso
    };
  });

  const csv = generarCSV(data, [
    { key: "nombre", label: "Cliente" },
    { key: "matricula", label: "Matrícula" },
    { key: "telefono", label: "Teléfono" },
    { key: "monto_total", label: "Monto Total" },
    { key: "saldo_pendiente", label: "Saldo Pendiente" },
    { key: "fecha_proximo_pago", label: "Fecha Próximo Pago" },
    { key: "dias_atraso", label: "Días de Atraso" }
  ]);
  const fecha = new Date().toISOString().split("T")[0];
  descargarCSV(csv, `prestamos_atrasados_${fecha}.csv`);
}

async function generarReporteFlujoEfectivoCsv() {
  const pagos = obtenerPagos().filter(p => p.estado === "confirmado");
  const meses = {};

  pagos.forEach(p => {
    const fecha = new Date(p.fecha_pago);
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    const nombreMes = fecha.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    if (!meses[key]) {
      meses[key] = { mes: nombreMes, total: 0, cantidad: 0 };
    }
    meses[key].total += p.monto || 0;
    meses[key].cantidad += 1;
  });

  const data = Object.entries(meses)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      mes: v.mes,
      total: formatearMoneda(v.total),
      cantidad_pagos: v.cantidad
    }));

  const csv = generarCSV(data, [
    { key: "mes", label: "Mes" },
    { key: "total", label: "Total Cobrado" },
    { key: "cantidad_pagos", label: "Cantidad de Pagos" }
  ]);
  const fecha = new Date().toISOString().split("T")[0];
  descargarCSV(csv, `flujo_efectivo_${fecha}.csv`);
}
