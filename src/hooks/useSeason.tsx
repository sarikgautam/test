import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Season {
  id: string;
  name: string;
  year: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  registration_open: boolean;
  auction_date: string | null;
  created_at: string;
  updated_at: string;
}

interface SeasonContextType {
  seasons: Season[];
  activeSeason: Season | null;
  selectedSeasonId: string | null;
  setSelectedSeasonId: (id: string) => void;
  isLoading: boolean;
}

const SeasonContext = createContext<SeasonContextType | null>(null);

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  const { data: seasons = [], isLoading } = useQuery({
    queryKey: ["seasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .order("year", { ascending: false });
      if (error) throw error;
      return data as Season[];
    },
  });

  const activeSeason = seasons.find((s) => s.is_active) || null;

  // Default to active season if none selected
  useEffect(() => {
    if (!selectedSeasonId && activeSeason) {
      setSelectedSeasonId(activeSeason.id);
    }
  }, [activeSeason, selectedSeasonId]);

  return (
    <SeasonContext.Provider
      value={{
        seasons,
        activeSeason,
        selectedSeasonId,
        setSelectedSeasonId,
        isLoading,
      }}
    >
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const context = useContext(SeasonContext);
  if (!context) {
    throw new Error("useSeason must be used within a SeasonProvider");
  }
  return context;
}

export function useActiveSeason() {
  const { data: activeSeason } = useQuery({
    queryKey: ["active-season"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as Season | null;
    },
  });
  return activeSeason;
}
