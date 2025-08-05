import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Settings } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Tournament {
  id: string;
  nome: string;
  data: string;
  valor_ficha: number;
  ativo: boolean;
}

interface BirdType {
  id: string;
  nome: string;
  cor: string;
  id_torneio: string;
  estacas_count: number;
  estacas_disponiveis: number;
}

const Home = () => {
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [birdTypes, setBirdTypes] = useState<BirdType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveTournament();
  }, []);

  const fetchActiveTournament = async () => {
    try {
      // Buscar torneio ativo
      const { data: tournamentData } = await supabase
        .from('torneios')
        .select('*')
        .eq('ativo', true)
        .single();

      if (tournamentData) {
        setTournament(tournamentData);

        // Buscar tipos de pássaro do torneio ativo com contagem de estacas
        const { data: typesData } = await supabase
          .from('tipos_passaro')
          .select('*')
          .eq('id_torneio', tournamentData.id);

        if (typesData) {
          // Para cada tipo de pássaro, buscar as contagens de estacas
          const typesWithCounts = await Promise.all(
            typesData.map(async (type) => {
              const { count: totalCount } = await supabase
                .from('estacas')
                .select('*', { count: 'exact', head: true })
                .eq('id_tipo_passaro', type.id);

              const { count: availableCount } = await supabase
                .from('estacas')
                .select('*', { count: 'exact', head: true })
                .eq('id_tipo_passaro', type.id)
                .eq('status', 'disponivel');

              return {
                ...type,
                estacas_count: totalCount || 0,
                estacas_disponiveis: availableCount || 0,
              };
            })
          );

          setBirdTypes(typesWithCounts);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar torneio:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBirdTypeColor = (nome: string) => {
    const colors: Record<string, string> = {
      'Coleiro': 'bg-success text-white',
      'Azulão': 'bg-azulao text-white',
      'Canário': 'bg-canario text-black',
      'Trinca-Ferro': 'bg-trinca-ferro text-white'
    };
    return colors[nome] || 'bg-primary text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Sistema de Reservas APVC</h1>
          <p className="text-xl text-muted-foreground">Nenhum torneio ativo no momento</p>
          <Button 
            onClick={() => navigate('/admin')} 
            variant="outline"
            className="mt-4"
          >
            <Settings className="w-4 h-4 mr-2" />
            Área Administrativa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Sistema de Reservas APVC
            </h1>
            <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
              <Calendar className="w-5 h-5" />
              <span>Próximo Evento: {format(new Date(tournament.data), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
            <Badge variant="secondary" className="text-sm">
              {tournament.nome}
            </Badge>
          </div>
        </div>
      </div>

      {/* Bird Types Grid */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {birdTypes.map((birdType) => (
            <Card 
              key={birdType.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/estacas/${birdType.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{birdType.nome}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{birdType.estacas_disponiveis} de {birdType.estacas_count} disponíveis</span>
                    </div>
                    <Badge className={getBirdTypeColor(birdType.nome)}>
                      R$ {tournament.valor_ficha.toFixed(2)}
                    </Badge>
                  </div>
                  <div className={`w-16 h-16 rounded-full ${getBirdTypeColor(birdType.nome)} flex items-center justify-center`}>
                    <span className="text-2xl font-bold">
                      {birdType.nome.charAt(0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Admin Access */}
      <div className="fixed bottom-4 right-4">
        <Button
          onClick={() => navigate('/admin')}
          variant="outline"
          size="sm"
        >
          <Settings className="w-4 h-4 mr-2" />
          Admin
        </Button>
      </div>
    </div>
  );
};

export default Home;