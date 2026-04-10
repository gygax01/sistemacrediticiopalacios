async function guardarClienteRemoto(cliente) {
  return await syncToSupabase("clientes", cliente);
}

async function obtenerClientePorId(id) {
  const clientes = obtenerClientes();
  return clientes.find(c => c.id === id) || null;
}

async function actualizarClienteLocal(id, updates) {
  const clientes = obtenerClientes();
  const index = clientes.findIndex(c => c.id === id);
  if (index !== -1) {
    clientes[index] = { ...clientes[index], ...updates };
    safeSet(APP_CONFIG.storageKeys.clientes, clientes);
    await syncToSupabase("clientes", clientes[index]);
    return clientes[index];
  }
  return null;
}

async function eliminarClienteLocal(id) {
  const clientes = obtenerClientes().filter(c => c.id !== id);
  safeSet(APP_CONFIG.storageKeys.clientes, clientes);
  await deleteFromSupabase("clientes", id);
}
