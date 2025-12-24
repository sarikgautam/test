import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";
import { formatLocalTime } from "@/lib/utils";

interface AuctionCountdownProps {
  auctionDate: string | null;
}

export function AuctionCountdown({ auctionDate }: AuctionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!auctionDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(auctionDate).getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [auctionDate]);

  if (!auctionDate) {
    return (
      <Card className="border-border/50 max-w-2xl mx-auto">
        <CardContent className="py-16 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-display mb-2">Auction Not Scheduled</h2>
          <p className="text-muted-foreground">
            The auction date hasn't been set yet. Check back soon!
          </p>
        </CardContent>
      </Card>
    );
  }

  const isPast = new Date(auctionDate).getTime() < new Date().getTime();

  if (isPast) {
    return (
      <Card className="border-border/50 max-w-2xl mx-auto">
        <CardContent className="py-16 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-display mb-2">Auction Not Live</h2>
          <p className="text-muted-foreground">
            The auction has ended or will resume shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent max-w-3xl mx-auto overflow-hidden">
      <CardContent className="py-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">
              {formatLocalTime(auctionDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
          <h2 className="text-2xl font-display text-gradient-gold">Auction Starts In</h2>
        </div>
        
        <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
          {[
            { value: timeLeft.days, label: "Days" },
            { value: timeLeft.hours, label: "Hours" },
            { value: timeLeft.minutes, label: "Minutes" },
            { value: timeLeft.seconds, label: "Seconds" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="bg-card border border-border rounded-lg p-4">
                <span className="text-3xl md:text-4xl font-display font-bold text-primary">
                  {item.value.toString().padStart(2, "0")}
                </span>
              </div>
              <span className="text-xs text-muted-foreground mt-2 block">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
