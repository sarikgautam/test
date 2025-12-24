import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Users, Upload } from "lucide-react";
import { useActiveSeason } from "@/hooks/useSeason";

interface Team {
  id: string;
  name: string;
  short_name: string;
  owner_name: string | null;
  manager_name: string | null;
  description: string | null;
  captain_id: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  budget: number;
  remaining_budget: number;
}

interface Player {
  id: string;
  full_name: string;
  team_id: string | null;
}

export default function TeamsAdmin() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    owner_name: "",
    manager_name: "",
    description: "",
    captain_id: "",
    primary_color: "#1e3a8a",
    secondary_color: "#fbbf24",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeSeason } = useActiveSeason();

  const { data: teams, isLoading } = useQuery({
    queryKey: ["admin-teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Team[];
    },
  });

  // Fetch players for captain selection
  const { data: players } = useQuery({
    queryKey: ["admin-players-for-captain", activeSeason?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, full_name, team_id")
        .eq("auction_status", "sold")
        .order("full_name");
      if (error) throw error;
      return data as Player[];
    },
  });

  const uploadLogo = async (teamId: string, file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${teamId}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("player-photos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("player-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newTeam, error } = await supabase.from("teams").insert({
        name: data.name,
        short_name: data.short_name,
        owner_name: data.owner_name || null,
        manager_name: data.manager_name || null,
        description: data.description || null,
        captain_id: data.captain_id || null,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
      }).select().single();
      if (error) throw error;

      // Upload logo if provided
      if (logoFile && newTeam) {
        setUploading(true);
        try {
          const logoUrl = await uploadLogo(newTeam.id, logoFile);
          await supabase.from("teams").update({ logo_url: logoUrl }).eq("id", newTeam.id);
        } finally {
          setUploading(false);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      toast({ title: "Team created successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error creating team", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      // Upload logo if provided
      let logoUrl = editingTeam?.logo_url;
      if (logoFile) {
        setUploading(true);
        try {
          logoUrl = await uploadLogo(id, logoFile);
        } finally {
          setUploading(false);
        }
      }

      const { error } = await supabase
        .from("teams")
        .update({
          name: data.name,
          short_name: data.short_name,
          owner_name: data.owner_name || null,
          manager_name: data.manager_name || null,
          description: data.description || null,
          captain_id: data.captain_id || null,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          logo_url: logoUrl,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      toast({ title: "Team updated successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error updating team", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      toast({ title: "Team deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting team", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      short_name: "",
      owner_name: "",
      manager_name: "",
      description: "",
      captain_id: "",
      primary_color: "#1e3a8a",
      secondary_color: "#fbbf24",
    });
    setEditingTeam(null);
    setLogoFile(null);
    setIsOpen(false);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      short_name: team.short_name,
      owner_name: team.owner_name || "",
      manager_name: team.manager_name || "",
      description: team.description || "",
      captain_id: team.captain_id || "",
      primary_color: team.primary_color,
      secondary_color: team.secondary_color,
    });
    setLogoFile(null);
    setIsOpen(true);
  };

  // Get players that belong to this team (for captain selection)
  const getTeamPlayers = (teamId: string | undefined) => {
    if (!teamId) return [];
    return players?.filter(p => p.team_id === teamId) || [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeam) {
      updateMutation.mutate({ id: editingTeam.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-gradient-gold">Teams Management</h1>
          <p className="text-muted-foreground mt-1">Add, edit, and manage tournament teams</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Team
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTeam ? "Edit Team" : "Add New Team"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="short_name">Short Name (3 chars) *</Label>
                  <Input
                    id="short_name"
                    value={formData.short_name}
                    onChange={(e) => setFormData({ ...formData, short_name: e.target.value.toUpperCase().slice(0, 3) })}
                    maxLength={3}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner_name">Owner Name</Label>
                  <Input
                    id="owner_name"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    placeholder="Team owner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager_name">Manager Name</Label>
                  <Input
                    id="manager_name"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                    placeholder="Team manager"
                  />
                </div>
              </div>

              {editingTeam && (
                <div className="space-y-2">
                  <Label htmlFor="captain_id">Team Captain</Label>
                  <Select
                    value={formData.captain_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, captain_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select captain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No captain selected</SelectItem>
                      {getTeamPlayers(editingTeam.id).map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getTeamPlayers(editingTeam.id).length === 0 && (
                    <p className="text-xs text-muted-foreground">No players in this team yet</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Team Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description about the team..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Team Logo</Label>
                <div className="flex items-center gap-4">
                  {(editingTeam?.logo_url || logoFile) && (
                    <div className="w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted">
                      <img
                        src={logoFile ? URL.createObjectURL(logoFile) : editingTeam?.logo_url || ""}
                        alt="Team logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          {editingTeam?.logo_url || logoFile ? "Change Logo" : "Upload Logo"}
                        </span>
                      </Button>
                    </Label>
                    {logoFile && (
                      <p className="text-xs text-muted-foreground mt-1">{logoFile.name}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Uploading..." : editingTeam ? "Update Team" : "Create Team"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Colors</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams?.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {team.logo_url ? (
                        <img
                          src={team.logo_url}
                          alt={team.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{
                            backgroundColor: team.primary_color,
                            color: team.secondary_color,
                          }}
                        >
                          {team.short_name}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-xs text-muted-foreground">{team.short_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{team.owner_name || "-"}</TableCell>
                  <TableCell>{team.manager_name || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <div
                        className="w-6 h-6 rounded-full border border-border"
                        style={{ backgroundColor: team.primary_color }}
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-border"
                        style={{ backgroundColor: team.secondary_color }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    ${team.budget.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${team.remaining_budget.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(team)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(team.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {teams?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    No teams added yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
