-- Enable RLS on all tables that don't have it enabled
ALTER TABLE torneios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_passaro ENABLE ROW LEVEL SECURITY;
ALTER TABLE estacas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Fix function security issues by setting search_path
CREATE OR REPLACE FUNCTION authenticate_admin(email_input TEXT, password_input TEXT)
RETURNS JSON AS $$
DECLARE
    admin_user RECORD;
    is_valid BOOLEAN := FALSE;
BEGIN
    -- Simple hardcoded admin check (as requested in specs)
    IF email_input = 'gilbertohorstmann@hotmail.com' AND password_input = 'APVC2025$' THEN
        is_valid := TRUE;
    END IF;
    
    IF is_valid THEN
        RETURN json_build_object('success', true, 'user', json_build_object('email', email_input, 'role', 'admin'));
    ELSE
        RETURN json_build_object('success', false, 'error', 'Credenciais inválidas');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION create_tournament_complete(
    tournament_name TEXT,
    tournament_date DATE,
    stake_value DECIMAL,
    bird_types JSON
) RETURNS JSON AS $$
DECLARE
    tournament_id UUID;
    bird_type RECORD;
    type_id UUID;
    i INTEGER;
BEGIN
    -- First deactivate all tournaments
    UPDATE torneios SET ativo = false;
    
    -- Create new tournament
    INSERT INTO torneios (nome, data, valor_ficha, ativo)
    VALUES (tournament_name, tournament_date, stake_value, true)
    RETURNING id INTO tournament_id;
    
    -- Create bird types and stakes
    FOR bird_type IN SELECT * FROM json_to_recordset(bird_types) AS x(nome TEXT, cor TEXT, quantidade INTEGER)
    LOOP
        -- Create bird type
        INSERT INTO tipos_passaro (nome, cor, id_torneio)
        VALUES (bird_type.nome, bird_type.cor, tournament_id)
        RETURNING id INTO type_id;
        
        -- Create stakes for this bird type
        FOR i IN 1..bird_type.quantidade LOOP
            INSERT INTO estacas (numero, id_tipo_passaro, status)
            VALUES (i, type_id, 'disponivel');
        END LOOP;
    END LOOP;
    
    RETURN json_build_object('success', true, 'tournament_id', tournament_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION reserve_stake(
    stake_id UUID,
    customer_name TEXT,
    customer_phone TEXT
) RETURNS JSON AS $$
DECLARE
    stake_status TEXT;
BEGIN
    -- Check if stake is available
    SELECT status INTO stake_status FROM estacas WHERE id = stake_id;
    
    IF stake_status IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Estaca não encontrada');
    END IF;
    
    IF stake_status != 'disponivel' THEN
        RETURN json_build_object('success', false, 'error', 'Estaca não está disponível');
    END IF;
    
    -- Reserve the stake
    UPDATE estacas 
    SET status = 'reservado',
        nome_reservante = customer_name,
        telefone = customer_phone,
        updated_at = now()
    WHERE id = stake_id;
    
    RETURN json_build_object('success', true, 'message', 'Estaca reservada com sucesso');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION confirm_stake_payment(stake_id UUID)
RETURNS JSON AS $$
BEGIN
    UPDATE estacas 
    SET status = 'confirmado',
        updated_at = now()
    WHERE id = stake_id AND status = 'reservado';
    
    IF FOUND THEN
        RETURN json_build_object('success', true, 'message', 'Pagamento confirmado');
    ELSE
        RETURN json_build_object('success', false, 'error', 'Estaca não encontrada ou não está reservada');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION cancel_stake_reservation(stake_id UUID)
RETURNS JSON AS $$
BEGIN
    UPDATE estacas 
    SET status = 'disponivel',
        nome_reservante = NULL,
        telefone = NULL,
        updated_at = now()
    WHERE id = stake_id AND status IN ('reservado', 'confirmado');
    
    IF FOUND THEN
        RETURN json_build_object('success', true, 'message', 'Reserva cancelada');
    ELSE
        RETURN json_build_object('success', false, 'error', 'Estaca não encontrada');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    stats RECORD;
    total_revenue DECIMAL := 0;
BEGIN
    -- Get basic stats
    SELECT 
        COUNT(*) as total_stakes,
        COUNT(CASE WHEN status = 'disponivel' THEN 1 END) as available,
        COUNT(CASE WHEN status = 'reservado' THEN 1 END) as reserved,
        COUNT(CASE WHEN status = 'confirmado' THEN 1 END) as confirmed
    INTO stats
    FROM estacas e
    JOIN tipos_passaro tp ON e.id_tipo_passaro = tp.id
    JOIN torneios t ON tp.id_torneio = t.id
    WHERE t.ativo = true;
    
    -- Calculate total revenue (only confirmed stakes)
    SELECT COALESCE(SUM(t.valor_ficha), 0) INTO total_revenue
    FROM estacas e
    JOIN tipos_passaro tp ON e.id_tipo_passaro = tp.id
    JOIN torneios t ON tp.id_torneio = t.id
    WHERE t.ativo = true AND e.status = 'confirmado';
    
    RETURN json_build_object(
        'total_stakes', stats.total_stakes,
        'available', stats.available,
        'reserved', stats.reserved,
        'confirmed', stats.confirmed,
        'total_revenue', total_revenue
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;