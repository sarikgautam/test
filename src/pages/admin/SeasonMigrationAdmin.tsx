import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Users, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Season {
  id: string;
  name: string;
  year: number;
  is_active: boolean;
}

interface MigrationResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function SeasonMigrationAdmin() {
  const [sourceSeasonId, setSourceSeasonId] = useState<string>("");
  const [targetSeasonId, setTargetSeasonId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all seasons
  const { data: seasons } = useQuery({
    queryKey: ["all-seasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .order("year", { ascending: false });
      if (error) throw error;
      return data as Season[];
    },
  });

  // Fetch player count for source season
  const { data: sourcePlayerCount } = useQuery({
    queryKey: ["player-count", sourceSeasonId],
    queryFn: async () => {
      if (!sourceSeasonId) return 0;
      const { count, error } = await supabase
        .from("player_season_registrations")
        .select("*", { count: "exact", head: true })
        .eq("season_id", sourceSeasonId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!sourceSeasonId,
  });

  const migratePlayers = async () => {
    if (!sourceSeasonId || !targetSeasonId) {
      toast({
        title: "Missing selection",
        description: "Please select both source and target seasons",
        variant: "destructive",
      });
      return;
    }

    if (sourceSeasonId === targetSeasonId) {
      toast({
        title: "Invalid selection",
        description: "Source and target seasons must be different",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    const migrationResult: MigrationResult = { success: 0, failed: 0, errors: [] };

    try {
      // Fetch all registrations from source season
      const { data: sourceRegistrations, error: fetchError } = await supabase
        .from("player_season_registrations")
        .select("player_id, base_price")
        .eq("season_id", sourceSeasonId);

      if (fetchError) throw fetchError;

      // Create registrations for target season
      for (const reg of sourceRegistrations || []) {
        try {
          // Check if registration already exists
          const { data: existing } = await supabase
            .from("player_season_registrations")
            .select("id")
            .eq("player_id", reg.player_id)
            .eq("season_id", targetSeasonId)
            .maybeSingle();

          if (existing) {
            migrationResult.failed++;
            migrationResult.errors.push(`Player already registered for target season`);
            continue;
          }

          const { error: insertError } = await supabase
            .from("player_season_registrations")
            .insert({
              player_id: reg.player_id,
              season_id: targetSeasonId,
              auction_status: "registered",
              base_price: reg.base_price || 20,
            });

          if (insertError) {
            migrationResult.failed++;
            migrationResult.errors.push(`Failed: ${insertError.message}`);
          } else {
            migrationResult.success++;
          }
        } catch (err: any) {
          migrationResult.failed++;
          migrationResult.errors.push(`Error: ${err.message}`);
        }
      }

      setResult(migrationResult);
      queryClient.invalidateQueries({ queryKey: ["player-count"] });
      queryClient.invalidateQueries({ queryKey: ["admin-players"] });

      toast({
        title: "Migration complete",
        description: `${migrationResult.success} players migrated, ${migrationResult.failed} failed`,
        variant: migrationResult.failed === 0 ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Migration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const sourceSeason = seasons?.find((s) => s.id === sourceSeasonId);
  const targetSeason = seasons?.find((s) => s.id === targetSeasonId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">Season Player Migration</h1>
        <p className="text-muted-foreground mt-1">
          Copy player registrations from one season to another
        </p>
      </div>

      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          This tool copies player registrations from one season to another. All players will be
          registered with status "registered" and their base prices will be preserved.
        </AlertDescription>
      </Alert>

      {/* Season Selection */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Select Seasons
          </CardTitle>
          <CardDescription>Choose source and target seasons for migration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Season */}
            <div className="space-y-2">
              <Label>Source Season (Copy From)</Label>
              <Select value={sourceSeasonId} onValueChange={setSourceSeasonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons?.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      <div className="flex items-center gap-2">
                        {season.name} ({season.year})
                        {season.is_active && (
                          <Badge variant="default" className="text-xs py-0 h-5">
                            Active
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sourceSeasonId && (
                <p className="text-sm text-muted-foreground">
                  <Users className="w-4 h-4 inline mr-1" />
                  {sourcePlayerCount} players registered
                </p>
              )}
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-primary" />
            </div>

            {/* Target Season */}
            <div className="space-y-2">
              <Label>Target Season (Copy To)</Label>
              <Select value={targetSeasonId} onValueChange={setTargetSeasonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons?.map((season) => (
                    <SelectItem
                      key={season.id}
                      value={season.id}
                      disabled={season.id === sourceSeasonId}
                    >
                      <div className="flex items-center gap-2">
                        {season.name} ({season.year})
                        {season.is_active && (
                          <Badge variant="default" className="text-xs py-0 h-5">
                            Active
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {sourceSeason && targetSeason && (
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Migration Summary:</p>
              <p className="text-sm text-muted-foreground">
                Copy <strong>{sourcePlayerCount} players</strong> from{" "}
                <strong>{sourceSeason.name}</strong> to <strong>{targetSeason.name}</strong>
              </p>
            </div>
          )}

          <Button
            onClick={migratePlayers}
            disabled={!sourceSeasonId || !targetSeasonId || isProcessing}
            className="w-full"
            size="lg"
          >
            <Copy className="w-4 h-4 mr-2" />
            {isProcessing ? "Migrating..." : "Migrate Players"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card
          className={
            result.failed === 0 ? "border-green-500/30" : "border-amber-500/30"
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.failed === 0 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Migration Successful
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Migration Completed with Errors
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-500">{result.success}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-amber-500">{result.failed}</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Errors:</p>
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-1 max-h-60 overflow-y-auto">
                  {result.errors.slice(0, 10).map((error, idx) => (
                    <p key={idx} className="text-xs text-destructive">
                      {error}
                    </p>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-xs text-muted-foreground italic">
                      ... and {result.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            )}

            <Button variant="outline" onClick={() => setResult(null)} className="w-full">
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-border/50 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>1.</strong> Select the <strong>source season</strong> (the season you want to
            copy players from)
          </p>
          <p>
            <strong>2.</strong> Select the <strong>target season</strong> (the season you want to
            copy players to)
          </p>
          <p>
            <strong>3.</strong> Click <strong>Migrate Players</strong> to copy all player
            registrations
          </p>
          <p className="text-muted-foreground mt-4">
            Note: Players will be registered with status "registered" and their original base
            prices. Duplicate registrations will be skipped.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
