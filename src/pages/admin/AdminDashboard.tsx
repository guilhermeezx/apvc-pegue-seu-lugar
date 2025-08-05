import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Plus, TrendingUp, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    reserved: 0,
    confirmed: 0,
    revenue: 0
  });

  useEffect(() => {
    // Verificar se está logado
    const isLoggedIn = localStorage.getItem('admin_logged_in');
    if (!isLoggedIn) {
      navigate('/admin');
      return;
    }
    
    // Carregar estatísticas
    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      
      if (error) throw error;
      
      const result = data as {
        total_stakes: number;
        available: number;
        reserved: number;
        confirmed: number;
        total_revenue: number;
      };
      
      setStats({
        total: result.total_stakes,
        available: result.available,
        reserved: result.reserved,
        confirmed: result.confirmed,
        revenue: Number(result.total_revenue)
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar estatísticas do dashboard.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Painel Administrativo APVC</h1>
              <p className="text-muted-foreground">Sistema de Reservas de Estacas</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="stakes">Estacas</TabsTrigger>
            <TabsTrigger value="tournaments">Torneios</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Estacas</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    Todas as categorias
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
                  <div className="w-4 h-4 bg-success rounded-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.available}</div>
                  <p className="text-xs text-muted-foreground">
                    Prontas para reserva
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <div className="w-4 h-4 bg-warning rounded-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.reserved}</div>
                  <p className="text-xs text-muted-foreground">
                    Aguardando pagamento
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
                  <div className="w-4 h-4 bg-error rounded-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.confirmed}</div>
                  <p className="text-xs text-muted-foreground">
                    Pagas e confirmadas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Valor Arrecadado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Arrecadação Total
                </CardTitle>
                <CardDescription>
                  Valor total arrecadado com estacas confirmadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  R$ {stats.revenue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stakes" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Gerenciar Estacas</h2>
              <div className="flex gap-2">
                <Button variant="outline">Exportar CSV</Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-4" />
                  <p>Nenhum torneio ativo encontrado.</p>
                  <p className="text-sm">Crie um torneio para visualizar as estacas.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tournaments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Gerenciar Torneios</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Torneio
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-4" />
                  <p>Nenhum torneio cadastrado.</p>
                  <p className="text-sm">Clique em "Novo Torneio" para começar.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;