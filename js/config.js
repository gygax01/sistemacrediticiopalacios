const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

const APP_CONFIG = {
  appName: "Sistema de Préstamos",
  version: "1.0.0",
  storageKeys: {
    clientes: "prestamos_clientes",
    prestamos: "prestamos_prestamos",
    pagos: "prestamos_pagos"
  }
};

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("[CONFIG] Supabase no configurado. Usando modo local (localStorage).");
}
