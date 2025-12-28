import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSeason } from "@/hooks/useSeason";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  XCircle, 
  Link2, 
  User, 
  Clock, 
  Search,
  AlertTriangle,
  Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface PendingRegistration {
  id: string;
  player_id: string;
  season_id: string;
  registration_status: string;
  created_at: string;
  player: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    role: string;
    photo_url: string | null;
    current_team: string | null;
    date_of_birth: string | null;
    address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_email: string | null;
    payment_receipt_url: string | null;
  };
}

interface PotentialMatch {
  id: string;
  full_name: string;
  email: string;
  role: string;
  similarity: number;
}

// Simple fuzzy matching function
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Split into words and check overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matchingWords = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) {
        matchingWords++;
        break;
      }
    }
  }
  
  const maxWords = Math.max(words1.length, words2.length);
  return matchingWords / maxWords;
}

export default function RegistrationReviewAdmin() {
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedSeasonId } = useSeason();

  // Fetch pending registrations
  const { data: pendingRegistrations, isLoading } = useQuery({
    queryKey: ["pending-registrations", selectedSeasonId],
    queryFn: async () => {
      if (!selectedSeasonId) return [];
      
      const { data, error } = await supabase
        .from("player_season_registrations")
        .select(`
          id,
          player_id,
          season_id,
          registration_status,
          created_at,
          player:players(id, full_name, email, phone, role, photo_url, current_team, date_of_birth, address, emergency_contact_name, emergency_contact_phone, emergency_contact_email, payment_receipt_url)
        `)
        .eq("season_id", selectedSeasonId)
        .eq("registration_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as PendingRegistration[];
    },
    enabled: !!selectedSeasonId,
  });

  // Fetch all players for matching
  const { data: allPlayers } = useQuery({
    queryKey: ["all-players-for-matching"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, full_name, email, role");
      if (error) throw error;
      return data;
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const { error } = await supabase
        .from("player_season_registrations")
        .update({ registration_status: "approved" })
        .eq("id", registrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-registrations"] });
      toast({ title: "Registration approved" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to approve", description: error.message, variant: "destructive" });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const { error } = await supabase
        .from("player_season_registrations")
        .update({ registration_status: "rejected" })
        .eq("id", registrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-registrations"] });
      toast({ title: "Registration rejected" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to reject", description: error.message, variant: "destructive" });
    },
  });

  // Link to existing player mutation
  const linkMutation = useMutation({
    mutationFn: async ({ registrationId, existingPlayerId, newPlayerId }: { 
      registrationId: string; 
      existingPlayerId: string; 
      newPlayerId: string;
    }) => {
      // Get new player data to merge
      const { data: newPlayerData, error: fetchError } = await supabase
        .from("players")
        .select("*")
        .eq("id", newPlayerId)
        .single();
      
      if (fetchError) throw fetchError;

      // Update existing player with new data (merge)
      const { error: updateError } = await supabase
        .from("players")
        .update({
          phone: newPlayerData.phone,
          date_of_birth: newPlayerData.date_of_birth,
          address: newPlayerData.address,
          emergency_contact_name: newPlayerData.emergency_contact_name,
          emergency_contact_phone: newPlayerData.emergency_contact_phone,
          emergency_contact_email: newPlayerData.emergency_contact_email,
          batting_style: newPlayerData.batting_style,
          bowling_style: newPlayerData.bowling_style,
          photo_url: newPlayerData.photo_url || undefined,
          payment_receipt_url: newPlayerData.payment_receipt_url || undefined,
          email: newPlayerData.email, // Update email to real one
        })
        .eq("id", existingPlayerId);

      if (updateError) throw updateError;

      // Update registration to point to existing player
      const { error: regError } = await supabase
        .from("player_season_registrations")
        .update({ 
          player_id: existingPlayerId,
          registration_status: "approved"
        })
        .eq("id", registrationId);

      if (regError) throw regError;

      // Delete the duplicate new player
      const { error: deleteError } = await supabase
        .from("players")
        .delete()
        .eq("id", newPlayerId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["all-players-for-matching"] });
      setIsMatchDialogOpen(false);
      toast({ title: "Player linked successfully", description: "Registration merged with existing player" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to link", description: error.message, variant: "destructive" });
    },
  });

  const findPotentialMatches = (registration: PendingRegistration) => {
    if (!allPlayers) return [];
    
    const matches: PotentialMatch[] = [];
    const currentName = registration.player.full_name;
    
    for (const player of allPlayers) {
      // Skip the same player
      if (player.id === registration.player_id) continue;
      
      const similarity = calculateSimilarity(currentName, player.full_name);
      if (similarity >= 0.5) {
        matches.push({
          ...player,
          similarity,
        });
      }
    }
    
    return matches.sort((a, b) => b.similarity - a.similarity);
  };

  const handleShowMatches = (registration: PendingRegistration) => {
    setSelectedRegistration(registration);
    const matches = findPotentialMatches(registration);
    setPotentialMatches(matches);
    setIsMatchDialogOpen(true);
  };

  const handleShowDetails = (registration: PendingRegistration) => {
    setSelectedRegistration(registration);
    setIsDetailsDialogOpen(true);
  };

  const filteredRegistrations = pendingRegistrations?.filter(reg =>
    reg.player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.player.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "batsman": return "bg-blue-500/20 text-blue-400";
      case "bowler": return "bg-green-500/20 text-green-400";
      case "all_rounder": return "bg-purple-500/20 text-purple-400";
      case "wicket_keeper": return "bg-amber-500/20 text-amber-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">Registration Review</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve pending player registrations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{pendingRegistrations?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Pending Registrations</CardTitle>
          <CardDescription>
            Review each registration and either approve, reject, or link to an existing player
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRegistrations?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pending registrations to review</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Matches</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations?.map((reg) => {
                  const matches = findPotentialMatches(reg);
                  const hasMatches = matches.length > 0;
                  
                  return (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {reg.player.photo_url ? (
                            <img 
                              src={reg.player.photo_url} 
                              alt={reg.player.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{reg.player.full_name}</p>
                            <p className="text-sm text-muted-foreground">{reg.player.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(reg.player.role)}>
                          {reg.player.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(reg.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {hasMatches ? (
                          <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {matches.length} potential
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500/50 text-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            No duplicates
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowDetails(reg)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {hasMatches && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShowMatches(reg)}
                              className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                            >
                              <Link2 className="w-4 h-4 mr-1" />
                              Link
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveMutation.mutate(reg.id)}
                            disabled={approveMutation.isPending}
                            className="border-green-500/50 text-green-500 hover:bg-green-500/10"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectMutation.mutate(reg.id)}
                            disabled={rejectMutation.isPending}
                            className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Match Dialog */}
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Potential Duplicate Players</DialogTitle>
            <DialogDescription>
              {selectedRegistration?.player.full_name} may already exist in the system. 
              Link to merge their data or approve as new player.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {potentialMatches.map((match) => (
                <Card key={match.id} className="border-border/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{match.full_name}</p>
                        <p className="text-sm text-muted-foreground">{match.email}</p>
                        <Badge className={`mt-1 ${getRoleBadgeColor(match.role)}`}>
                          {match.role.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {Math.round(match.similarity * 100)}% match
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => selectedRegistration && linkMutation.mutate({
                            registrationId: selectedRegistration.id,
                            existingPlayerId: match.id,
                            newPlayerId: selectedRegistration.player_id,
                          })}
                          disabled={linkMutation.isPending}
                        >
                          <Link2 className="w-4 h-4 mr-1" />
                          Link & Merge
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedRegistration) {
                  approveMutation.mutate(selectedRegistration.id);
                  setIsMatchDialogOpen(false);
                }
              }}
            >
              Approve as New Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
          </DialogHeader>
          
          {selectedRegistration && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedRegistration.player.photo_url ? (
                  <img 
                    src={selectedRegistration.player.photo_url} 
                    alt={selectedRegistration.player.full_name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold">{selectedRegistration.player.full_name}</h3>
                  <Badge className={getRoleBadgeColor(selectedRegistration.player.role)}>
                    {selectedRegistration.player.role.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedRegistration.player.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedRegistration.player.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {selectedRegistration.player.date_of_birth 
                      ? format(new Date(selectedRegistration.player.date_of_birth), "MMM d, yyyy")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Team</p>
                  <p className="font-medium">{selectedRegistration.player.current_team || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedRegistration.player.address || "N/A"}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Emergency Contact</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedRegistration.player.emergency_contact_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedRegistration.player.emergency_contact_phone || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedRegistration.player.emergency_contact_email || "N/A"}</p>
                  </div>
                </div>
              </div>

              {selectedRegistration.player.payment_receipt_url && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Payment Receipt</h4>
                  <a 
                    href={selectedRegistration.player.payment_receipt_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img 
                      src={selectedRegistration.player.payment_receipt_url} 
                      alt="Payment Receipt" 
                      className="w-full h-auto rounded-lg border border-border hover:opacity-80 transition-opacity"
                    />
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => window.open(selectedRegistration.player.payment_receipt_url!, '_blank')}
                  >
                    View Full Size
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
