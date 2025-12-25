import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSeason } from "@/hooks/useSeason";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star } from "lucide-react";

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  event_name: string | null;
  event_date: string | null;
  season_id: string | null;
  is_featured: boolean;
  display_order: number;
}

export default function GalleryAdmin() {
  const queryClient = useQueryClient();
  const { selectedSeasonId } = useSeason();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    event_name: "",
    event_date: "",
    is_featured: false,
    display_order: 0,
  });

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["gallery", selectedSeasonId],
    queryFn: async () => {
      const query = supabase
        .from("gallery")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (selectedSeasonId) {
        query.or(`season_id.eq.${selectedSeasonId},season_id.is.null`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("gallery").insert({
        ...data,
        event_date: data.event_date || null,
        season_id: selectedSeasonId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Image added successfully");
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("gallery").update({
        ...data,
        event_date: data.event_date || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Image updated successfully");
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Image deleted successfully");
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
      .from("gallery")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Failed to upload image");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("gallery")
      .getPublicUrl(fileName);

    setFormData({ ...formData, image_url: urlData.publicUrl });
    setUploading(false);
    toast.success("Image uploaded");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      event_name: "",
      event_date: "",
      is_featured: false,
      display_order: 0,
    });
    setEditingImage(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setFormData({
      title: image.title,
      description: image.description || "",
      image_url: image.image_url,
      event_name: image.event_name || "",
      event_date: image.event_date || "",
      is_featured: image.is_featured,
      display_order: image.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      toast.error("Please upload an image");
      return;
    }
    if (editingImage) {
      updateMutation.mutate({ id: editingImage.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">Manage Gallery</h1>
        <p className="text-muted-foreground mt-1">Upload and manage gallery images</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gallery Images</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" /> Add Image
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingImage ? "Edit Image" : "Add Image"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Image *</Label>
                  <Input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" className="h-32 w-auto object-cover mt-2 rounded" />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Event Name</Label>
                  <Input
                    value={formData.event_name}
                    onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                    placeholder="e.g., Season 2024 Finals"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Event Date</Label>
                  <Input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
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
                    checked={formData.is_featured}
                    onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                  />
                  <Label>Featured (show on homepage)</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || uploading}>
                    {editingImage ? "Update" : "Add"} Image
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : images.length === 0 ? (
            <p className="text-muted-foreground">No images yet. Add your first gallery image.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group rounded-lg overflow-hidden border bg-card">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-40 object-cover"
                  />
                  {image.is_featured && (
                    <div className="absolute top-2 left-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    </div>
                  )}
                  <div className="p-3">
                    <h4 className="font-medium text-sm truncate">{image.title}</h4>
                    {image.event_name && (
                      <p className="text-xs text-muted-foreground truncate">{image.event_name}</p>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => handleEdit(image)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteMutation.mutate(image.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
