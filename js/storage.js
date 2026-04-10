let supabaseClient = null;

async function initSupabase() {
  console.log("[DEBUG] initSupabase llamado");
  console.log("[DEBUG] URL:", SUPABASE_URL);
  console.log("[DEBUG] KEY:", SUPABASE_ANON_KEY ? "presente" : "vacia");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[SUPABASE] No configurado");
    alert("ERROR: Supabase no configurado");
    return null;
  }

  if (supabaseClient) {
    console.log("[DEBUG] Client ya existente");
    return supabaseClient;
  }

  try {
    console.log("[DEBUG] Creando client Supabase...");

    if (!window.supabase) {
      console.error("[DEBUG] window.supabase NO existe!");
      alert("ERROR: Libreria Supabase no cargó. Recarga la pagina.");
      return null;
    }

    const { createClient } = window.supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("[DEBUG] Client creado:", typeof supabaseClient);
    return supabaseClient;
  } catch (err) {
    console.error("[SUPABASE] Error al inicializar:", err);
    alert("ERROR al inicializar: " + err.message);
    return null;
  }
}

async function obtenerClientes() {
  const client = await initSupabase();
  console.log("[DEBUG] obtenerClientes, client:", client ? "ok" : "null");
  if (!client) return null;
  const { data, error } = await client.from("clientes").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[CLIENTES ERROR]", error);
    mostrarNotificacion("Error al cargar clientes: " + error.message, "error");
    return null;
  }
  console.log("[DEBUG] Clientes obtenidos:", data?.length || 0);
  return data || [];
}

async function guardarCliente(cliente) {
  const client = await initSupabase();
  console.log("[DEBUG] Guardando cliente:", cliente);
  if (!client) {
    console.error("[DEBUG] Client es null");
    mostrarNotificacion("Error de conexion con Supabase", "error");
    return null;
  }
  const { data, error } = await client.from("clientes").insert(cliente).select().single();
  if (error) {
    console.error("[CLIENTES ERROR]", error);
    mostrarNotificacion("Error al guardar cliente: " + error.message, "error");
    return null;
  }
  console.log("[DEBUG] Cliente guardado:", data);
  return data;
}

async function obtenerPrestamos() {
  const client = await initSupabase();
  if (!client) return null;
  const { data, error } = await client.from("prestamos").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[PRESTAMOS]", error);
    mostrarNotificacion("Error al cargar prestamos: " + error.message, "error");
    return null;
  }
  return data || [];
}

async function guardarPrestamo(prestamo) {
  const client = await initSupabase();
  console.log("[DEBUG] Guardando prestamo:", prestamo);
  if (!client) {
    console.error("[DEBUG] Client es null");
    mostrarNotificacion("Error de conexion con Supabase", "error");
    return null;
  }
  const { data, error } = await client.from("prestamos").insert(prestamo).select().single();
  if (error) {
    console.error("[PRESTAMOS ERROR]", error);
    mostrarNotificacion("Error al crear prestamo: " + error.message, "error");
    return null;
  }
  console.log("[DEBUG] Prestamo guardado:", data);
  return data;
}

async function actualizarPrestamo(id, updates) {
  const client = await initSupabase();
  if (!client) return null;
  const { data, error } = await client.from("prestamos").update(updates).eq("id", id).select().single();
  if (error) {
    console.error("[PRESTAMOS]", error);
    mostrarNotificacion("Error al actualizar prestamo: " + error.message, "error");
    return null;
  }
  return data;
}

async function obtenerPagos() {
  const client = await initSupabase();
  if (!client) return null;
  const { data, error } = await client.from("pagos").select("*").order("fecha_pago", { ascending: false });
  if (error) {
    console.error("[PAGOS]", error);
    mostrarNotificacion("Error al cargar pagos: " + error.message, "error");
    return null;
  }
  return data || [];
}

async function guardarPago(pago) {
  const client = await initSupabase();
  console.log("[DEBUG] Guardando pago:", pago);
  if (!client) {
    console.error("[DEBUG] Client es null");
    mostrarNotificacion("Error de conexion con Supabase", "error");
    return null;
  }
  const { data, error } = await client.from("pagos").insert(pago).select().single();
  if (error) {
    console.error("[PAGOS ERROR]", error);
    mostrarNotificacion("Error al registrar pago: " + error.message, "error");
    return null;
  }
  console.log("[DEBUG] Pago guardado:", data);
  return data;
}

async function eliminarTodosLosDatos() {
  const client = await initSupabase();
  if (!client) {
    mostrarNotificacion("Error de conexion con Supabase", "error");
    return false;
  }

  try {
    await client.from("pagos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await client.from("prestamos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await client.from("clientes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    return true;
  } catch (err) {
    console.error("[ELIMINAR DATOS ERROR]", err);
    mostrarNotificacion("Error al eliminar datos: " + err.message, "error");
    return false;
  }
}

function mostrarNotificacion(mensaje, tipo = "success") {
  const existente = document.querySelector(".toast-notificacion");
  if (existente) existente.remove();

  const esMobile = window.innerWidth < 768;

  const toast = document.createElement("div");
  toast.className = `toast-notificacion toast-${tipo}`;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  let iconoHtml = "";
  if (esMobile) {
    if (tipo === "success") iconoHtml = "&#10003;";
    else if (tipo === "error") iconoHtml = "&#10007;";
    else iconoHtml = "&#8505;";
  }

  toast.innerHTML = `
    <div class="toast-icono" aria-hidden="true">${iconoHtml}</div>
    <div class="toast-content">
      ${!esMobile ? `<span class="toast-titulo">${tipo === "success" ? "Exito" : tipo === "error" ? "Error" : "Info"}</span>` : ""}
      <span class="toast-mensaje">${mensaje}</span>
    </div>
    <button class="toast-cerrar" onclick="this.parentElement.remove()" aria-label="Cerrar notificacion">
      ${esMobile ? "&#10005;" : "Cerrar"}
    </button>
  `;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("mostrar");
  });

  setTimeout(() => {
    toast.classList.remove("mostrar");
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

function formatearMoneda(num) {
  return Number(num || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
