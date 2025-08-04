import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { StakeGrid } from "@/components/stakes/StakeGrid";
import { ReservationModal } from "@/components/stakes/ReservationModal";

interface BirdType {
  id: string;
  nome: string;
  cor: string;
  id_torneio: string;
}

interface Tournament {
  id: string;
  nome: string;
  data: string;
  valor_ficha: number;
  ativo: boolean;
}

interface Stake {
  id: string;
  numero: number;
  status: 'disponivel' | 'pendente' | 'confirmada';
  nome_reservante?: string;
  telefone?: string;
  id_passaro: string;
  id_torneio: string;
}

const Stakes = () => {
  const { birdTypeId } = useParams();
  const navigate = useNavigate();
  const [birdType, setBirdType] = useState<BirdType | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [selectedStake, setSelectedStake] = useState<Stake | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (birdTypeId) {
      fetchData();
    }
  }, [birdTypeId]);

  const fetchData = async () => {
    try {
      // Buscar informações do tipo de pássaro
      const { data: birdTypeData } = await supabase
        .from('tipos_passaro')
        .select('*')
        .eq('id', birdTypeId)
        .single();

      if (birdTypeData) {
        setBirdType(birdTypeData);

        // Buscar informações do torneio
        const { data: tournamentData } = await supabase
          .from('torneios')
          .select('*')
          .eq('id', birdTypeData.id_torneio)
          .single();

        setTournament(tournamentData);

        // Buscar estacas
        const { data: stakesData } = await supabase
          .from('estacas')
          .select('*')
          .eq('id_passaro', birdTypeId)
          .order('numero');

        setStakes(stakesData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStakeClick = (stake: Stake) => {
    if (stake.status === 'disponivel') {
      setSelectedStake(stake);
    }
  };

  const handleReservationSuccess = () => {
    setSelectedStake(null);
    fetchData(); // Recarregar dados após reserva
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando estacas...</p>
        </div>
      </div>
    );
  }

  if (!birdType || !tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Tipo de pássaro não encontrado</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{birdType.nome}</h1>
                <p className="text-muted-foreground">{tournament.nome}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor da Estaca</p>
              <p className="text-xl font-bold text-primary">
                R$ {tournament.valor_ficha.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stakes Grid */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <StakeGrid 
          stakes={stakes}
          onStakeClick={handleStakeClick}
        />
      </div>

      {/* Reservation Modal */}
      {selectedStake && tournament && (
        <ReservationModal
          stake={selectedStake}
          tournament={tournament}
          onClose={() => setSelectedStake(null)}
          onSuccess={handleReservationSuccess}
        />
      )}
    </div>
  );
};

export default Stakes;