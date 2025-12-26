-- Add dismissal information fields to player_stats table (if they don't exist)
DO $$ 
BEGIN
    -- Add dismissal_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'player_stats' AND column_name = 'dismissal_type') THEN
        ALTER TABLE player_stats ADD COLUMN dismissal_type TEXT CHECK (dismissal_type IN ('caught', 'bowled', 'lbw', 'runout', 'stumped', 'mankad', 'retired_hurt', 'not_out', 'other'));
    END IF;
    
    -- Add bowler_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'player_stats' AND column_name = 'bowler_id') THEN
        ALTER TABLE player_stats ADD COLUMN bowler_id UUID REFERENCES players(id);
    END IF;
    
    -- Add fielder_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'player_stats' AND column_name = 'fielder_id') THEN
        ALTER TABLE player_stats ADD COLUMN fielder_id UUID REFERENCES players(id);
    END IF;
    
    -- Add runout_by_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'player_stats' AND column_name = 'runout_by_id') THEN
        ALTER TABLE player_stats ADD COLUMN runout_by_id UUID REFERENCES players(id);
    END IF;
    
    -- Add dismissal_other_text column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'player_stats' AND column_name = 'dismissal_other_text') THEN
        ALTER TABLE player_stats ADD COLUMN dismissal_other_text TEXT;
    END IF;
END $$;

-- Add indexes for better query performance (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_player_stats_dismissal_type') THEN
        CREATE INDEX idx_player_stats_dismissal_type ON player_stats(dismissal_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_player_stats_bowler_id') THEN
        CREATE INDEX idx_player_stats_bowler_id ON player_stats(bowler_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_player_stats_fielder_id') THEN
        CREATE INDEX idx_player_stats_fielder_id ON player_stats(fielder_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_player_stats_runout_by_id') THEN
        CREATE INDEX idx_player_stats_runout_by_id ON player_stats(runout_by_id);
    END IF;
END $$;

-- Add comments
COMMENT ON COLUMN player_stats.dismissal_type IS 'Type of dismissal: caught, bowled, lbw, runout, stumped, mankad, retired_hurt, not_out, other';
COMMENT ON COLUMN player_stats.bowler_id IS 'ID of the bowler who got the wicket';
COMMENT ON COLUMN player_stats.fielder_id IS 'ID of the fielder who caught the ball (for caught dismissals)';
COMMENT ON COLUMN player_stats.runout_by_id IS 'ID of the fielder who ran out the batsman';
COMMENT ON COLUMN player_stats.dismissal_other_text IS 'Custom dismissal text for "other" type';


