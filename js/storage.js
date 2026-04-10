function safeGet(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("[STORAGE] Error al guardar:", e);
    return false;
  }
}

function obtenerClientes() {
  return safeGet(APP_CONFIG.storageKeys.clientes) || [];
}

async function guardarClienteLocal(cliente) {
  const clientes = obtenerClientes();
  clientes.push(cliente);
  safeSet(APP_CONFIG.storageKeys.clientes, clientes);
  await syncToSupabase("clientes", cliente);
  return cliente;
}

function obtenerPrestamos() {
  return safeGet(APP_CONFIG.storageKeys.prestamos) || [];
}

async function guardarPrestamoLocal(prestamo) {
  const prestamos = obtenerPrestamos();
  prestamos.push(prestamo);
  safeSet(APP_CONFIG.storageKeys.prestamos, prestamos);
  await syncToSupabase("prestamos", prestamo);
  return prestamo;
}

async function actualizarPrestamoLocal(id, updates) {
  const prestamos = obtenerPrestamos();
  const index = prestamos.findIndex(p => p.id === id);
  if (index !== -1) {
    prestamos[index] = { ...prestamos[index], ...updates };
    safeSet(APP_CONFIG.storageKeys.prestamos, prestamos);
    await syncToSupabase("prestamos", prestamos[index]);
    return prestamos[index];
  }
  return null;
}

function obtenerPagos() {
  return safeGet(APP_CONFIG.storageKeys.pagos) || [];
}

async function guardarPagoLocal(pago) {
  const pagos = obtenerPagos();
  pagos.push(pago);
  safeSet(APP_CONFIG.storageKeys.pagos, pagos);
  await syncToSupabase("pagos", pago);
  return pago;
}

let clientesCargados = false;
let prestamosCargados = false;
let pagosCargados = false;

async function ensureClientesCargados() {
  if (clientesCargados) return;
  await syncClientesDesdeSupabase();
  clientesCargados = true;
}

async function ensurePrestamosCargados() {
  if (prestamosCargados) return;
  await syncPrestamosDesdeSupabase();
  prestamosCargados = true;
}

async function ensurePagosCargados() {
  if (pagosCargados) return;
  await syncPagosDesdeSupabase();
  pagosCargados = true;
}

async function syncClientesDesdeSupabase() {
  const { data, error } = await fetchFromSupabase("clientes");
  if (error || !data?.length) return;

  const local = obtenerClientes();
  const merged = [...local];
  data.forEach(remote => {
    if (!merged.find(c => c.id === remote.id)) {
      merged.push(remote);
    }
  });
  safeSet(APP_CONFIG.storageKeys.clientes, merged);
}

async function syncPrestamosDesdeSupabase() {
  const { data, error } = await fetchFromSupabase("prestamos");
  if (error || !data?.length) return;

  const local = obtenerPrestamos();
  const merged = [...local];
  data.forEach(remote => {
    if (!merged.find(p => p.id === remote.id)) {
      merged.push(remote);
    }
  });
  safeSet(APP_CONFIG.storageKeys.prestamos, merged);
}

async function syncPagosDesdeSupabase() {
  const { data, error } = await fetchFromSupabase("pagos");
  if (error || !data?.length) return;

  const local = obtenerPagos();
  const merged = [...local];
  data.forEach(remote => {
    if (!merged.find(p => p.id === remote.id)) {
      merged.push(remote);
    }
  });
  safeSet(APP_CONFIG.storageKeys.pagos, merged);
}

function mostrarNotificacion(mensaje, tipo = "success") {
  const existente = document.querySelector(".toast-notificacion");
  if (existente) existente.remove();

  const toast = document.createElement("div");
  toast.className = `toast-notificacion toast-${tipo}`;
  toast.innerHTML = `
    <div class="toast-icono">${tipo === "success" ? "✓" : tipo === "error" ? "✗" : "ℹ"}</div>
    <div class="toast-mensaje">${mensaje}</div>
    <button class="toast-cerrar" onclick="this.parentElement.remove()">×</button>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add("mostrar"), 10);
  
  setTimeout(() => {
    toast.classList.remove("mostrar");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
