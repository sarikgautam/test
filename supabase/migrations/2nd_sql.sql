-- Add 'hold' status to player_auction_status enum 

-- This status is for players that weren't sold during auction but are available for post-auction sale 

 
 

-- First, add the new value to the enum if it doesn't exist 

DO $$  

BEGIN 

-- Check if 'hold' value already exists in the enum 

IF NOT EXISTS ( 

SELECT 1 FROM pg_enum  

WHERE enumlabel = 'hold'  

AND enumtypid = 'player_auction_status'::regtype 

) THEN 

-- Add 'hold' to the enum 

ALTER TYPE player_auction_status ADD VALUE 'hold'; 

END IF; 

END $$; 

 
 

-- Add comment to explain the status 

COMMENT ON TYPE player_auction_status IS 'Auction status: registered (not yet auctioned), sold (purchased by team), unsold (passed in auction), hold (not sold but available for post-auction), retained (pre-auction retention)'; 