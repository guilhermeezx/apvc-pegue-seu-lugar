import { cn } from "@/lib/utils";

interface Stake {
  id: string;
  numero: number;
  status: 'disponivel' | 'pendente' | 'confirmada';
  nome_reservante?: string;
  telefone?: string;
}

interface StakeGridProps {
  stakes: Stake[];
  onStakeClick: (stake: Stake) => void;
  isAdmin?: boolean;
  onAdminAction?: (stake: Stake, action: 'confirm' | 'cancel') => void;
}

export const StakeGrid = ({ stakes, onStakeClick, isAdmin = false, onAdminAction }: StakeGridProps) => {
  const getStakeColor = (status: Stake['status']) => {
    switch (status) {
      case 'disponivel':
        return 'bg-success hover:bg-success/90 text-white';
      case 'pendente':
        return 'bg-warning text-black';
      case 'confirmada':
        return 'bg-error text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: Stake['status']) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível';
      case 'pendente':
        return 'Pendente';
      case 'confirmada':
        return 'Confirmada';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-success rounded"></div>
          <span className="text-sm">Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-warning rounded"></div>
          <span className="text-sm">Aguardando Pagamento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-error rounded"></div>
          <span className="text-sm">Confirmada</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
        {stakes.map((stake) => (
          <div key={stake.id} className="relative group">
            <button
              onClick={() => onStakeClick(stake)}
              className={cn(
                "w-full aspect-square rounded-lg font-semibold transition-all duration-200 relative",
                getStakeColor(stake.status),
                stake.status === 'disponivel' && "hover:scale-105 cursor-pointer",
                stake.status !== 'disponivel' && "cursor-default"
              )}
              disabled={!isAdmin && stake.status !== 'disponivel'}
            >
              <span className="text-sm">{stake.numero}</span>
              
              {/* Tooltip for reserved stakes */}
              {stake.status !== 'disponivel' && stake.nome_reservante && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-card border rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                  <div className="text-foreground font-medium">{stake.nome_reservante}</div>
                  <div className="text-muted-foreground">{stake.telefone}</div>
                  <div className="text-muted-foreground">{getStatusText(stake.status)}</div>
                </div>
              )}
            </button>

            {/* Admin Actions */}
            {isAdmin && stake.status !== 'disponivel' && onAdminAction && (
              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  {stake.status === 'pendente' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdminAction(stake, 'confirm');
                      }}
                      className="w-6 h-6 bg-success text-white rounded-full text-xs flex items-center justify-center hover:bg-success/90"
                      title="Marcar como Pago"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdminAction(stake, 'cancel');
                    }}
                    className="w-6 h-6 bg-error text-white rounded-full text-xs flex items-center justify-center hover:bg-error/90"
                    title="Cancelar Reserva"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};