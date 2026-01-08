import { useState, useEffect } from "react";
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
import { CheckCircle, UserPlus, Loader2, Upload, AlertCircle, CreditCard, User, Phone, XCircle, ChevronRight, ChevronLeft, Check, Trophy, Clock, Copy } from "lucide-react";
import { useActiveSeason } from "@/hooks/useSeason";
import { cn } from "@/lib/utils";

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

const STEPS = [
  { id: 0, title: "Eligibility", icon: CheckCircle },
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Emergency", icon: Phone },
  { id: 3, title: "Cricket Details", icon: UserPlus },
  { id: 4, title: "Documents", icon: Upload },
  { id: 5, title: "Payment", icon: CreditCard },
];

const Register = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [residencyType, setResidencyType] = useState<"gc-tweed" | "qld-other" | "other-state" | null>(null);
  const [eligibilityConfirmed, setEligibilityConfirmed] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<{ photo?: string; receipt?: string }>({});
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<"not-started" | "open" | "ending-soon" | "closed">("open");
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

  // Registration countdown effect
  useEffect(() => {
    if (!activeSeason?.registration_start_date || !activeSeason?.registration_end_date) {
      setRegistrationStatus("open");
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const startDate = new Date(activeSeason.registration_start_date!).getTime();
      const endDate = new Date(activeSeason.registration_end_date!).getTime();
      const twoDaysBeforeEnd = endDate - (2 * 24 * 60 * 60 * 1000);

      if (now < startDate) {
        // Registration hasn't started yet
        const difference = startDate - now;
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
        setRegistrationStatus("not-started");
      } else if (now >= startDate && now < twoDaysBeforeEnd) {
        // Registration is open, more than 2 days remaining
        setRegistrationStatus("open");
        setCountdown(null);
      } else if (now >= twoDaysBeforeEnd && now < endDate) {
        // Less than 2 days remaining
        const difference = endDate - now;
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
        setRegistrationStatus("ending-soon");
      } else {
        // Registration has closed
        setRegistrationStatus("closed");
        setCountdown(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [activeSeason?.registration_start_date, activeSeason?.registration_end_date]);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
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
            residency_type: residencyType,
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
      setCurrentStep(4);
      return;
    }
    if (!paymentReceipt) {
      setUploadErrors((prev) => ({ ...prev, receipt: "Payment receipt is required" }));
      setCurrentStep(5);
      return;
    }
    mutation.mutate(data);
  };

  const validateStep = async (step: number): Promise<boolean> => {
    const fieldsToValidate: Record<number, (keyof RegisterFormData)[]> = {
      1: ["full_name", "date_of_birth", "email", "phone", "address"],
      2: ["emergency_contact_name", "emergency_contact_phone"],
      3: ["role"],
      4: [],
      5: [],
    };

    const fields = fieldsToValidate[step];
    const result = await trigger(fields as any);
    
    if (step === 4 && !profilePhoto) {
      setUploadErrors((prev) => ({ ...prev, photo: "Profile photo is required" }));
      return false;
    }
    
    if (step === 5 && !paymentReceipt) {
      setUploadErrors((prev) => ({ ...prev, receipt: "Payment receipt is required" }));
      return false;
    }
    
    return result;
  };

  const nextStep = async () => {
    // Handle eligibility step
    if (currentStep === 0) {
      if (residencyType === "other-state") {
        toast({ title: "Not Eligible", description: "Only Gold Coast, Tweed (NSW), and Queensland residents can register for this tournament", variant: "destructive" });
        return;
      }
      if (residencyType !== null) {
        setEligibilityConfirmed(true);
        setCurrentStep(1);
      } else {
        toast({ title: "Required", description: "Please select your residency type", variant: "destructive" });
      }
      return;
    }

    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
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

  // Handle registration not started yet
  if (registrationStatus === "not-started" && countdown) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl mb-4">Registration Opens Soon!</h1>
            <p className="text-muted-foreground mb-2">
              Registration starts on:
            </p>
            <p className="text-lg font-semibold text-primary mb-6">
              {activeSeason?.registration_start_date 
                ? new Date(activeSeason.registration_start_date).toLocaleDateString('en-AU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) + " at " + new Date(activeSeason.registration_start_date).toLocaleTimeString('en-AU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })
                : "TBA"}
            </p>
            <p className="text-muted-foreground mb-6">
              Player registration for {activeSeason?.name || "the current season"} will open in:
            </p>
            <p className="text-sm text-primary font-medium mb-8">
              Times shown in AEST (Australian Eastern Standard Time)
            </p>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-card border rounded-lg p-4">
                <div className="text-3xl font-bold text-primary">{countdown.days}</div>
                <div className="text-sm text-muted-foreground">Days</div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="text-3xl font-bold text-primary">{countdown.hours}</div>
                <div className="text-sm text-muted-foreground">Hours</div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="text-3xl font-bold text-primary">{countdown.minutes}</div>
                <div className="text-sm text-muted-foreground">Minutes</div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="text-3xl font-bold text-primary">{countdown.seconds}</div>
                <div className="text-sm text-muted-foreground">Seconds</div>
              </div>
            </div>
            <Button variant="default" size="lg" onClick={() => window.location.href = "/"}>
              Go Home
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle registration closed or manually disabled
  if (registrationStatus === "closed" || !isRegistrationOpen) {
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

          {/* Registration Ending Soon Banner */}
          {registrationStatus === "ending-soon" && countdown && (
            <Card className="mb-8 border-amber-500/50 bg-amber-500/10 animate-pulse">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                  Registration Ending Soon!
                </CardTitle>
                <CardDescription className="text-amber-600/80 dark:text-amber-400/80">
                  Hurry up! Registration closes in:
                </CardDescription>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                  Times shown in AEST (Australian Eastern Standard Time)
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-card border rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{countdown.days}</div>
                    <div className="text-xs text-muted-foreground">Days</div>
                  </div>
                  <div className="bg-card border rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{countdown.hours}</div>
                    <div className="text-xs text-muted-foreground">Hours</div>
                  </div>
                  <div className="bg-card border rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{countdown.minutes}</div>
                    <div className="text-xs text-muted-foreground">Minutes</div>
                  </div>
                  <div className="bg-card border rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{countdown.seconds}</div>
                    <div className="text-xs text-muted-foreground">Seconds</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{bankDetails.accountName}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(bankDetails.accountName);
                            toast({ title: "Copied!", description: "Account name copied to clipboard" });
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {bankDetails.bsb && (
                    <div>
                      <span className="text-muted-foreground">BSB:</span>
                      <div className="flex items-center gap-2">
                        <p className="font-medium font-mono">{bankDetails.bsb}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(bankDetails.bsb);
                            toast({ title: "Copied!", description: "BSB copied to clipboard" });
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {bankDetails.accountNumber && (
                    <div>
                      <span className="text-muted-foreground">Account Number:</span>
                      <div className="flex items-center gap-2">
                        <p className="font-medium font-mono">{bankDetails.accountNumber}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(bankDetails.accountNumber);
                            toast({ title: "Copied!", description: "Account number copied to clipboard" });
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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

          {/* Progress Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-muted -z-10">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                />
              </div>

              {/* Step Circles */}
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <div key={step.id} className="flex flex-col items-center gap-2 relative bg-background px-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(step.id)}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                        isCompleted && "bg-primary border-primary text-primary-foreground",
                        isCurrent && "bg-primary/10 border-primary text-primary scale-110",
                        !isCompleted && !isCurrent && "bg-muted border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                    </button>
                    <span
                      className={cn(
                        "text-xs font-medium text-center hidden sm:block",
                        (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 0: Eligibility Check */}
            {currentStep === 0 && (
              <Card className="border-border/50 animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Eligibility Check
                  </CardTitle>
                  <CardDescription>Verify your eligibility to register</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* State/Area Selection */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Where are you from? *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        type="button"
                        variant={residencyType === "gc-tweed" ? "default" : "outline"}
                        className="h-auto py-4 flex-col"
                        onClick={() => setResidencyType("gc-tweed")}
                      >
                        <span className="font-semibold">Gold Coast / Tweed</span>
                        <span className="text-xs opacity-70">Gold Coast LGA or Tweed Heads (NSW)</span>
                      </Button>
                      <Button
                        type="button"
                        variant={residencyType === "qld-other" ? "default" : "outline"}
                        className="h-auto py-4 flex-col"
                        onClick={() => setResidencyType("qld-other")}
                      >
                        <span className="font-semibold">Other Queensland</span>
                        <span className="text-xs opacity-70">Rest of Queensland (non-Gold Coast)</span>
                      </Button>
                      <Button
                        type="button"
                        variant={residencyType === "other-state" ? "destructive" : "outline"}
                        className="h-auto py-4 flex-col"
                        onClick={() => setResidencyType("other-state")}
                      >
                        <span className="font-semibold">Another State</span>
                        <span className="text-xs opacity-70">Not eligible</span>
                      </Button>
                    </div>
                  </div>

                  {/* Not Eligible Message */}
                  {residencyType === "other-state" && (
                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                      <p className="text-sm text-destructive font-medium">
                        ⚠️ Sorry, this tournament is only open to Gold Coast, Tweed (NSW), and Queensland residents. You are not eligible to register at this time.
                      </p>
                    </div>
                  )}

                  {/* Eligibility Confirmed */}
                  {residencyType && residencyType !== "other-state" && (
                    <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                      <p className="text-sm text-primary font-medium">
                        ✓ You are eligible to register as a {residencyType === "gc-tweed" ? "Gold Coast/Tweed" : "Queensland"} resident.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <Card className="border-border/50 animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Tell us about yourself</CardDescription>
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
            )}

            {/* Step 2: Emergency Contact */}
            {currentStep === 2 && (
              <Card className="border-border/50 animate-fade-in">
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
            )}

            {/* Step 3: Cricket Details */}
            {currentStep === 3 && (
              <Card className="border-border/50 animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Cricket Details
                  </CardTitle>
                  <CardDescription>Share your cricket profile</CardDescription>
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
            )}

            {/* Step 4: Profile Photo */}
            {currentStep === 4 && (
              <Card className="border-border/50 animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Profile Photo *
                  </CardTitle>
                  <CardDescription>Upload a recent photo (required)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-6">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-32 h-32 rounded-full object-cover ring-4 ring-primary/20" />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="w-full">
                      <Input type="file" accept="image/*" onChange={handlePhotoChange} className="cursor-pointer" />
                      {uploadErrors.photo && (
                        <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {uploadErrors.photo}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">Max 5MB. JPG, PNG, or WEBP.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Payment Receipt */}
            {currentStep === 5 && (
              <Card className="border-border/50 border-primary/30 animate-fade-in">
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
                      <div className="rounded-lg border border-primary/30 p-4 bg-primary/5">
                        <img src={receiptPreview} alt="Receipt Preview" className="max-h-64 mx-auto rounded-lg object-contain" />
                      </div>
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
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-4">
              {currentStep > 0 && (
                <Button type="button" variant="outline" size="lg" onClick={prevStep} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              {currentStep < 5 ? (
                <Button 
                  type="button" 
                  size="lg" 
                  onClick={nextStep} 
                  className="flex-1"
                  disabled={currentStep === 0 && residencyType === "other-state"}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" size="lg" className="flex-1" disabled={mutation.isPending}>
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
              )}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
