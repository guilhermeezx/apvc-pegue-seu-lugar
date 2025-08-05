import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Stake {
  id: string;
  numero: number;
  status: string;
}

interface Tournament {
  id: string;
  nome: string;
  valor_ficha: number;
}

interface ReservationModalProps {
  stake: Stake;
  tournament: Tournament;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReservationModal = ({ stake, tournament, onClose, onSuccess }: ReservationModalProps) => {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const pixKey = "34.481.266/0001-15";
  const whatsappNumber = "5547991266161";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || !telefone.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('reserve_stake', {
        stake_id: stake.id,
        customer_name: nome.trim(),
        customer_phone: telefone.trim(),
      });

      if (error) throw error;

      const result = data as { success: boolean; message?: string; error?: string };
      
      if (result.success) {
        toast({
          title: "Reserva realizada!",
          description: "Estaca reservada com sucesso. Envie o comprovante via WhatsApp.",
        });
        onSuccess();
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao realizar reserva.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao reservar estaca:', error);
      toast({
        title: "Erro",
        description: "Erro ao realizar reserva. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      toast({
        title: "PIX copiado!",
        description: "Chave PIX copiada para a área de transferência.",
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = pixKey;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "PIX copiado!",
        description: "Chave PIX copiada para a área de transferência.",
      });
    }
  };

  const openWhatsApp = () => {
    const message = `Olá! Gostaria de enviar o comprovante de pagamento para a reserva da estaca ${stake.numero} do torneio ${tournament.nome}. Valor: R$ ${tournament.valor_ficha.toFixed(2)}`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Reservar Estaca {stake.numero}
          </DialogTitle>
          <DialogDescription>
            Preencha seus dados para reservar esta estaca
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite seu nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone *</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(47) 99999-9999"
              required
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold">Informações de Pagamento</h4>
            
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Valor:</span>
                <span className="text-sm font-bold text-primary">
                  R$ {tournament.valor_ficha.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">PIX:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">{pixKey}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyPixKey}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                WhatsApp para comprovante: 47 99126-6161
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Reservando..." : "Confirmar Reserva"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={openWhatsApp}
              className="w-full"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Enviar Comprovante no WhatsApp
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};