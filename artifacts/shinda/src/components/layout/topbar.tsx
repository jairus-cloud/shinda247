import { useState, useEffect } from "react";
import { Wallet, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { useGetGameHistory } from "@workspace/api-client-react";

interface TopbarProps {
  playerId: string;
}

export function Topbar({ playerId }: TopbarProps) {
  const [balance, setBalance] = useState<number>(0);
  
  // Fetch wallet directly with playerId param since generated hook doesn't support params
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch(`/api/wallet?playerId=${playerId}`);
        if (res.ok) {
          const data = await res.json();
          setBalance(data.balance ?? 0);
        }
      } catch {}
    };
    if (playerId) {
      fetchWallet();
      const iv = setInterval(fetchWallet, 3000);
      return () => clearInterval(iv);
    }
  }, [playerId]);
  const { data: history } = useGetGameHistory({ limit: 8 }, { query: { refetchInterval: 5000 } });

  return (
    <header className="h-20 w-full bg-card border-b border-border/50 flex items-center justify-between px-4 md:px-6 z-20 shrink-0">
      
      {/* User Profile & Wallet */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/50 shadow-[0_0_10px_rgba(255,107,0,0.2)] p-0.5 bg-background">
            <img 
              src={`${import.meta.env.BASE_URL}images/avatar.png`} 
              alt="User avatar" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-foreground font-display">SERRIA</p>
            <p className="text-xs text-muted-foreground">ID: {playerId.substring(0, 8)}</p>
          </div>
        </div>

        <div className="h-10 w-px bg-border/50 hidden sm:block mx-2" />

        <div className="flex items-center bg-background rounded-xl p-1 pr-4 border border-border/50">
          <div className="bg-secondary p-2 rounded-lg mr-3">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider leading-none">Balance</span>
            <span className="font-mono font-bold text-sm text-foreground">
              KES {formatCurrency(balance)}
            </span>
          </div>
        </div>

        <Button size="sm" className="hidden md:flex gap-2">
          <Plus className="w-4 h-4" />
          DEPOSIT
        </Button>
      </div>

      {/* Game History Chips */}
      <div className="hidden lg:flex items-center gap-2 overflow-hidden max-w-[400px]">
        <div className="flex items-center text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">
          <Zap className="w-4 h-4 mr-1 text-warning" />
          Previous
        </div>
        {history?.slice(0, 7).map((round, idx) => {
          const m = round.crashedAt;
          const colorClass = 
            m < 2.0 ? "text-destructive bg-destructive/10 border-destructive/20" : 
            m < 5.0 ? "text-warning bg-warning/10 border-warning/20" : 
            "text-success bg-success/10 border-success/20";
            
          return (
            <div 
              key={round.id || idx} 
              className={cn(
                "px-3 py-1 rounded-full font-mono text-sm font-bold border transition-transform hover:-translate-y-0.5 cursor-pointer shadow-sm",
                colorClass
              )}
            >
              {m.toFixed(2)}x
            </div>
          );
        })}
      </div>
      
    </header>
  );
}
