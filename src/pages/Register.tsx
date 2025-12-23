import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, UserPlus, Loader2 } from "lucide-react";
const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  role: z.enum(["batsman", "bowler", "all_rounder", "wicket_keeper"]),
  batting_style: z.string().optional(),
  bowling_style: z.string().optional(),
  base_price: z.number().min(5000).default(10000)
});
type RegisterFormData = z.infer<typeof registerSchema>;
const Register = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    toast
  } = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: {
      errors
    }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "batsman",
      base_price: 10000
    }
  });
  const mutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const {
        error
      } = await supabase.from("players").insert([{
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        date_of_birth: data.date_of_birth || null,
        role: data.role,
        batting_style: data.batting_style || null,
        bowling_style: data.bowling_style || null,
        base_price: data.base_price,
        auction_status: "registered"
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Registration Successful!",
        description: "You have been added to the auction pool."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });
  if (isSuccess) {
    return <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="font-display text-4xl mb-4">Registration Complete!</h1>
            <p className="text-muted-foreground mb-8">You've been successfully added to the auction pool. Teams will bid for you during the auction.</p>
            <Button variant="hero" size="lg" onClick={() => setIsSuccess(false)}>Register Another Player</Button>
          </div>
        </div>
      </Layout>;
  }
  return <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="container max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
              <UserPlus className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Player Registration</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-4">
              Join the <span className="text-gradient-gold bg-secondary-foreground text-primary-foreground">Auction</span>
            </h1>
            <p className="text-muted-foreground">Register to be part of GCNPL Season 2025</p>
          </div>

          <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-6 bg-card rounded-xl border border-border p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input id="full_name" {...register("full_name")} placeholder="Enter your full name" />
                {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register("email")} placeholder="your@email.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} placeholder="+61 XXX XXX XXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
              </div>
              <div className="space-y-2">
                <Label>Playing Role *</Label>
                <Select defaultValue="batsman" onValueChange={val => setValue("role", val as any)}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
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
                <Select onValueChange={val => setValue("batting_style", val)}>
                  <SelectTrigger><SelectValue placeholder="Select batting style" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Right-hand bat">Right-hand Bat</SelectItem>
                    <SelectItem value="Left-hand bat">Left-hand Bat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bowling_style">Bowling Style</Label>
                <Select onValueChange={val => setValue("bowling_style", val)}>
                  <SelectTrigger><SelectValue placeholder="Select bowling style" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Right-arm fast">Right-arm Fast</SelectItem>
                    <SelectItem value="Left-arm fast">Left-arm Fast</SelectItem>
                    <SelectItem value="Right-arm medium">Right-arm Medium</SelectItem>
                    <SelectItem value="Right-arm off-spin">Right-arm Off-spin</SelectItem>
                    <SelectItem value="Right-arm leg-spin">Right-arm Leg-spin</SelectItem>
                    <SelectItem value="Left-arm orthodox">Left-arm Orthodox</SelectItem>
                    <SelectItem value="Left-arm chinaman">Left-arm Chinaman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Registering...</> : "Register for Auction"}
            </Button>
          </form>
        </div>
      </div>
    </Layout>;
};
export default Register;