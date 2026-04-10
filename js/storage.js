let supabaseClient = null;

async function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[SUPABASE] No configurado");
    return null;
  }

  if (supabaseClient) return supabaseClient;

  try {
    const { createClient } = window.supabase || await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
  } catch (err) {
    console.error("[SUPABASE] Error al inicializar:", err);
    return null;
  }
}

async function obtenerClientes() {
  const client = await initSupabase();
  if (!client) return [];
  const { data, error } = await client.from("clientes").select("*").order("created_at", { ascending: false });
  if (error) { console.error("[CLIENTES]", error); return []; }
  return data || [];
}

async function guardarCliente(cliente) {
  const client = await initSupabase();
  if (!client) return null;
  const { data, error } = await client.from("clientes").insert(cliente).select().single();
  if (error) { console.error("[CLIENTES]", error); return null; }
  return data;
}

async function obtenerPrestamos() {
  const client = await initSupabase();
  if (!client) return [];
  const { data, error } = await client.from("prestamos").select("*").order("created_at", { ascending: false });
  if (error) { console.error("[PRESTAMOS]", error); return []; }
  return data || [];
}

async function guardarPrestamo(prestamo) {
  const client = await initSupabase();
  if (!client) return null;
  const { data, error } = await client.from("prestamos").insert(prestamo).select().single();
  if (error) { console.error("[PRESTAMOS]", error); return null; }
  return data;
}

async function actualizarPrestamo(id, updates) {
  const client = await initSupabase();
  if (!client) return null;
  const { data, error } = await client.from("prestamos").update(updates).eq("id", id).select().single();
  if (error) { console.error("[PRESTAMOS]", error); return null; }
  return data;
}

async function obtenerPagos() {
  const client = await initSupabase();
  if (!client) return [];
  const { data, error } = await client.from("pagos").select("*").order("fecha_pago", { ascending: false });
  if (error) { console.error("[PAGOS]", error); return []; }
  return data || [];
}

async function guardarPago(pago) {
  const client = await initSupabase();
  if (!client) return null;
  const { data, error } = await client.from("pagos").insert(pago).select().single();
  if (error) { console.error("[PAGOS]", error); return null; }
  return data;
}

async function eliminarTodosLosDatos() {
  const client = await initSupabase();
  if (!client) return false;
  
  await client.from("pagos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await client.from("prestamos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await client.from("clientes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  
  return true;
}

function mostrarNotificacion(mensaje, tipo = "success") {
  const existente = document.querySelector(".toast-notificacion");
  if (existente) existente.remove();

  const esMobile = window.innerWidth < 768;
  const icono = tipo === "success" ? "check" : tipo === "error" ? "x" : "info";
  const titulo = tipo === "success" ? "Exito" : tipo === "error" ? "Error" : "Info";

  const toast = document.createElement("div");
  toast.className = `toast-notificacion toast-${tipo}`;
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icono">
        ${esMobile ? (tipo === "success" ? "&#10003;" : tipo === "error" ? "&#10007;" : "&#8505;") : ""}
        ${!esMobile ? `<span class="toast-titulo">${titulo}</span>` : ""}
      </div>
      <div class="toast-mensaje">${mensaje}</div>
    </div>
    <button class="toast-cerrar" onclick="this.parentElement.remove()">
      ${esMobile ? "&#10005;" : "Cerrar"}
    </button>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add("mostrar"), 10);
  
  setTimeout(() => {
    toast.classList.remove("mostrar");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function formatearMoneda(num) {
  return Number(num || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
