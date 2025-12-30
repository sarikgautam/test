import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, CreditCard, Eye, EyeOff } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type TournamentSettingsRow = Database["public"]["Tables"]["tournament_settings"]["Row"];
type TournamentSettings = TournamentSettingsRow & { countdown_description?: string; bank_details?: string };

interface BankDetails {
  bankName: string;
  accountName: string;
  bsb: string;
  accountNumber: string;
  amount: string;
  reference: string;
}



export default function SettingsAdmin() {
  const [formData, setFormData] = useState<Partial<TournamentSettings>>({});
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: "",
    accountName: "",
    bsb: "",
    accountNumber: "",
    amount: "",
    reference: "",
  });
  const [showBankDetails, setShowBankDetails] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["tournament-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
      // Parse bank details from settings
      try {
        if ((settings as any).bank_details) {
          const parsed = JSON.parse((settings as any).bank_details);
          setBankDetails(parsed);
        }
      } catch (e) {
        // If parsing fails, leave defaults
      }
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<TournamentSettings>) => {
      const updateData = {
        min_players_per_team: data.min_players_per_team,
        max_players_per_team: data.max_players_per_team,
        countdown_description: data.countdown_description,
        bank_details: JSON.stringify(bankDetails),
      };
      
      if (settings?.id) {
        const { error } = await supabase
          .from("tournament_settings")
          .update(updateData as any)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tournament_settings").insert({
          min_players_per_team: data.min_players_per_team || 11,
          max_players_per_team: data.max_players_per_team || 15,
          countdown_description: data.countdown_description,
          bank_details: JSON.stringify(bankDetails),
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-settings"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: (error) => {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    },
  });

  const toggleRegistrationMutation = useMutation({
    mutationFn: async (registrationOpen: boolean) => {
      // Update the active season's registration status
      const { data: activeSeason, error: fetchError } = await supabase
        .from("seasons")
        .select("id")
        .eq("is_active", true)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      if (!activeSeason) throw new Error("No active season found");

      const { error } = await supabase
        .from("seasons")
        .update({ registration_open: registrationOpen })
        .eq("id", activeSeason.id);
      if (error) throw error;
    },
    onSuccess: (_, registrationOpen) => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      queryClient.invalidateQueries({ queryKey: ["active-season"] });
      toast({ title: registrationOpen ? "Registration opened" : "Registration closed" });
    },
    onError: (error) => {
      toast({ title: "Error updating registration status", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">Tournament Settings</h1>
        <p className="text-muted-foreground mt-1">Configure tournament parameters</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Team Configuration</CardTitle>
            <CardDescription>Player limits per team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_players">Minimum Players per Team</Label>
                <Input
                  id="min_players"
                  type="number"
                  value={formData.min_players_per_team || 11}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_players_per_team: parseInt(e.target.value),
                    })
                  }
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_players">Maximum Players per Team</Label>
                <Input
                  id="max_players"
                  type="number"
                  value={formData.max_players_per_team || 15}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_players_per_team: parseInt(e.target.value),
                    })
                  }
                  min={1}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Bank Details for Registration
            </CardTitle>
            <CardDescription>
              Players will see these details when registering to make payment. Stored securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base">Show/Hide Details</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBankDetails(!showBankDetails)}
              >
                {showBankDetails ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Show
                  </>
                )}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  type={showBankDetails ? "text" : "password"}
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  placeholder="e.g., Commonwealth Bank"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  type={showBankDetails ? "text" : "password"}
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                  placeholder="e.g., GCNPL Inc"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bsb">BSB</Label>
                <Input
                  id="bsb"
                  type={showBankDetails ? "text" : "password"}
                  value={bankDetails.bsb}
                  onChange={(e) => setBankDetails({ ...bankDetails, bsb: e.target.value })}
                  placeholder="e.g., 064-000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  type={showBankDetails ? "text" : "password"}
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  placeholder="e.g., 12345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Registration Fee ($)</Label>
                <Input
                  id="amount"
                  type={showBankDetails ? "text" : "password"}
                  value={bankDetails.amount}
                  onChange={(e) => setBankDetails({ ...bankDetails, amount: e.target.value })}
                  placeholder="e.g., 50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Payment Reference</Label>
                <Input
                  id="reference"
                  type={showBankDetails ? "text" : "password"}
                  value={bankDetails.reference}
                  onChange={(e) => setBankDetails({ ...bankDetails, reference: e.target.value })}
                  placeholder="e.g., GCNPL2025-[Name]"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              These details will be displayed to players during registration so they can make payment.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
