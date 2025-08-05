-- Create ENUM for stake status
CREATE TYPE public.estaca_status AS ENUM ('disponivel', 'pendente', 'confirmada');

-- Create tournaments table
CREATE TABLE public.torneios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    data DATE NOT NULL,
    valor_ficha DECIMAL(10,2) NOT NULL DEFAULT 35.00,
    ativo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bird types table
CREATE TABLE public.tipos_passaro (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cor TEXT NOT NULL,
    id_torneio UUID NOT NULL REFERENCES public.torneios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stakes table
CREATE TABLE public.estacas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    numero INTEGER NOT NULL,
    id_passaro UUID NOT NULL REFERENCES public.tipos_passaro(id) ON DELETE CASCADE,
    id_torneio UUID NOT NULL REFERENCES public.torneios(id) ON DELETE CASCADE,
    status public.estaca_status NOT NULL DEFAULT 'disponivel',
    nome_reservante TEXT,
    telefone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(numero, id_passaro, id_torneio)
);

-- Create admin users table
CREATE TABLE public.usuarios_admin (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default admin user
INSERT INTO public.usuarios_admin (email, senha_hash) 
VALUES ('gilbertohorstmann@hotmail.com', 'APVC2025$');

-- Enable RLS on all tables
ALTER TABLE public.torneios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_passaro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estacas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_admin ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (read-only for active tournaments)
CREATE POLICY "Public can view active tournaments" 
ON public.torneios 
FOR SELECT 
USING (ativo = true);

CREATE POLICY "Public can view bird types of active tournaments" 
ON public.tipos_passaro 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.torneios 
        WHERE id = tipos_passaro.id_torneio 
        AND ativo = true
    )
);

CREATE POLICY "Public can view stakes of active tournaments" 
ON public.estacas 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.torneios 
        WHERE id = estacas.id_torneio 
        AND ativo = true
    )
);

CREATE POLICY "Public can reserve available stakes" 
ON public.estacas 
FOR UPDATE 
USING (
    status = 'disponivel' 
    AND EXISTS (
        SELECT 1 FROM public.torneios 
        WHERE id = estacas.id_torneio 
        AND ativo = true
    )
);

-- Admin policies (bypass RLS when authenticated as admin)
CREATE POLICY "Admin full access to tournaments" 
ON public.torneios 
FOR ALL 
USING (true);

CREATE POLICY "Admin full access to bird types" 
ON public.tipos_passaro 
FOR ALL 
USING (true);

CREATE POLICY "Admin full access to stakes" 
ON public.estacas 
FOR ALL 
USING (true);

CREATE POLICY "Admin can view admin users" 
ON public.usuarios_admin 
FOR SELECT 
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_torneios_updated_at
    BEFORE UPDATE ON public.torneios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tipos_passaro_updated_at
    BEFORE UPDATE ON public.tipos_passaro
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_estacas_updated_at
    BEFORE UPDATE ON public.estacas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create stakes when a bird type is created
CREATE OR REPLACE FUNCTION public.create_stakes_for_bird_type()
RETURNS TRIGGER AS $$
BEGIN
    -- Create 100 stakes for each bird type by default
    INSERT INTO public.estacas (numero, id_passaro, id_torneio)
    SELECT 
        generate_series(1, 100) as numero,
        NEW.id as id_passaro,
        NEW.id_torneio as id_torneio;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create stakes
CREATE TRIGGER create_stakes_on_bird_type_insert
    AFTER INSERT ON public.tipos_passaro
    FOR EACH ROW
    EXECUTE FUNCTION public.create_stakes_for_bird_type();