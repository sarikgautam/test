-- Create live auction state table for real-time bidding
CREATE TABLE public.live_auction (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  current_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  current_bid NUMERIC NOT NULL DEFAULT 0,
  current_bidding_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  base_price NUMERIC NOT NULL DEFAULT 10000,
  increment_amount NUMERIC NOT NULL DEFAULT 5000,
  is_live BOOLEAN NOT NULL DEFAULT false,
  bid_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(season_id)
);

-- Enable RLS
ALTER TABLE public.live_auction ENABLE ROW LEVEL SECURITY;

-- Anyone can view live auction (public page)
CREATE POLICY "Anyone can view live auction" 
ON public.live_auction 
FOR SELECT 
USING (true);

-- Only admins can manage live auction
CREATE POLICY "Admins can insert live auction" 
ON public.live_auction 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update live auction" 
ON public.live_auction 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete live auction" 
ON public.live_auction 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_live_auction_updated_at
BEFORE UPDATE ON public.live_auction
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live_auction
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_auction;