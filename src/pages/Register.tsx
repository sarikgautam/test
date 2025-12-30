import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, UserPlus, Loader2, Upload, AlertCircle, CreditCard, User, Phone, XCircle } from "lucide-react";
import { useActiveSeason } from "@/hooks/useSeason";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone number is required"),
  address: z.string().min(5, "Address is required"),
  current_team: z.string().optional(),
  emergency_contact_name: z.string().min(2, "Emergency contact name is required"),
  emergency_contact_phone: z.string().min(8, "Emergency contact phone is required"),
  emergency_contact_email: z.string().email("Invalid emergency contact email").optional().or(z.literal("")),
  role: z.enum(["batsman", "bowler", "all_rounder", "wicket_keeper"]),
  batting_style: z.string().optional(),
  bowling_style: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<{ photo?: string; receipt?: string }>({});
  const { toast } = useToast();
  const { activeSeason } = useActiveSeason();

  const { data: settings } = useQuery({
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

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "batsman",
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadErrors((prev) => ({ ...prev, photo: undefined }));
    
    if (!file) return;
    
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setUploadErrors((prev) => ({ ...prev, photo: "Please upload a valid image (JPG, PNG, WEBP)" }));
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      setUploadErrors((prev) => ({ ...prev, photo: "Image must be less than 5MB" }));
      return;
    }
    
    setProfilePhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadErrors((prev) => ({ ...prev, receipt: undefined }));
    
    if (!file) return;
    
    if (file.size > MAX_FILE_SIZE) {
      setUploadErrors((prev) => ({ ...prev, receipt: "File must be less than 5MB" }));
      return;
    }
    
    setPaymentReceipt(file);
    if (file.type.startsWith("image/")) {
      setReceiptPreview(URL.createObjectURL(file));
    } else {
      setReceiptPreview(null);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      if (!activeSeason) {
        throw new Error("No active season found");
      }

      // Check for duplicate registrations based on email, phone, and date of birth
      // First, find all players that match any of these criteria
      const { data: matchingPlayers, error: dupCheckError } = await supabase
        .from("players")
        .select("id, email, phone, date_of_birth")
        .or(`email.eq.${data.email},phone.eq.${data.phone},date_of_birth.eq.${data.date_of_birth}`);

      if (dupCheckError) throw dupCheckError;

      // If we found matching players, check how many registrations they have for this season
      if (matchingPlayers && matchingPlayers.length > 0) {
        const playerIds = matchingPlayers.map(p => p.id);
        
        const { data: seasonRegistrations, error: regCheckError } = await supabase
          .from("player_season_registrations")
          .select("id")
          .eq("season_id", activeSeason.id)
          .in("player_id", playerIds);

        if (regCheckError) throw regCheckError;

        // If there's already a registration, prevent duplicate
        if (seasonRegistrations && seasonRegistrations.length >= 1) {
          throw new Error(
            "You have already registered for this season. Please reach out to the GCNPL management team to amend your registration."
          );
        }
      }

      let receiptUrl: string | null = null;

      // Upload payment receipt if provided
      if (paymentReceipt) {
        const receiptExt = paymentReceipt.name.split(".").pop();
        const receiptPath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${receiptExt}`;
        
        const { error: receiptError } = await supabase.storage
          .from("payment-receipts")
          .upload(receiptPath, paymentReceipt);
        
        if (receiptError) throw new Error("Failed to upload payment receipt");
        
        const { data: receiptUrlData } = supabase.storage
          .from("payment-receipts")
          .getPublicUrl(receiptPath);
        
        receiptUrl = receiptUrlData.publicUrl;
      }

      // Check if player already exists
      const { data: existingPlayer, error: checkError } = await supabase
        .from("players")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();

      if (checkError) throw checkError;

      let photoUrl: string | null = null;

      // Upload profile photo if provided
      if (profilePhoto) {
        const photoExt = profilePhoto.name.split(".").pop();
        const photoPath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${photoExt}`;
        
        const { error: photoError } = await supabase.storage
          .from("player-photos")
          .upload(photoPath, profilePhoto);
        
        if (photoError) throw new Error("Failed to upload profile photo");
        
        const { data: photoUrlData } = supabase.storage
          .from("player-photos")
          .getPublicUrl(photoPath);
        
        photoUrl = photoUrlData.publicUrl;
      }

      let playerId: string;

      if (existingPlayer) {
        // Update existing player
        const { error: updateError } = await supabase
          .from("players")
          .update({
            full_name: data.full_name,
            phone: data.phone,
            date_of_birth: data.date_of_birth || null,
            address: data.address || null,
            current_team: data.current_team || null,
            emergency_contact_name: data.emergency_contact_name,
            emergency_contact_phone: data.emergency_contact_phone,
            emergency_contact_email: data.emergency_contact_email || null,
            role: data.role,
            batting_style: data.batting_style || null,
            bowling_style: data.bowling_style || null,
            ...(photoUrl && { photo_url: photoUrl }),
            ...(receiptUrl && { payment_receipt_url: receiptUrl }),
          })
          .eq("id", existingPlayer.id);

        if (updateError) throw updateError;
        playerId = existingPlayer.id;
      } else {
        // Create new player
        const { data: newPlayer, error: playerError } = await supabase
          .from("players")
          .insert({
            full_name: data.full_name,
            email: data.email,
            phone: data.phone,
            date_of_birth: data.date_of_birth || null,
            address: data.address || null,
            current_team: data.current_team || null,
            emergency_contact_name: data.emergency_contact_name,
            emergency_contact_phone: data.emergency_contact_phone,
            emergency_contact_email: data.emergency_contact_email || null,
            role: data.role,
            batting_style: data.batting_style || null,
            bowling_style: data.bowling_style || null,
            photo_url: photoUrl,
            payment_receipt_url: receiptUrl,
            original_season_id: activeSeason.id,
          })
          .select()
          .single();

        if (playerError) throw playerError;
        playerId = newPlayer.id;
      }

      // Check if already registered for this season
      const { data: existingReg, error: regCheckError } = await supabase
        .from("player_season_registrations")
        .select("id")
        .eq("player_id", playerId)
        .eq("season_id", activeSeason.id)
        .maybeSingle();

      if (regCheckError) throw regCheckError;

      if (!existingReg) {
        // Create season registration with pending status for admin review
        const { error: regError } = await supabase
          .from("player_season_registrations")
          .insert({
            player_id: playerId,
            season_id: activeSeason.id,
            auction_status: "registered",
            base_price: 20,
            registration_status: "pending",
          });

        if (regError) throw regError;
      }
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Registration Submitted!",
        description: "Your registration is pending admin approval. You will be notified once reviewed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    if (!profilePhoto) {
      setUploadErrors((prev) => ({ ...prev, photo: "Profile photo is required" }));
      return;
    }
    if (!paymentReceipt) {
      setUploadErrors((prev) => ({ ...prev, receipt: "Payment receipt is required" }));
      return;
    }
    mutation.mutate(data);
  };

  if (isSuccess) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl mb-4">Registration Complete!</h1>
            <p className="text-muted-foreground mb-8">
              You have been successfully registered for GCNPL {activeSeason?.name || "the current season"}. Your registration will be reviewed by the management team before being added to the auction pool. You will be contacted if any further information is required.
            </p>
            <Button variant="default" size="lg" onClick={() => window.location.reload()}>
              Register Another Player
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Check if registration is open for the active season
  const isRegistrationOpen = activeSeason?.registration_open ?? false;

  if (!isRegistrationOpen) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="font-display text-4xl mb-4">Registration Closed</h1>
            <p className="text-muted-foreground mb-8">
              Player registration for {activeSeason?.name || "the current season"} is currently closed. 
              Please check back later or contact the tournament organizers.
            </p>
            <Button variant="default" size="lg" onClick={() => window.location.href = "/"}>
              Go Home
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Parse bank details safely
  let bankDetails = null;
  try {
    if ((settings as any)?.bank_details) {
      bankDetails = JSON.parse((settings as any).bank_details);
    }
  } catch (e) {
    bankDetails = null;
  }

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="container max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
              <UserPlus className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Player Registration</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-4">
              Join <span className="text-primary">GCNPL {activeSeason?.year || 2025}</span>
            </h1>
            <p className="text-muted-foreground">
              Complete your registration for {activeSeason?.name || "Season 2"} to be part of the auction
            </p>
          </div>

          {/* Bank Details Card */}
          {bankDetails && (
            <Card className="mb-8 border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment Information
                </CardTitle>
                <CardDescription>
                  Please transfer the registration fee to the following account and upload the receipt below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {bankDetails.bankName && (
                    <div>
                      <span className="text-muted-foreground">Bank Name:</span>
                      <p className="font-medium">{bankDetails.bankName}</p>
                    </div>
                  )}
                  {bankDetails.accountName && (
                    <div>
                      <span className="text-muted-foreground">Account Name:</span>
                      <p className="font-medium">{bankDetails.accountName}</p>
                    </div>
                  )}
                  {bankDetails.bsb && (
                    <div>
                      <span className="text-muted-foreground">BSB:</span>
                      <p className="font-medium font-mono">{bankDetails.bsb}</p>
                    </div>
                  )}
                  {bankDetails.accountNumber && (
                    <div>
                      <span className="text-muted-foreground">Account Number:</span>
                      <p className="font-medium font-mono">{bankDetails.accountNumber}</p>
                    </div>
                  )}
                  {bankDetails.amount && (
                    <div>
                      <span className="text-muted-foreground">Registration Fee:</span>
                      <p className="font-bold text-primary">${bankDetails.amount}</p>
                    </div>
                  )}
                  {bankDetails.reference && (
                    <div>
                      <span className="text-muted-foreground">Reference:</span>
                      <p className="font-medium">{bankDetails.reference}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input id="full_name" {...register("full_name")} placeholder="Enter your full name" />
                    {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
                    {errors.date_of_birth && <p className="text-sm text-destructive">{errors.date_of_birth.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" {...register("email")} placeholder="your@email.com" />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" {...register("phone")} placeholder="+61 XXX XXX XXX" />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea id="address" {...register("address")} placeholder="Your full address" rows={2} />
                    {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="current_team">Current Team (if any)</Label>
                    <Input id="current_team" {...register("current_team")} placeholder="e.g., Local Cricket Club" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Emergency Contact
                </CardTitle>
                <CardDescription>Contact person in case of emergency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_name">Contact Name *</Label>
                    <Input id="emergency_contact_name" {...register("emergency_contact_name")} placeholder="Full name" />
                    {errors.emergency_contact_name && (
                      <p className="text-sm text-destructive">{errors.emergency_contact_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone">Contact Phone *</Label>
                    <Input id="emergency_contact_phone" {...register("emergency_contact_phone")} placeholder="+61 XXX XXX XXX" />
                    {errors.emergency_contact_phone && (
                      <p className="text-sm text-destructive">{errors.emergency_contact_phone.message}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="emergency_contact_email">Contact Email (optional)</Label>
                    <Input
                      id="emergency_contact_email"
                      type="email"
                      {...register("emergency_contact_email")}
                      placeholder="contact@email.com"
                    />
                    {errors.emergency_contact_email && (
                      <p className="text-sm text-destructive">{errors.emergency_contact_email.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cricket Details */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Cricket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Role *</Label>
                    <Select defaultValue="batsman" onValueChange={(v) => setValue("role", v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="batsman">Batsman</SelectItem>
                        <SelectItem value="bowler">Bowler</SelectItem>
                        <SelectItem value="all_rounder">All-Rounder</SelectItem>
                        <SelectItem value="wicket_keeper">Wicket Keeper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batting_style">Batting Style</Label>
                    <Select onValueChange={(v) => setValue("batting_style", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Right-handed">Right-handed</SelectItem>
                        <SelectItem value="Left-handed">Left-handed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bowling_style">Bowling Style</Label>
                    <Select onValueChange={(v) => setValue("bowling_style", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Right-arm Fast">Right-arm Fast</SelectItem>
                        <SelectItem value="Right-arm Medium">Right-arm Medium</SelectItem>
                        <SelectItem value="Right-arm Off-spin">Right-arm Off-spin</SelectItem>
                        <SelectItem value="Right-arm Leg-spin">Right-arm Leg-spin</SelectItem>
                        <SelectItem value="Left-arm Fast">Left-arm Fast</SelectItem>
                        <SelectItem value="Left-arm Medium">Left-arm Medium</SelectItem>
                        <SelectItem value="Left-arm Orthodox">Left-arm Orthodox</SelectItem>
                        <SelectItem value="Left-arm Chinaman">Left-arm Chinaman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photo Upload */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Profile Photo *
                </CardTitle>
                <CardDescription>Upload a recent photo (required)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input type="file" accept="image/*" onChange={handlePhotoChange} className="cursor-pointer" />
                    {uploadErrors.photo && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {uploadErrors.photo}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Max 5MB. JPG, PNG, or WEBP.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Receipt */}
            <Card className="border-border/50 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment Receipt *
                </CardTitle>
                <CardDescription>Upload your payment receipt (required)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {receiptPreview && (
                    <img src={receiptPreview} alt="Receipt Preview" className="max-h-40 rounded-lg object-contain" />
                  )}
                  <Input type="file" accept="image/*,.pdf" onChange={handleReceiptChange} className="cursor-pointer" />
                  {uploadErrors.receipt && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {uploadErrors.receipt}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Max 5MB. Image or PDF.</p>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Complete Registration
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
