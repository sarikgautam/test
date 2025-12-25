import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Mail, Phone, MapPin, Facebook, Instagram, Youtube } from "lucide-react";

interface ContactInfo {
  id: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  office_hours: string | null;
  map_embed_url: string | null;
}

export default function ContactAdmin() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    address: "",
    facebook_url: "",
    instagram_url: "",
    youtube_url: "",
    tiktok_url: "",
    office_hours: "",
    map_embed_url: "",
  });

  const { data: contactInfo, isLoading } = useQuery({
    queryKey: ["contact-info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_info")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as ContactInfo | null;
    },
  });

  useEffect(() => {
    if (contactInfo) {
      setFormData({
        email: contactInfo.email || "",
        phone: contactInfo.phone || "",
        address: contactInfo.address || "",
        facebook_url: contactInfo.facebook_url || "",
        instagram_url: contactInfo.instagram_url || "",
        youtube_url: contactInfo.youtube_url || "",
        tiktok_url: contactInfo.tiktok_url || "",
        office_hours: contactInfo.office_hours || "",
        map_embed_url: contactInfo.map_embed_url || "",
      });
    }
  }, [contactInfo]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (contactInfo?.id) {
        const { error } = await supabase
          .from("contact_info")
          .update(formData)
          .eq("id", contactInfo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contact_info").insert(formData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-info"] });
      toast.success("Contact information saved successfully");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-gradient-gold">Contact Settings</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">Contact Settings</h1>
        <p className="text-muted-foreground mt-1">Manage contact information displayed on the public site</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Details
            </CardTitle>
            <CardDescription>
              Basic contact information displayed on the Contact page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@gcnpl.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+61 4XX XXX XXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Gold Coast, QLD, Australia"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Office Hours</Label>
              <Input
                value={formData.office_hours}
                onChange={(e) => setFormData({ ...formData, office_hours: e.target.value })}
                placeholder="Mon-Fri: 9AM-5PM"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Facebook className="h-5 w-5" />
              Social Media Links
            </CardTitle>
            <CardDescription>
              Links to your social media profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" /> Facebook
                </Label>
                <Input
                  type="url"
                  value={formData.facebook_url}
                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" /> Instagram
                </Label>
                <Input
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Youtube className="h-4 w-4" /> YouTube
                </Label>
                <Input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>TikTok</Label>
                <Input
                  type="url"
                  value={formData.tiktok_url}
                  onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                  placeholder="https://tiktok.com/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Map Embed
            </CardTitle>
            <CardDescription>
              Google Maps embed URL for the location map
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Google Maps Embed URL</Label>
              <Input
                type="url"
                value={formData.map_embed_url}
                onChange={(e) => setFormData({ ...formData, map_embed_url: e.target.value })}
                placeholder="https://www.google.com/maps/embed?..."
              />
              <p className="text-xs text-muted-foreground">
                Go to Google Maps, click Share, then Embed a map, and copy the src URL from the iframe code.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveMutation.isPending} size="lg">
            <Save className="h-4 w-4 mr-2" />
            Save Contact Information
          </Button>
        </div>
      </form>
    </div>
  );
}
