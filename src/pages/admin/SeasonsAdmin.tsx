import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Calendar, CheckCircle2 } from "lucide-react";

// Helper functions to convert between UTC and AEST
const convertUTCtoAEST = (utcDateString: string | null): string => {
  if (!utcDateString) return "";
  const date = new Date(utcDateString);
  // AEST is UTC+10
  const aestOffset = 10 * 60; // 10 hours in minutes
  const localOffset = date.getTimezoneOffset(); // Browser's offset from UTC in minutes (negative for timezones ahead of UTC)
  const totalOffset = aestOffset + localOffset; // Total adjustment needed
  const aestDate = new Date(date.getTime() + totalOffset * 60 * 1000);
  return aestDate.toISOString().slice(0, 16);
};

const convertAESTtoUTC = (aestDateString: string): string | null => {
  if (!aestDateString) return null;
  const date = new Date(aestDateString);
  // AEST is UTC+10, so subtract 10 hours to get UTC
  const aestOffset = 10 * 60; // 10 hours in minutes
  const localOffset = date.getTimezoneOffset();
  const totalOffset = aestOffset + localOffset;
  const utcDate = new Date(date.getTime() - totalOffset * 60 * 1000);
  return utcDate.toISOString();
};

interface Season {
  id: string;
  name: string;
  year: number;
  start_date: string | null;
  end_date: string | null;
  registration_start_date: string | null;
  registration_end_date: string | null;
  is_active: boolean;
  registration_open: boolean;
  auction_date: string | null;
  countdown_description?: string | null;
  created_at: string;
}

export default function SeasonsAdmin() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
    registration_start_date: "",
    registration_end_date: "",
    auction_date: "",
    is_active: false,
    registration_open: false,
    countdown_description: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: seasons, isLoading } = useQuery({
    queryKey: ["admin-seasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .order("year", { ascending: false });
      if (error) throw error;
      return data as Season[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("seasons").insert({
        name: data.name,
        year: data.year,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        registration_start_date: convertAESTtoUTC(data.registration_start_date),
        registration_end_date: convertAESTtoUTC(data.registration_end_date),
        auction_date: data.auction_date || null,
        is_active: data.is_active,
        registration_open: data.registration_open,
        countdown_description: data.countdown_description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-seasons"] });
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      toast({ title: "Season created successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error creating season", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("seasons")
        .update({
          name: data.name,
          year: data.year,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          registration_start_date: convertAESTtoUTC(data.registration_start_date),
          registration_end_date: convertAESTtoUTC(data.registration_end_date),
          auction_date: data.auction_date || null,
          is_active: data.is_active,
          registration_open: data.registration_open,
          countdown_description: data.countdown_description || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-seasons"] });
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      toast({ title: "Season updated successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error updating season", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("seasons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-seasons"] });
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      toast({ title: "Season deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting season", description: error.message, variant: "destructive" });
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, set all seasons to inactive
      await supabase.from("seasons").update({ is_active: false });
      // Then set the selected season as active
      const { error } = await supabase.from("seasons").update({ is_active: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-seasons"] });
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      queryClient.invalidateQueries({ queryKey: ["active-season"] });
      toast({ title: "Active season updated" });
    },
    onError: (error) => {
      toast({ title: "Error setting active season", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSeason) {
      updateMutation.mutate({ id: editingSeason.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      year: new Date().getFullYear(),
      start_date: "",
      end_date: "",
      registration_start_date: "",
      registration_end_date: "",
      auction_date: "",
      is_active: false,
      registration_open: false,
      countdown_description: "",
    });
    setEditingSeason(null);
    setIsOpen(false);
  };

  const handleEdit = (season: Season) => {
    setEditingSeason(season);
    setFormData({
      name: season.name,
      year: season.year,
      start_date: season.start_date?.slice(0, 10) || "",
      end_date: season.end_date?.slice(0, 10) || "",
      registration_start_date: convertUTCtoAEST(season.registration_start_date),
      registration_end_date: convertUTCtoAEST(season.registration_end_date),
      auction_date: season.auction_date?.slice(0, 16) || "",
      is_active: season.is_active,
      registration_open: season.registration_open,
      countdown_description: season.countdown_description || "",
    });
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-gradient-gold">Seasons Management</h1>
          <p className="text-muted-foreground mt-1">Manage tournament seasons</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Season
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSeason ? "Edit Season" : "Add New Season"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Season Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Season 3"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registration_start_date">Registration Start Date (AEST)</Label>
                  <Input
                    id="registration_start_date"
                    type="datetime-local"
                    value={formData.registration_start_date}
                    onChange={(e) => setFormData({ ...formData, registration_start_date: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Australian Eastern Standard Time</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration_end_date">Registration End Date (AEST)</Label>
                  <Input
                    id="registration_end_date"
                    type="datetime-local"
                    value={formData.registration_end_date}
                    onChange={(e) => setFormData({ ...formData, registration_end_date: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Australian Eastern Standard Time</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auction_date">Auction Date</Label>
                <Input
                  id="auction_date"
                  type="datetime-local"
                  value={formData.auction_date}
                  onChange={(e) => setFormData({ ...formData, auction_date: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active Season</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="registration_open">Registration Open</Label>
                <Switch
                  id="registration_open"
                  checked={formData.registration_open}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, registration_open: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="countdown_description">Countdown Description</Label>
                <Input
                  id="countdown_description"
                  value={formData.countdown_description}
                  onChange={(e) => setFormData({ ...formData, countdown_description: e.target.value })}
                  placeholder="Get ready for the most exciting cricket tournament!"
                />
                <p className="text-sm text-muted-foreground">
                  Appears above the homepage countdown; leave blank to use defaults.
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingSeason ? "Update" : "Create"} Season
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            All Seasons
          </CardTitle>
          <CardDescription>View and manage all tournament seasons</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seasons?.map((season) => (
                <TableRow key={season.id}>
                  <TableCell className="font-medium">{season.name}</TableCell>
                  <TableCell>{season.year}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {season.start_date
                      ? new Date(season.start_date).toLocaleDateString()
                      : "N/A"}{" "}
                    -{" "}
                    {season.end_date ? new Date(season.end_date).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {season.is_active && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </Badge>
                      )}
                      {season.registration_open && (
                        <Badge variant="secondary">Registration Open</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!season.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveMutation.mutate(season.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(season)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure? This will delete the season and all related data."
                            )
                          ) {
                            deleteMutation.mutate(season.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
