import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Plus, FileUp, AlertCircle, CheckCircle2 } from "lucide-react";

interface ImportRow {
  full_name: string;
  role: string;
  current_team: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function PlayersImportAdmin() {
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<string>("batsman");
  const [newTeam, setNewTeam] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teams for dropdown
  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch Season 1
  const { data: season1 } = useQuery({
    queryKey: ["season-1"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("id")
        .eq("year", 2025)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const addPlayerMutation = useMutation({
    mutationFn: async (player: ImportRow) => {
      if (!season1?.id) throw new Error("Season 1 not found");

      const slugBase = player.full_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const uid = Math.random().toString(36).slice(2, 10);
      const placeholderEmail = `${slugBase || "player"}.${uid}@gcnpl.local`;

      const { data: playerData, error: playerErr } = await supabase
        .from("players")
        .insert({
          full_name: player.full_name.trim(),
          role: player.role as any,
          original_season_id: season1.id,
          email: placeholderEmail,
          current_team: player.current_team,
        })
        .select("id")
        .single();
      if (playerErr) throw playerErr;

      // Create season registration
      const { error: regErr } = await supabase
        .from("player_season_registrations")
        .insert({
          player_id: playerData.id,
          season_id: season1.id,
          auction_status: "registered",
          base_price: 20,
        });
      if (regErr) throw regErr;

      return playerData;
    },
    onError: (error: any) => {
      console.error("Add player error:", error);
    },
  });

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newRole || !newTeam) {
      toast({
        title: "Missing fields",
        description: "Please fill in name, role, and team",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addPlayerMutation.mutateAsync({
        full_name: newName,
        role: newRole,
        current_team: newTeam,
      });
      setNewName("");
      setNewRole("batsman");
      setNewTeam("");
      queryClient.invalidateQueries({ queryKey: ["admin-players"] });
      toast({ title: "Player added successfully" });
    } catch (error: any) {
      toast({
        title: "Failed to add player",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseBulkImport = (text: string): ImportRow[] => {
    const lines = text.trim().split("\n");
    const rows: ImportRow[] = [];

    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 3) {
        rows.push({
          full_name: parts[0],
          role: parts[1],
          current_team: parts[2],
        });
      }
    }

    return rows;
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      toast({
        title: "Empty input",
        description: "Please paste CSV data",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const rows = parseBulkImport(bulkText);
    const results: ImportResult = { success: 0, failed: 0, errors: [] };

    for (const row of rows) {
      try {
        await addPlayerMutation.mutateAsync(row);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${row.full_name}: ${error.message}`);
      }
    }

    setImportResults(results);
    queryClient.invalidateQueries({ queryKey: ["admin-players"] });
    setBulkText("");
    setIsSubmitting(false);

    toast({
      title: `Import complete: ${results.success} added, ${results.failed} failed`,
      variant: results.failed === 0 ? "default" : "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">Season 1 Players Import</h1>
        <p className="text-muted-foreground mt-1">Add players to Season 1 (2025)</p>
      </div>

      {/* Manual Add */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Player Manually
          </CardTitle>
          <CardDescription>Enter player details one at a time</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="player_name">Full Name</Label>
                <Input
                  id="player_name"
                  placeholder="John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="player_role">Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger id="player_role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="batsman">Batsman</SelectItem>
                    <SelectItem value="bowler">Bowler</SelectItem>
                    <SelectItem value="all_rounder">All-Rounder</SelectItem>
                    <SelectItem value="wicket_keeper">Wicket Keeper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="player_team">Current Team</Label>
              <Select value={newTeam} onValueChange={setNewTeam}>
                <SelectTrigger id="player_team">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Bulk Import */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            Bulk Import
          </CardTitle>
          <CardDescription>Paste CSV data (Full Name, Role, Team Name)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk_data">CSV Data</Label>
            <Textarea
              id="bulk_data"
              placeholder={`John Doe, batsman, Team 1
Jane Smith, bowler, Team 2
Mike Johnson, all_rounder, Team 1`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Format: Full Name, Role (batsman/bowler/all_rounder/wicket_keeper), Team Name
            </p>
          </div>

          <Button onClick={handleBulkImport} disabled={isSubmitting} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            Import Players
          </Button>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResults && (
        <Card className={importResults.failed === 0 ? "border-green-500/30" : "border-amber-500/30"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResults.failed === 0 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Import Successful
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Import Completed with Errors
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-500">{importResults.success}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-amber-500">{importResults.failed}</p>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Errors:</p>
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-1">
                  {importResults.errors.map((error, idx) => (
                    <p key={idx} className="text-xs text-destructive">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setImportResults(null)}
              className="w-full"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-border/50 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Import Format Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Manual Add:</strong> Fill in the form to add one player at a time.
          </p>
          <p>
            <strong>Bulk Import:</strong> Paste CSV data with the following columns:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Full Name (e.g., "John Doe")</li>
            <li>Role (batsman, bowler, all_rounder, wicket_keeper)</li>
            <li>Team Name (must match an existing team)</li>
          </ul>
          <p className="mt-4 font-mono text-xs bg-background/50 p-2 rounded">
            Example:<br />
            John Doe, batsman, Team 1<br />
            Jane Smith, bowler, Team 2
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
