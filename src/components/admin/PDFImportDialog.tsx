import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { parsePDFScorecard, type BattingStats, type ParsedScorecard } from "@/lib/pdfParser";
import { Upload, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Player {
  id: string;
  name: string;
}

interface PDFImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  homePlayers: Player[];
  awayPlayers: Player[];
  onImportComplete: (stats: any[]) => void;
}

interface MappedBattingStat extends BattingStats {
  playerId?: string;
  teamId?: string;
  matchStatus?: 'matched' | 'unmatched' | 'duplicate';
}

export function PDFImportDialog({
  open,
  onOpenChange,
  matchId,
  seasonId,
  homeTeamId,
  awayTeamId,
  homePlayers,
  awayPlayers,
  onImportComplete,
}: PDFImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedScorecard | null>(null);
  const [mappedStats, setMappedStats] = useState<MappedBattingStat[]>([]);
  const { toast } = useToast();

  const allPlayers = [...homePlayers, ...awayPlayers];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setParsed(null);
      setMappedStats([]);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleParsePDF = async () => {
    if (!file) return;

    setParsing(true);
    try {
      const result = await parsePDFScorecard(file);
      setParsed(result);

      // Auto-match players
      const allBattingStats = [
        ...result.innings1Batting,
        ...result.innings2Batting,
      ];

      const mapped: MappedBattingStat[] = allBattingStats.map((stat) => {
        // Try to find matching player
        const player = findMatchingPlayer(stat.playerName);
        
        return {
          ...stat,
          playerId: player?.id,
          teamId: player ? getPlayerTeamId(player.id) : undefined,
          matchStatus: player ? 'matched' : 'unmatched',
        };
      });

      setMappedStats(mapped);

      toast({
        title: "PDF parsed successfully",
        description: `Found ${allBattingStats.length} player stats`,
      });
    } catch (error) {
      console.error('PDF parsing error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error parsing PDF",
        description: `Could not extract scorecard data from PDF: ${errorMsg}`,
        variant: "destructive",
      });
    } finally {
      setParsing(false);
    }
  };

  const findMatchingPlayer = (name: string): Player | undefined => {
    const normalized = name.toLowerCase().replace(/\s+/g, '');
    return allPlayers.find((p) => 
      p.name.toLowerCase().replace(/\s+/g, '').includes(normalized) ||
      normalized.includes(p.name.toLowerCase().replace(/\s+/g, ''))
    );
  };

  const getPlayerTeamId = (playerId: string): string | undefined => {
    if (homePlayers.some(p => p.id === playerId)) return homeTeamId;
    if (awayPlayers.some(p => p.id === playerId)) return awayTeamId;
    return undefined;
  };

  const handlePlayerChange = (index: number, playerId: string) => {
    const updated = [...mappedStats];
    updated[index].playerId = playerId;
    updated[index].teamId = getPlayerTeamId(playerId);
    updated[index].matchStatus = 'matched';
    setMappedStats(updated);
  };

  const handleImport = () => {
    if (!parsed) return;

    console.log(`[PDFImportDialog] Importing stats for matchId: ${matchId}, seasonId: ${seasonId}`);

    // Filter out unmatched batting players
    const validBattingStats = mappedStats.filter(s => s.playerId && s.teamId);

    // Map bowling stats and auto-match bowlers
    const allBowlingStats = [
      ...parsed.innings1Bowling,
      ...parsed.innings2Bowling,
    ];

    const validBowlingStats = allBowlingStats
      .map(stat => {
        const player = findMatchingPlayer(stat.bowlerName);
        return player ? { ...stat, playerId: player.id } : null;
      })
      .filter(stat => stat !== null);

    const totalStats = validBattingStats.length + validBowlingStats.length;

    if (totalStats === 0) {
      toast({
        title: "No valid stats",
        description: "Please match at least one player before importing",
        variant: "destructive",
      });
      return;
    }

    // Convert batting stats with batting order
    const battingEntries = validBattingStats.map((stat, index) => {
      // Match bowler and fielder names to player IDs
      const bowlerPlayer = stat.dismissal?.bowler ? findMatchingPlayer(stat.dismissal.bowler) : undefined;
      const fielderPlayer = stat.dismissal?.fielder ? findMatchingPlayer(stat.dismissal.fielder) : undefined;
      
      return {
        player_id: stat.playerId,
        match_id: matchId,
        season_id: seasonId,
        runs_scored: stat.runs,
        balls_faced: stat.balls,
        fours: stat.fours,
        sixes: stat.sixes,
        wickets: 0,
        overs_bowled: 0,
        maidens: 0,
        runs_conceded: 0,
        catches: 0,
        stumpings: 0,
        run_outs: 0,
        dismissal_type: stat.dismissal?.type || null,
        bowler_id: bowlerPlayer?.id || null,
        fielder_id: fielderPlayer?.id || null,
        runout_by_id: null,
        dismissal_other_text: null,
        batting_order: index,  // Assign order based on PDF sequence (0 = first batter)
      };
    });

    // Convert bowling stats
    const bowlingEntries = validBowlingStats.map((stat) => ({
      player_id: stat!.playerId,
      match_id: matchId,
      season_id: seasonId,
      runs_scored: 0,
      balls_faced: 0,
      fours: 0,
      sixes: 0,
      wickets: stat!.wickets,
      overs_bowled: stat!.overs,
      maidens: stat!.maidens,
      runs_conceded: stat!.runs,
      catches: 0,
      stumpings: 0,
      run_outs: 0,
      dismissal_type: null,
      bowler_id: null,
      fielder_id: null,
      runout_by_id: null,
      dismissal_other_text: null,
      batting_order: null,
    }));

    // Merge batting and bowling stats for same players
    const mergedStats = new Map();
    
    [...battingEntries, ...bowlingEntries].forEach(entry => {
      const existing = mergedStats.get(entry.player_id);
      if (existing) {
        // Merge stats for the same player, keep batting_order from batting entry
        mergedStats.set(entry.player_id, {
          player_id: entry.player_id,
          match_id: matchId,
          season_id: seasonId,
          runs_scored: existing.runs_scored + entry.runs_scored,
          balls_faced: existing.balls_faced + entry.balls_faced,
          fours: existing.fours + entry.fours,
          sixes: existing.sixes + entry.sixes,
          wickets: existing.wickets + entry.wickets,
          overs_bowled: existing.overs_bowled + entry.overs_bowled,
          maidens: existing.maidens + entry.maidens,
          runs_conceded: existing.runs_conceded + entry.runs_conceded,
          catches: existing.catches + entry.catches,
          stumpings: existing.stumpings + entry.stumpings,
          run_outs: existing.run_outs + entry.run_outs,
          dismissal_type: existing.dismissal_type || entry.dismissal_type,
          bowler_id: existing.bowler_id || entry.bowler_id,
          fielder_id: existing.fielder_id || entry.fielder_id,
          runout_by_id: existing.runout_by_id || entry.runout_by_id,
          dismissal_other_text: existing.dismissal_other_text || entry.dismissal_other_text,
          batting_order: existing.batting_order !== undefined ? existing.batting_order : (entry.batting_order ?? 999),
        });
      } else {
        mergedStats.set(entry.player_id, entry);
      }
    });

    const finalStats = Array.from(mergedStats.values());

    onImportComplete(finalStats);
    onOpenChange(false);

    toast({
      title: "Import successful",
      description: `Imported ${finalStats.length} player stats (${validBattingStats.length} batting, ${validBowlingStats.length} bowling)`,
    });
  };

  const unmatchedCount = mappedStats.filter(s => s.matchStatus === 'unmatched').length;
  const matchedCount = mappedStats.filter(s => s.matchStatus === 'matched').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Scorecard from PDF</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="pdf-file">Select STUMPS Scorecard PDF</Label>
            <div className="flex gap-2">
              <Input
                id="pdf-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={parsing}
              />
              <Button
                onClick={handleParsePDF}
                disabled={!file || parsing}
                className="whitespace-nowrap"
              >
                {parsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Parse PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Match Info */}
          {parsed && (
            <Alert>
              <AlertDescription>
                <div className="space-y-1 text-sm">
                  <div><strong>Match:</strong> {parsed.matchInfo.team1} vs {parsed.matchInfo.team2}</div>
                  {parsed.matchInfo.dateTime && (
                    <div><strong>Date:</strong> {parsed.matchInfo.dateTime}</div>
                  )}
                  {parsed.matchInfo.venue && (
                    <div><strong>Venue:</strong> {parsed.matchInfo.venue}</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Summary */}
          {mappedStats.length > 0 && (
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{matchedCount} matched</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>{unmatchedCount} unmatched</span>
              </div>
            </div>
          )}

          {/* Player Mapping Table */}
          {mappedStats.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PDF Name</TableHead>
                    <TableHead>Match Player</TableHead>
                    <TableHead className="text-right">Runs</TableHead>
                    <TableHead className="text-right">Balls</TableHead>
                    <TableHead className="text-right">4s</TableHead>
                    <TableHead className="text-right">6s</TableHead>
                    <TableHead>How Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedStats.map((stat, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{stat.playerName}</TableCell>
                      <TableCell>
                        <Select
                          value={stat.playerId || ''}
                          onValueChange={(value) => handlePlayerChange(index, value)}
                        >
                          <SelectTrigger className={stat.matchStatus === 'unmatched' ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select player..." />
                          </SelectTrigger>
                          <SelectContent>
                            {allPlayers.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {player.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">{stat.runs}</TableCell>
                      <TableCell className="text-right">{stat.balls}</TableCell>
                      <TableCell className="text-right">{stat.fours}</TableCell>
                      <TableCell className="text-right">{stat.sixes}</TableCell>
                      <TableCell className="text-xs">
                        {stat.dismissal.type === 'not_out' ? (
                          <span className="text-green-600">not out</span>
                        ) : stat.dismissal.type === 'caught' ? (
                          `c ${stat.dismissal.fielder || '?'} b ${stat.dismissal.bowler || '?'}`
                        ) : stat.dismissal.type === 'bowled' ? (
                          `b ${stat.dismissal.bowler || '?'}`
                        ) : stat.dismissal.type === 'lbw' ? (
                          `lbw b ${stat.dismissal.bowler || '?'}`
                        ) : stat.dismissal.type === 'runout' ? (
                          `run out (${stat.dismissal.fielder || '?'})`
                        ) : stat.dismissal.type === 'stumped' ? (
                          `st ${stat.dismissal.fielder || '?'} b ${stat.dismissal.bowler || '?'}`
                        ) : (
                          stat.dismissal.type
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Action Buttons */}
          {mappedStats.length > 0 && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={matchedCount === 0}>
                Import {matchedCount} Stats
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
