-- Agregar columna fecha_ultimo_pago a prestamos
ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS fecha_ultimo_pago DATE;

-- Agregar columna fecha_proximo_pago si no existe
ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS fecha_proximo_pago DATE;