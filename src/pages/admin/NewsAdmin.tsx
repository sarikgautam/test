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
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

interface NewsItem {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  top_content: string | null;
  body_content: string | null;
  bottom_content: string | null;
  is_published: boolean;
  published_at: string | null;
  season_id: string | null;
  created_at: string;
}

export default function NewsAdmin() {
  const queryClient = useQueryClient();
  const { selectedSeasonId } = useSeason();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    top_content: "",
    body_content: "",
    bottom_content: "",
    is_published: false,
  });

  const { data: news = [], isLoading } = useQuery({
    queryKey: ["admin-news", selectedSeasonId],
    queryFn: async () => {
      const query = supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (selectedSeasonId) {
        query.or(`season_id.eq.${selectedSeasonId},season_id.is.null`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as NewsItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("news").insert({
        ...data,
        image_url: data.image_url || null,
        subtitle: data.subtitle || null,
        top_content: data.top_content || null,
        body_content: data.body_content || null,
        bottom_content: data.bottom_content || null,
        season_id: selectedSeasonId,
        published_at: data.is_published ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
      toast.success("News added successfully");
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const updateData: Record<string, unknown> = {
        ...data,
        image_url: data.image_url || null,
        subtitle: data.subtitle || null,
        top_content: data.top_content || null,
        body_content: data.body_content || null,
        bottom_content: data.bottom_content || null,
      };
      
      // Set published_at when publishing for the first time
      if (data.is_published && !editingNews?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
      
      const { error } = await supabase.from("news").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
      toast.success("News updated successfully");
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
      toast.success("News deleted successfully");
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
      .from("news")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Failed to upload image");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("news")
      .getPublicUrl(fileName);

    setFormData({ ...formData, image_url: urlData.publicUrl });
    setUploading(false);
    toast.success("Image uploaded");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      top_content: "",
      body_content: "",
      bottom_content: "",
      is_published: false,
    });
    setEditingNews(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: NewsItem) => {
    setEditingNews(item);
    setFormData({
      title: item.title,
      subtitle: item.subtitle || "",
      image_url: item.image_url || "",
      top_content: item.top_content || "",
      body_content: item.body_content || "",
      bottom_content: item.bottom_content || "",
      is_published: item.is_published,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Please enter a title");
      return;
    }
    if (editingNews) {
      updateMutation.mutate({ id: editingNews.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">Manage News</h1>
        <p className="text-muted-foreground mt-1">Create and manage news articles</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>News Articles</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" /> Add News
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingNews ? "Edit News" : "Add News"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="News headline"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Brief description or subheading"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Featured Image</Label>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Upload from computer:</p>
                      <Input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Or paste URL:</p>
                      <Input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" className="h-32 w-auto object-cover mt-2 rounded border" />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Top Content</Label>
                  <Textarea
                    value={formData.top_content}
                    onChange={(e) => setFormData({ ...formData, top_content: e.target.value })}
                    placeholder="Introduction or lead paragraph"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Body Content</Label>
                  <Textarea
                    value={formData.body_content}
                    onChange={(e) => setFormData({ ...formData, body_content: e.target.value })}
                    placeholder="Main content of the article"
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bottom Content</Label>
                  <Textarea
                    value={formData.bottom_content}
                    onChange={(e) => setFormData({ ...formData, bottom_content: e.target.value })}
                    placeholder="Conclusion or additional notes"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(v) => setFormData({ ...formData, is_published: v })}
                  />
                  <Label>Published (visible to public)</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || uploading}>
                    {editingNews ? "Update" : "Add"} News
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : news.length === 0 ? (
            <p className="text-muted-foreground">No news articles yet. Add your first article.</p>
          ) : (
            <div className="space-y-4">
              {news.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.is_published ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${item.is_published ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                        {item.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <h4 className="font-semibold text-lg truncate">{item.title}</h4>
                    {item.subtitle && (
                      <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {format(new Date(item.created_at), "MMM d, yyyy")}
                      {item.published_at && ` • Published: ${format(new Date(item.published_at), "MMM d, yyyy")}`}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="secondary" size="icon" onClick={() => handleEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
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
