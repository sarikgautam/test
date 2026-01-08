import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Trash2, Users, Plus, Eye, User, Edit, RotateCcw } from "lucide-react";
import { useSeason } from "@/hooks/useSeason";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

interface PlayerWithRegistration extends Player {
  registration?: {
    id: string;
    auction_status: string;
    registration_status: string;
    sold_price: number | null;
    team_id: string | null;
    base_price: number;
    residency_type: string | null;
  } | null;
}

export default function PlayersAdmin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<string>("batsman");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithRegistration | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Player>>({});
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { selectedSeasonId } = useSeason();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players, isLoading } = useQuery({
    queryKey: ["admin-players", selectedSeasonId],
    queryFn: async () => {
      // Get all players that have registrations for this season
      const { data: registrations, error: regError } = await supabase
        .from("player_season_registrations")
        .select(`
          id,
          auction_status,
          registration_status,
          sold_price,
          team_id,
          base_price,
          player_id,
          residency_type,
          players:player_id(*)
        `)
        .eq("season_id", selectedSeasonId!)
        .order("created_at", { ascending: false });
      
      if (regError) throw regError;
      
      // Transform the data
      return registrations?.map((reg) => ({
        ...(reg.players as any),
        registration: {
          id: reg.id,
          auction_status: reg.auction_status,
          registration_status: reg.registration_status,
          sold_price: reg.sold_price,
          team_id: reg.team_id,
          base_price: reg.base_price,
          residency_type: reg.residency_type,
        },
      })) as PlayerWithRegistration[];
    },
    enabled: !!selectedSeasonId,
  });

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*");
      if (error) throw error;
      return data as Team[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (playerId: string) => {
      // Delete the registration for this season
      const { error } = await supabase
        .from("player_season_registrations")
        .delete()
        .eq("player_id", playerId)
        .eq("season_id", selectedSeasonId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-players", selectedSeasonId] });
      toast({ title: "Player registration deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting player", description: error.message, variant: "destructive" });
    },
  });

  const filteredPlayers = players?.filter((player) => {
    const matchesSearch =
      player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || player.registration?.auction_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getTeamName = (teamId: string | null | undefined) => {
    if (!teamId) return "-";
    return teams?.find((t) => t.id === teamId)?.name || "-";
  };

  const roleLabels: Record<string, string> = {
    batsman: "Batsman",
    bowler: "Bowler",
    all_rounder: "All-Rounder",
    wicket_keeper: "Wicket Keeper",
  };

  const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
    registered: "secondary",
    sold: "default",
    unsold: "destructive",
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSeasonId) throw new Error("No season selected");
      if (!newName.trim()) throw new Error("Full name is required");

      // Generate a placeholder email client-side (no DB trigger dependency)
      const slugBase = newName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const uid = Math.random().toString(36).slice(2, 10);
      const placeholderEmail = `${slugBase || "player"}.${uid}@gcnpl.local`;

      // Insert player with name + role + generated email
      const { data: player, error: playerErr } = await supabase
        .from("players")
        .insert({
          full_name: newName.trim(),
          role: newRole as "batsman" | "bowler" | "all_rounder" | "wicket_keeper",
          original_season_id: selectedSeasonId,
          email: placeholderEmail,
        })
        .select("*")
        .single();
      if (playerErr) throw playerErr;

      // Create season registration so the list shows this player
      const { error: regErr } = await supabase
        .from("player_season_registrations")
        .insert({
          player_id: player.id,
          season_id: selectedSeasonId,
          auction_status: "registered",
          base_price: player.base_price ?? 20,
        });
      if (regErr) throw regErr;

      return player;
    },
    onSuccess: () => {
      setNewName("");
      setNewRole("batsman");
      queryClient.invalidateQueries({ queryKey: ["admin-players", selectedSeasonId] });
      toast({ title: "Player added", description: "Player registered for the current season." });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add player", description: error.message, variant: "destructive" });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlayer) throw new Error("No player selected");
      
      const { error } = await supabase
        .from("players")
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          phone: editForm.phone,
          date_of_birth: editForm.date_of_birth,
          address: editForm.address,
          current_team: editForm.current_team,
          role: editForm.role as "batsman" | "bowler" | "all_rounder" | "wicket_keeper",
          batting_style: editForm.batting_style,
          bowling_style: editForm.bowling_style,
          emergency_contact_name: editForm.emergency_contact_name,
          emergency_contact_phone: editForm.emergency_contact_phone,
          emergency_contact_email: editForm.emergency_contact_email,
        })
        .eq("id", selectedPlayer.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-players", selectedSeasonId] });
      setIsEditDialogOpen(false);
      toast({ title: "Player updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update player", description: error.message, variant: "destructive" });
    },
  });

  const reAuctionMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const { error } = await supabase
        .from("player_season_registrations")
        .update({
          auction_status: "registered",
          sold_price: null,
          team_id: null,
        })
        .eq("id", registrationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-players", selectedSeasonId] });
      queryClient.invalidateQueries({ queryKey: ["auction-players", selectedSeasonId] });
      queryClient.invalidateQueries({ queryKey: ["auction-sold-players", selectedSeasonId] });
      queryClient.invalidateQueries({ queryKey: ["auction-hold-players", selectedSeasonId] });
      toast({ title: "Player sent to re-auction", description: "Player is now available for auction again." });
    },
    onError: (error: any) => {
      toast({ title: "Failed to re-auction player", description: error.message, variant: "destructive" });
    },
  });

  const handleEditClick = (player: PlayerWithRegistration) => {
    setSelectedPlayer(player);
    setEditForm({
      full_name: player.full_name,
      email: player.email,
      phone: player.phone || "",
      date_of_birth: player.date_of_birth || "",
      address: player.address || "",
      current_team: player.current_team || "",
      role: player.role,
      batting_style: player.batting_style || "",
      bowling_style: player.bowling_style || "",
      emergency_contact_name: player.emergency_contact_name || "",
      emergency_contact_phone: player.emergency_contact_phone || "",
      emergency_contact_email: player.emergency_contact_email || "",
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">Players Management</h1>
        <p className="text-muted-foreground mt-1">
          View and manage registered players for the auction
        </p>
      </div>

      {/* Add Player */}
      <div className="border rounded-lg border-border p-4 space-y-3">
        <h2 className="font-display text-xl">Add Player</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Full name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="batsman">Batsman</SelectItem>
              <SelectItem value="bowler">Bowler</SelectItem>
              <SelectItem value="all_rounder">All-Rounder</SelectItem>
              <SelectItem value="wicket_keeper">Wicket Keeper</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setIsSubmitting(true);
              addMutation.mutate();
            }}
            disabled={isSubmitting || !newName.trim()}
          >
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Email is generated automatically for admin imports. Player appears under the current season.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Players</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="unsold">Unsold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Residency</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Auction Status</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Sold Price</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers?.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{player.email}</TableCell>
                  <TableCell>{roleLabels[player.role]}</TableCell>
                  <TableCell>
                    {player.registration?.residency_type && player.registration.residency_type !== "other-state" && (
                      <Badge className={
                        player.registration.residency_type === "gc-tweed"
                          ? "bg-blue-500/20 text-blue-600 border-blue-500/30"
                          : "bg-purple-500/20 text-purple-600 border-purple-500/30"
                      }>
                        {player.registration.residency_type === "gc-tweed" ? "🏆 GC" : "🏘️ QLD"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>${player.registration?.base_price?.toLocaleString() || player.base_price?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        player.registration?.registration_status === "approved" ? "default" :
                        player.registration?.registration_status === "pending" ? "secondary" :
                        "destructive"
                      }
                    >
                      {player.registration?.registration_status || "pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[player.registration?.auction_status || "registered"]}>
                      {player.registration?.auction_status || "registered"}
                    </Badge>
                  </TableCell>
                  <TableCell>{getTeamName(player.registration?.team_id)}</TableCell>
                  <TableCell>
                    {player.registration?.sold_price ? `$${player.registration.sold_price.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedPlayer(player);
                          setIsDetailsDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditClick(player)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {player.registration && ["sold", "unsold", "hold"].includes(player.registration.auction_status) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-blue-500 hover:text-blue-600"
                          onClick={() => reAuctionMutation.mutate(player.registration!.id)}
                          title="Send to re-auction"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setPlayerToDelete(player.id);
                          setIsDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPlayers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    No players found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Showing {filteredPlayers?.length || 0} of {players?.length || 0} players
      </div>

      {/* Player Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Player Details</DialogTitle>
          </DialogHeader>
          
          {selectedPlayer && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedPlayer.photo_url ? (
                  <img 
                    src={selectedPlayer.photo_url} 
                    alt={selectedPlayer.full_name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold">{selectedPlayer.full_name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={
                      selectedPlayer.role === "batsman" ? "bg-blue-500" :
                      selectedPlayer.role === "bowler" ? "bg-green-500" :
                      selectedPlayer.role === "all_rounder" ? "bg-purple-500" :
                      "bg-orange-500"
                    }>
                      {selectedPlayer.role.replace("_", " ")}
                    </Badge>
                    {selectedPlayer.registration?.residency_type && selectedPlayer.registration.residency_type !== "other-state" && (
                      <Badge className={
                        selectedPlayer.registration.residency_type === "gc-tweed"
                          ? "bg-blue-500/20 text-blue-600 border-blue-500/30"
                          : "bg-purple-500/20 text-purple-600 border-purple-500/30"
                      }>
                        {selectedPlayer.registration.residency_type === "gc-tweed" ? "🏆 GC" : "🏘️ QLD"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedPlayer.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedPlayer.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {selectedPlayer.date_of_birth 
                      ? format(new Date(selectedPlayer.date_of_birth), "MMM d, yyyy")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Team</p>
                  <p className="font-medium">{selectedPlayer.current_team || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedPlayer.address || "N/A"}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Emergency Contact</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedPlayer.emergency_contact_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedPlayer.emergency_contact_phone || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedPlayer.emergency_contact_email || "N/A"}</p>
                  </div>
                </div>
              </div>

              {selectedPlayer.payment_receipt_url && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Payment Receipt</h4>
                  <a 
                    href={selectedPlayer.payment_receipt_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img 
                      src={selectedPlayer.payment_receipt_url} 
                      alt="Payment Receipt" 
                      className="w-full h-auto rounded-lg border border-border hover:opacity-80 transition-opacity"
                    />
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => window.open(selectedPlayer.payment_receipt_url!, '_blank')}
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

      {/* Edit Player Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>Update player information</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={editForm.full_name || ""}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editForm.phone || ""}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={editForm.date_of_birth || ""}
                    onChange={(e) => setEditForm({...editForm, date_of_birth: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Current Team</Label>
                  <Input
                    value={editForm.current_team || ""}
                    onChange={(e) => setEditForm({...editForm, current_team: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Textarea
                    value={editForm.address || ""}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Playing Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Playing Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role *</Label>
                  <Select 
                    value={editForm.role || "batsman"} 
                    onValueChange={(value) => setEditForm({...editForm, role: value as any})}
                  >
                    <SelectTrigger>
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
                <div>
                  <Label>Batting Style</Label>
                  <Input
                    value={editForm.batting_style || ""}
                    onChange={(e) => setEditForm({...editForm, batting_style: e.target.value})}
                    placeholder="e.g., Right-handed"
                  />
                </div>
                <div>
                  <Label>Bowling Style</Label>
                  <Input
                    value={editForm.bowling_style || ""}
                    onChange={(e) => setEditForm({...editForm, bowling_style: e.target.value})}
                    placeholder="e.g., Right-arm fast"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Name</Label>
                  <Input
                    value={editForm.emergency_contact_name || ""}
                    onChange={(e) => setEditForm({...editForm, emergency_contact_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    value={editForm.emergency_contact_phone || ""}
                    onChange={(e) => setEditForm({...editForm, emergency_contact_phone: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={editForm.emergency_contact_email || ""}
                    onChange={(e) => setEditForm({...editForm, emergency_contact_email: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => editMutation.mutate()}
              disabled={editMutation.isPending}
            >
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this player? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (playerToDelete) {
                deleteMutation.mutate(playerToDelete);
                setIsDeleteConfirmOpen(false);
              }
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
