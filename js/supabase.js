let supabaseClient = null;

async function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
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

function getSupabaseClient() {
  return supabaseClient;
}

async function syncToSupabase(table, data) {
  const client = await initSupabase();
  if (!client) return { error: "Supabase no configurado" };

  const { data: result, error } = await client.from(table).upsert(data);
  if (error) console.error(`[SYNC] Error en ${table}:`, error);
  return { data: result, error };
}

async function fetchFromSupabase(table, filters = {}) {
  const client = await initSupabase();
  if (!client) return { data: [], error: "Supabase no configurado" };

  let query = client.from(table).select("*");
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { data, error } = await query;
  if (error) console.error(`[FETCH] Error en ${table}:`, error);
  return { data: data || [], error };
}

async function deleteFromSupabase(table, id) {
  const client = await initSupabase();
  if (!client) return { error: "Supabase no configurado" };

  const { error } = await client.from(table).delete().eq("id", id);
  if (error) console.error(`[DELETE] Error en ${table}:`, error);
  return { error };
}

window.supabaseClient = null;
