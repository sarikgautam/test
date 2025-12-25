import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, Upload, Building2, ExternalLink } from "lucide-react";

interface Owner {
  id: string;
  name: string;
  description: string | null;
  business_name: string | null;
  business_description: string | null;
  business_logo_url: string | null;
  business_website: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
}

export default function OwnersAdmin() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    business_name: "",
    business_description: "",
    business_website: "",
    phone: "",
    email: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [businessLogoFile, setBusinessLogoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [businessLogoUrl, setBusinessLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: owners, isLoading } = useQuery({
    queryKey: ["admin-owners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("owners")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Owner[];
    },
  });

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("owners")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("owners").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      setUploading(true);
      try {
        let finalPhotoUrl = photoUrl || null;
        let finalBusinessLogoUrl = businessLogoUrl || null;

        if (photoFile) {
          finalPhotoUrl = await uploadImage(photoFile, "photo");
        }
        if (businessLogoFile) {
          finalBusinessLogoUrl = await uploadImage(businessLogoFile, "business-logo");
        }

        const { error } = await supabase.from("owners").insert({
          name: data.name,
          description: data.description || null,
          business_name: data.business_name || null,
          business_description: data.business_description || null,
          business_logo_url: finalBusinessLogoUrl,
          business_website: data.business_website || null,
          photo_url: finalPhotoUrl,
          phone: data.phone || null,
          email: data.email || null,
        });
        if (error) throw error;
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-owners"] });
      toast({ title: "Owner created successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error creating owner", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      setUploading(true);
      try {
        let finalPhotoUrl = editingOwner?.photo_url || photoUrl || null;
        let finalBusinessLogoUrl = editingOwner?.business_logo_url || businessLogoUrl || null;

        if (photoFile) {
          finalPhotoUrl = await uploadImage(photoFile, "photo");
        } else if (photoUrl) {
          finalPhotoUrl = photoUrl;
        }
        
        if (businessLogoFile) {
          finalBusinessLogoUrl = await uploadImage(businessLogoFile, "business-logo");
        } else if (businessLogoUrl) {
          finalBusinessLogoUrl = businessLogoUrl;
        }

        const { error } = await supabase
          .from("owners")
          .update({
            name: data.name,
            description: data.description || null,
            business_name: data.business_name || null,
            business_description: data.business_description || null,
            business_logo_url: finalBusinessLogoUrl,
            business_website: data.business_website || null,
            photo_url: finalPhotoUrl,
            phone: data.phone || null,
            email: data.email || null,
          })
          .eq("id", id);
        if (error) throw error;
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-owners"] });
      toast({ title: "Owner updated successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error updating owner", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("owners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-owners"] });
      toast({ title: "Owner deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting owner", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      business_name: "",
      business_description: "",
      business_website: "",
      phone: "",
      email: "",
    });
    setEditingOwner(null);
    setPhotoFile(null);
    setBusinessLogoFile(null);
    setPhotoUrl("");
    setBusinessLogoUrl("");
    setIsOpen(false);
  };

  const handleEdit = (owner: Owner) => {
    setEditingOwner(owner);
    setFormData({
      name: owner.name,
      description: owner.description || "",
      business_name: owner.business_name || "",
      business_description: owner.business_description || "",
      business_website: owner.business_website || "",
      phone: owner.phone || "",
      email: owner.email || "",
    });
    setPhotoUrl(owner.photo_url || "");
    setBusinessLogoUrl(owner.business_logo_url || "");
    setPhotoFile(null);
    setBusinessLogoFile(null);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOwner) {
      updateMutation.mutate({ id: editingOwner.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-gradient-gold">Owners Management</h1>
          <p className="text-muted-foreground mt-1">Manage team owners and their businesses</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Owner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingOwner ? "Edit Owner" : "Add New Owner"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Personal Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Owner Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">About Owner</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description about the owner..."
                    rows={2}
                  />
                </div>

                {/* Owner Photo */}
                <div className="space-y-2">
                  <Label>Owner Photo</Label>
                  <div className="flex items-center gap-4">
                    {(editingOwner?.photo_url || photoFile || photoUrl) && (
                      <div className="w-16 h-16 rounded-full border border-border overflow-hidden bg-muted">
                        <img
                          src={photoFile ? URL.createObjectURL(photoFile) : (photoUrl || editingOwner?.photo_url || "")}
                          alt="Owner"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            setPhotoFile(e.target.files?.[0] || null);
                            setPhotoUrl("");
                          }}
                          className="hidden"
                          id="photo-upload"
                        />
                        <Label htmlFor="photo-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span><Upload className="w-4 h-4 mr-2" />Upload</span>
                          </Button>
                        </Label>
                        <span className="text-muted-foreground text-sm self-center">or</span>
                        <Input
                          placeholder="Paste image URL"
                          value={photoUrl}
                          onChange={(e) => {
                            setPhotoUrl(e.target.value);
                            setPhotoFile(null);
                          }}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Business Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_website">Business Website</Label>
                    <Input
                      id="business_website"
                      value={formData.business_website}
                      onChange={(e) => setFormData({ ...formData, business_website: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_description">Business Description</Label>
                  <Textarea
                    id="business_description"
                    value={formData.business_description}
                    onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                    placeholder="Brief description about the business..."
                    rows={2}
                  />
                </div>

                {/* Business Logo */}
                <div className="space-y-2">
                  <Label>Business Logo</Label>
                  <div className="flex items-center gap-4">
                    {(editingOwner?.business_logo_url || businessLogoFile || businessLogoUrl) && (
                      <div className="w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted">
                        <img
                          src={businessLogoFile ? URL.createObjectURL(businessLogoFile) : (businessLogoUrl || editingOwner?.business_logo_url || "")}
                          alt="Business logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            setBusinessLogoFile(e.target.files?.[0] || null);
                            setBusinessLogoUrl("");
                          }}
                          className="hidden"
                          id="business-logo-upload"
                        />
                        <Label htmlFor="business-logo-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span><Upload className="w-4 h-4 mr-2" />Upload</span>
                          </Button>
                        </Label>
                        <span className="text-muted-foreground text-sm self-center">or</span>
                        <Input
                          placeholder="Paste logo URL"
                          value={businessLogoUrl}
                          onChange={(e) => {
                            setBusinessLogoUrl(e.target.value);
                            setBusinessLogoFile(null);
                          }}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Saving..." : editingOwner ? "Update Owner" : "Create Owner"}
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
                <TableHead>Owner</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {owners?.length ? (
                owners.map((owner) => (
                  <TableRow key={owner.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {owner.photo_url ? (
                          <img
                            src={owner.photo_url}
                            alt={owner.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{owner.name}</p>
                          {owner.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{owner.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {owner.business_name ? (
                        <div className="flex items-center gap-2">
                          {owner.business_logo_url && (
                            <img src={owner.business_logo_url} alt="" className="w-6 h-6 object-contain" />
                          )}
                          <div>
                            <p className="font-medium">{owner.business_name}</p>
                            {owner.business_website && (
                              <a 
                                href={owner.business_website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                Visit <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {owner.email && <p>{owner.email}</p>}
                        {owner.phone && <p className="text-muted-foreground">{owner.phone}</p>}
                        {!owner.email && !owner.phone && <span className="text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(owner)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("Delete this owner?")) {
                              deleteMutation.mutate(owner.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No owners found. Add your first owner.
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
