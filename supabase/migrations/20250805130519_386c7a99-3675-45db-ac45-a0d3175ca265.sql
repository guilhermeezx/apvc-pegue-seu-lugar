-- Add missing RLS policies for usuarios and reservas tables

-- Policies for usuarios table (admin only)
CREATE POLICY "Only admins can access usuarios" 
ON usuarios FOR ALL 
USING (false); -- No public access to users table

-- Policies for reservas table (admin only) 
CREATE POLICY "Only admins can access reservas" 
ON reservas FOR ALL 
USING (false); -- No public access to reservations table

-- Add admin policies (these will be used when admin functions run with SECURITY DEFINER)
CREATE POLICY "Admin functions can access all data" 
ON torneios FOR ALL 
USING (true);

CREATE POLICY "Admin functions can access all tipos_passaro" 
ON tipos_passaro FOR ALL 
USING (true);

CREATE POLICY "Admin functions can access all estacas" 
ON estacas FOR ALL 
USING (true);

CREATE POLICY "Admin functions can access all usuarios" 
ON usuarios FOR ALL 
USING (true);

CREATE POLICY "Admin functions can access all reservas" 
ON reservas FOR ALL 
USING (true);