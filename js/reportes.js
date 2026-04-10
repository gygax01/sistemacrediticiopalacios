function descargarCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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

async function generarReporteResumenGeneralCsv(clientes, prestamos, pagos) {
  const activos = prestamos.filter(p => p.estado === "activo");
  const pagados = prestamos.filter(p => p.estado === "pagado");
  const hoy = new Date().toISOString().split("T")[0];
  const atrasados = activos.filter(p => p.fecha_proximo_pago && p.fecha_proximo_pago < hoy);

  const pagosConfirmados = pagos.filter(p => p.estado === "confirmado");

  const data = [{
    metric: "Total Prestamos",
    valor: prestamos.length
  }, {
    metric: "Prestamos Activos",
    valor: activos.length
  }, {
    metric: "Prestamos Pagados",
    valor: pagados.length
  }, {
    metric: "Prestamos Atrasados",
    valor: atrasados.length
  }, {
    metric: "Total Clientes",
    valor: clientes.length
  }, {
    metric: "Total Prestado",
    valor: formatearMoneda(prestamos.reduce((s, p) => s + (p.monto_total || 0), 0))
  }, {
    metric: "Total Cobrado",
    valor: formatearMoneda(pagosConfirmados.reduce((s, p) => s + (p.monto || 0), 0))
  }, {
    metric: "Total Pendiente",
    valor: formatearMoneda(activos.reduce((s, p) => s + (p.saldo_pendiente || 0), 0))
  }];

  const csv = generarCSV(data, [
    { key: "metric", label: "Metrica" },
    { key: "valor", label: "Valor" }
  ]);
  const fecha = new Date().toISOString().split("T")[0];
  descargarCSV(csv, `resumen_general_${fecha}.csv`);
}

async function generarReporteEstadoCuentaCsv(clientes, prestamos, pagos) {
  const pagosConfirmados = pagos.filter(p => p.estado === "confirmado");

  const data = clientes.map(c => {
    const prests = prestamos.filter(p => p.cliente_id === c.id);
    const ps = pagosConfirmados.filter(p => p.cliente_id === c.id);
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

  const csv = generarCSV(data, [
    { key: "nombre", label: "Cliente" },
    { key: "matricula", label: "Matricula" },
    { key: "telefono", label: "Telefono" },
    { key: "email", label: "Email" },
    { key: "total_prestado", label: "Total Prestado" },
    { key: "total_pagado", label: "Total Pagado" },
    { key: "saldo_pendiente", label: "Saldo Pendiente" },
    { key: "prestamos_totales", label: "Total Prestamos" },
    { key: "prestamos_activos", label: "Prestamos Activos" }
  ]);
  const fecha = new Date().toISOString().split("T")[0];
  descargarCSV(csv, `estado_cuenta_${fecha}.csv`);
}

async function generarReporteAtrasadosCsv(clientes, prestamos) {
  const hoy = new Date().toISOString().split("T")[0];
  const atrasados = prestamos.filter(p =>
    p.estado !== "pagado" && p.fecha_proximo_pago && p.fecha_proximo_pago < hoy
  );

  const data = atrasados.map(p => {
    const cliente = clientes.find(c => c.id === p.cliente_id);
    const diasAtraso = Math.floor((new Date() - new Date(p.fecha_proximo_pago)) / (1000 * 60 * 60 * 24));
    return {
      nombre: cliente?.nombre || "N/A",
      matricula: cliente?.matricula || "N/A",
      telefono: cliente?.telefono || "N/A",
      monto_total: formatearMoneda(p.monto_total),
      saldo_pendiente: formatearMoneda(p.saldo_pendiente),
      fecha_proximo_pago: p.fecha_proximo_pago,
      dias_atraso: diasAtraso
    };
  });

  const csv = generarCSV(data, [
    { key: "nombre", label: "Cliente" },
    { key: "matricula", label: "Matricula" },
    { key: "telefono", label: "Telefono" },
    { key: "monto_total", label: "Monto Total" },
    { key: "saldo_pendiente", label: "Saldo Pendiente" },
    { key: "fecha_proximo_pago", label: "Fecha Proximo Pago" },
    { key: "dias_atraso", label: "Dias de Atraso" }
  ]);
  const fecha = new Date().toISOString().split("T")[0];
  descargarCSV(csv, `prestamos_atrasados_${fecha}.csv`);
}

async function generarReporteFlujoEfectivoCsv(pagos) {
  const pagosConfirmados = pagos.filter(p => p.estado === "confirmado");
  const meses = {};

  pagosConfirmados.forEach(p => {
    const fecha = new Date(p.fecha_pago);
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    if (!meses[key]) {
      meses[key] = { mes: fecha.toLocaleDateString("es-MX", { month: "long", year: "numeric" }), total: 0, cantidad: 0 };
    }
    meses[key].total += p.monto || 0;
    meses[key].cantidad += 1;
  });

  const data = Object.entries(meses)
    .sort(([a], [b]) => b.localeCompare(a))
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
