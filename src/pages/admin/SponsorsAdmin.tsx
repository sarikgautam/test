import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSeason } from "@/hooks/useSeason";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  tier: string;
  description: string | null;
  is_active: boolean;
  season_id: string | null;
  display_order: number;
}

const TIERS = [
  { value: "title", label: "Title Sponsor" },
  { value: "platinum", label: "Platinum" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "bronze", label: "Bronze" },
];

export default function SponsorsAdmin() {
  const queryClient = useQueryClient();
  const { selectedSeasonId } = useSeason();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    website: "",
    tier: "bronze",
    description: "",
    is_active: true,
    display_order: 0,
  });

  const { data: sponsors = [], isLoading } = useQuery({
    queryKey: ["sponsors", selectedSeasonId],
    queryFn: async () => {
      const query = supabase
        .from("sponsors")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (selectedSeasonId) {
        query.or(`season_id.eq.${selectedSeasonId},season_id.is.null`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Sponsor[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("sponsors").insert({
        ...data,
        season_id: selectedSeasonId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      toast.success("Sponsor added successfully");
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("sponsors").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      toast.success("Sponsor updated successfully");
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sponsors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      toast.success("Sponsor deleted successfully");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("sponsors")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Failed to upload logo");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("sponsors")
      .getPublicUrl(fileName);

    setFormData({ ...formData, logo_url: urlData.publicUrl });
    setUploading(false);
    toast.success("Logo uploaded");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      logo_url: "",
      website: "",
      tier: "bronze",
      description: "",
      is_active: true,
      display_order: 0,
    });
    setEditingSponsor(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      logo_url: sponsor.logo_url || "",
      website: sponsor.website || "",
      tier: sponsor.tier,
      description: sponsor.description || "",
      is_active: sponsor.is_active,
      display_order: sponsor.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSponsor) {
      updateMutation.mutate({ id: editingSponsor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "title": return "bg-purple-500/20 text-purple-400";
      case "platinum": return "bg-slate-300/20 text-slate-300";
      case "gold": return "bg-yellow-500/20 text-yellow-400";
      case "silver": return "bg-gray-400/20 text-gray-400";
      default: return "bg-orange-700/20 text-orange-400";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">Manage Sponsors</h1>
        <p className="text-muted-foreground mt-1">Add and manage tournament sponsors</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sponsors</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" /> Add Sponsor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingSponsor ? "Edit Sponsor" : "Add Sponsor"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <Input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                  {formData.logo_url && (
                    <img src={formData.logo_url} alt="Logo preview" className="h-16 w-auto object-contain mt-2" />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tier *</Label>
                  <Select value={formData.tier} onValueChange={(v) => setFormData({ ...formData, tier: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIERS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                  <Label>Active</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingSponsor ? "Update" : "Add"} Sponsor
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : sponsors.length === 0 ? (
            <p className="text-muted-foreground">No sponsors yet. Add your first sponsor.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsors.map((sponsor) => (
                  <TableRow key={sponsor.id}>
                    <TableCell>
                      {sponsor.logo_url ? (
                        <img src={sponsor.logo_url} alt={sponsor.name} className="h-10 w-auto object-contain" />
                      ) : (
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center text-xs">N/A</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {sponsor.name}
                        {sponsor.website && (
                          <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${getTierColor(sponsor.tier)}`}>
                        {TIERS.find((t) => t.value === sponsor.tier)?.label || sponsor.tier}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={sponsor.is_active ? "text-green-500" : "text-muted-foreground"}>
                        {sponsor.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>{sponsor.display_order}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(sponsor)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(sponsor.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
