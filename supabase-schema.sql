-- ============================================
-- SISTEMA DE PRÉSTAMOS - TABLAS SUPABASE
-- ============================================

-- 1. TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    matricula TEXT,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE PRÉSTAMOS
CREATE TABLE IF NOT EXISTS prestamos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    monto_total NUMERIC(12, 2) NOT NULL,
    tasa_interes NUMERIC(5, 2) DEFAULT 0,
    interes_total NUMERIC(12, 2) DEFAULT 0,
    total_pagar NUMERIC(12, 2) NOT NULL,
    saldo_pendiente NUMERIC(12, 2) NOT NULL,
    total_pagos INTEGER DEFAULT 1,
    pagos_realizados INTEGER DEFAULT 0,
    fecha_inicio DATE NOT NULL,
    fecha_proximo_pago DATE,
    frecuencia_pago TEXT DEFAULT 'mensual',
    monto_pago NUMERIC(12, 2),
    estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'pagado')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE PAGOS
CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prestamo_id UUID NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    monto NUMERIC(12, 2) NOT NULL,
    fecha_pago DATE NOT NULL,
    nota TEXT,
    estado TEXT DEFAULT 'confirmado' CHECK (estado IN ('confirmado', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================
CREATE INDEX IF NOT EXISTS idx_prestamos_cliente ON prestamos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON prestamos(estado);
CREATE INDEX IF NOT EXISTS idx_prestamos_fecha_proximo ON prestamos(fecha_proximo_pago);
CREATE INDEX IF NOT EXISTS idx_pagos_prestamo ON pagos(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cliente ON pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha_pago);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - SEGURIDAD
-- ============================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (ajusta según necesidades)
CREATE POLICY "Permitir lectura clientes" ON clientes FOR SELECT USING (true);
CREATE POLICY "Permitir insertar clientes" ON clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizar clientes" ON clientes FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminar clientes" ON clientes FOR DELETE USING (true);

CREATE POLICY "Permitir lectura prestamos" ON prestamos FOR SELECT USING (true);
CREATE POLICY "Permitir insertar prestamos" ON prestamos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizar prestamos" ON prestamos FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminar prestamos" ON prestamos FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pagos" ON pagos FOR SELECT USING (true);
CREATE POLICY "Permitir insertar pagos" ON pagos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizar pagos" ON pagos FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminar pagos" ON pagos FOR DELETE USING (true);

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para actualizar saldo al hacer pago
CREATE OR REPLACE FUNCTION actualizar_saldo_prestamo()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE prestamos
    SET saldo_pendiente = saldo_pendiente - NEW.monto,
        pagos_realizados = pagos_realizados + 1,
        fecha_ultimo_pago = NEW.fecha_pago,
        estado = CASE 
            WHEN (saldo_pendiente - NEW.monto) <= 0 THEN 'pagado'
            ELSE estado
        END
    WHERE id = NEW.prestamo_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la función
DROP TRIGGER IF EXISTS trigger_actualizar_saldo ON pagos;
CREATE TRIGGER trigger_actualizar_saldo
    AFTER INSERT ON pagos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_saldo_prestamo();

-- Función para obtener resumen de cliente
CREATE OR REPLACE FUNCTION resumen_cliente(p_cliente_id UUID)
RETURNS JSON AS $$
DECLARE
    total_prestado NUMERIC;
    total_pagado NUMERIC;
    prestamos_activos INTEGER;
BEGIN
    SELECT COALESCE(SUM(monto_total), 0), COALESCE(SUM(saldo_pendiente), 0), COUNT(*)
    INTO total_prestado, total_pagado, prestamos_activos
    FROM prestamos
    WHERE cliente_id = p_cliente_id AND estado = 'activo';

    RETURN json_build_object(
        'total_prestado', total_prestado,
        'total_pagado', total_pagado,
        'prestamos_activos', prestamos_activos
    );
END;
$$ LANGUAGE plpgsql;
