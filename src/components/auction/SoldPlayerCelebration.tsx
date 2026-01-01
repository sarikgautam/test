import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, User, Sparkles } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

interface SoldPlayerCelebrationProps {
  player: Player;
  team: Team;
  soldPrice: number;
  onClose: () => void;
}

const roleLabels: Record<string, string> = {
  batsman: "Batsman",
  bowler: "Bowler",
  all_rounder: "All-Rounder",
  wicket_keeper: "Wicket Keeper",
};

export function SoldPlayerCelebration({ player, team, soldPrice, onClose }: SoldPlayerCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <Card 
        className={`border-2 border-primary bg-gradient-to-br from-primary/20 via-background to-primary/10 max-w-lg w-full mx-4 transform transition-all duration-500 ${
          isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-0">
          {/* Header */}
          <div className="bg-primary/30 px-6 py-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Sparkles className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <Trophy className="w-10 h-10 mx-auto text-primary mb-2 animate-bounce" />
              <h2 className="text-2xl font-display font-bold text-primary">SOLD!</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex flex-col items-center gap-6">
              {/* Player Photo */}
              <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center border-4 border-primary/50 shadow-lg">
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt={player.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-14 h-14 text-muted-foreground" />
                )}
              </div>

              {/* Player Info */}
              <div className="text-center">
                <h3 className="text-2xl font-display font-bold mb-2">{player.full_name}</h3>
                <Badge variant="secondary" className="text-sm">
                  {roleLabels[player.role]}
                </Badge>
              </div>

              {/* Sold To Section */}
              <div className="w-full bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground text-center mb-3">Sold to</p>
                <div className="flex items-center justify-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold shadow-lg"
                    style={{
                      backgroundColor: team.primary_color,
                      color: team.secondary_color,
                    }}
                  >
                    {team.logo_url ? (
                      <img
                        src={team.logo_url}
                        alt={team.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      team.short_name
                    )}
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg">{team.name}</p>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Sold for</p>
                <p className="text-4xl font-display font-bold text-primary">
                  ${soldPrice.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-muted/20 px-6 py-3 text-center">
            <p className="text-sm text-muted-foreground">Click anywhere to dismiss</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
