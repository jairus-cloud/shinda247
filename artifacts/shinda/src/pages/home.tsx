import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { GameCanvas } from "@/components/game/game-canvas";
import { GameControls } from "@/components/game/game-controls";
import { HistoryPanel } from "@/components/game/history-panel";
import { usePlayerId } from "@/hooks/use-player-id";
import { useGetGameState, useGetActivePlayers } from "@workspace/api-client-react";

export default function Home() {
  const playerId = usePlayerId();
  
  // Real-time polling hooks
  const { data: gameState } = useGetGameState({ query: { refetchInterval: 500 } });
  const { data: activePlayers } = useGetActivePlayers({ query: { refetchInterval: 2000 } });

  if (!playerId) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      
      {/* Left Sidebar Navigation */}
      <Sidebar />

      {/* Main Center Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        <Topbar playerId={playerId} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
            {/* Visual Game Area */}
            <GameCanvas gameState={gameState} />
            
            {/* Betting Controls */}
            <GameControls 
              playerId={playerId} 
              gameState={gameState} 
              activePlayers={activePlayers} 
            />
            
            {/* History and Extra Info */}
            <HistoryPanel />
          </div>
          
          <div className="h-12" /> {/* Bottom padding */}
        </main>
      </div>

      {/* Right Sidebar Leaderboard */}
      <RightSidebar />

    </div>
  );
}
