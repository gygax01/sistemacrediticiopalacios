const SUPABASE_URL = "https://rmtvtueqvrpjfgevfofo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdHZ0dWVxdnJwamZnZXZmb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzcwMjQsImV4cCI6MjA5MTQxMzAyNH0.IAP417qlGbY_nceyDASeT_6eTAFwaAmB075RCY7lyFM";

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
