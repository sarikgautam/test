import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";

interface SupportClub {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  is_active: boolean;
  display_order: number;
}

interface FormData {
  name: string;
  logo_url: string;
  website_url: string;
  is_active: boolean;
  display_order: number;
}

export default function FooterAdmin() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<SupportClub | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    logo_url: "",
    website_url: "",
    is_active: true,
    display_order: 1,
  });

  const { data: supportClubs, isLoading } = useQuery({
    queryKey: ["support-clubs-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_club")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as SupportClub[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editingClub) {
        const { error } = await supabase
          .from("support_club")
          .update(data)
          .eq("id", editingClub.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("support_club").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-clubs-admin"] });
      queryClient.invalidateQueries({ queryKey: ["support-clubs"] });
      toast.success(editingClub ? "Support club updated" : "Support club added");
      handleCloseDialog();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("support_club").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-clubs-admin"] });
      queryClient.invalidateQueries({ queryKey: ["support-clubs"] });
      toast.success("Support club deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleEdit = (club: SupportClub) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      logo_url: club.logo_url,
      website_url: club.website_url || "",
      is_active: club.is_active,
      display_order: club.display_order,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClub(null);
    setFormData({
      name: "",
      logo_url: "",
      website_url: "",
      is_active: true,
      display_order: 1,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-gradient-gold">Footer Management</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-gradient-gold">Footer Management</h1>
          <p className="text-muted-foreground mt-1">Manage support clubs displayed in the footer</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" onClick={() => setEditingClub(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Support Club
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingClub ? "Edit" : "Add"} Support Club</DialogTitle>
              <DialogDescription>
                {editingClub ? "Update" : "Add a new"} support club information
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Club Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Gold Coast Gorkhas Cricket Club"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL (Optional)</Label>
                <Input
                  id="website_url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://goldcoastgorkhas.com.au"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({ ...formData, display_order: parseInt(e.target.value) })
                  }
                  min="1"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Clubs</CardTitle>
          <CardDescription>
            {supportClubs?.length || 0} support club(s) configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!supportClubs || supportClubs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No support clubs added yet</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supportClubs.map((club) => (
                    <TableRow key={club.id}>
                      <TableCell>
                        <img
                          src={club.logo_url}
                          alt={club.name}
                          className="h-10 w-auto object-contain"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{club.name}</TableCell>
                      <TableCell>
                        {club.website_url ? (
                          <a
                            href={club.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Visit
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{club.display_order}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            club.is_active
                              ? "bg-green-500/10 text-green-500"
                              : "bg-gray-500/10 text-gray-500"
                          }`}
                        >
                          {club.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(club)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(club.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
