import { useEffect, useRef, useState } from "react";

interface HighImpactSoldCelebrationProps {
  teamLogoUrl: string;
  teamName: string;
  amount: number;
  playerPhotoUrl?: string;
  playerName?: string;
  onDone: () => void;
}

export default function HighImpactSoldCelebration({
  teamLogoUrl,
  teamName,
  amount,
  playerPhotoUrl,
  playerName,
  onDone,
}: HighImpactSoldCelebrationProps) {
  const [displayedAmount, setDisplayedAmount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Animate the amount counting up
    let start = 0;
    const duration = 1800; // ms
    const startTime = Date.now();
    function animate() {
      const now = Date.now();
      const elapsed = now - startTime;
      if (elapsed < duration) {
        setDisplayedAmount(Math.floor((amount * elapsed) / duration));
        requestAnimationFrame(animate);
      } else {
        setDisplayedAmount(amount);
      }
    }
    animate();
    // Confetti burst after 0.5s
    setTimeout(() => setShowConfetti(true), 500);
    // Dismiss after 7s
    const timeout = setTimeout(() => {
      setShowConfetti(false);
      setTimeout(onDone, 800);
    }, 7000);
    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [amount, onDone]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in">
      {/* Confetti burst */}
      {showConfetti && <ConfettiBurst />}
      <div className="flex flex-col items-center gap-8">
        {/* Player Photo and Name */}
        {(playerPhotoUrl || playerName) && (
          <div className="flex flex-col items-center gap-2 animate-bounce-in">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-pink-500 flex items-center justify-center shadow-2xl border-4 border-yellow-300 animate-scale-in mb-2">
              {playerPhotoUrl ? (
                <img src={playerPhotoUrl} alt={playerName} className="w-28 h-28 rounded-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white">{playerName ? playerName[0] : "?"}</span>
              )}
            </div>
            {playerName && (
              <div className="text-2xl font-bold text-yellow-100 drop-shadow-lg animate-fade-in">
                {playerName}
              </div>
            )}
          </div>
        )}
        {/* SOLD Stamp */}
        <div className="relative">
          <span className="text-[7rem] font-extrabold text-yellow-400 drop-shadow-lg animate-sold-flash">
            SOLD
          </span>
          <span className="absolute left-0 top-0 w-full h-full pointer-events-none animate-sold-stamp-glow" />
        </div>
        {/* Team Logo Reveal */}
        <div className="flex flex-col items-center gap-2 animate-bounce-in">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-yellow-400 to-pink-500 flex items-center justify-center shadow-2xl border-8 border-yellow-300 animate-scale-in">
            {teamLogoUrl ? (
              <img src={teamLogoUrl} alt={teamName} className="w-36 h-36 rounded-full object-cover" />
            ) : (
              <span className="text-5xl font-bold text-white">{teamName[0]}</span>
            )}
          </div>
          <div className="text-3xl font-bold text-yellow-200 drop-shadow-lg mt-2 animate-fade-in">
            {teamName}
          </div>
        </div>
        {/* Sale Amount Counting Up */}
        <div className="text-6xl font-extrabold text-neon-gold animate-countup-glow">
          ${displayedAmount.toLocaleString()}
        </div>
        {/* Crowd cheer effect */}
        <div className="text-2xl text-yellow-100 font-bold tracking-widest animate-crowd-cheer">
          What a win!
        </div>
      </div>
      {/* Animations and styles */}
      <style>{`
        @keyframes sold-flash {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 30px gold); }
          20% { opacity: 0.7; }
          40% { opacity: 1; }
          60% { opacity: 0.7; }
          80% { opacity: 1; }
        }
        .animate-sold-flash {
          animation: sold-flash 1.2s cubic-bezier(.4,0,.2,1) 2;
        }
        @keyframes sold-stamp-glow {
          0%, 100% { box-shadow: 0 0 60px 20px gold; opacity: 0.7; }
          50% { box-shadow: 0 0 120px 40px #fff700; opacity: 1; }
        }
        .animate-sold-stamp-glow {
          animation: sold-stamp-glow 1.2s cubic-bezier(.4,0,.2,1) 2;
        }
        @keyframes scale-in {
          0% { transform: scale(0.2); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.8s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes bounce-in {
          0% { transform: translateY(100px) scale(0.8); opacity: 0; }
          60% { transform: translateY(-20px) scale(1.1); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 1s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes countup-glow {
          0% { text-shadow: 0 0 0 #fff700; color: #fff700; }
          50% { text-shadow: 0 0 30px #fff700, 0 0 60px #fff700; color: #fff700; }
          100% { text-shadow: 0 0 0 #fff700; color: #fff700; }
        }
        .animate-countup-glow {
          animation: countup-glow 2s cubic-bezier(.4,0,.2,1) 1;
        }
        @keyframes crowd-cheer {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 1; }
        }
        .animate-crowd-cheer {
          animation: crowd-cheer 1.5s 1.5s both;
        }
        .text-neon-gold {
          color: #fff700;
          text-shadow: 0 0 20px #fff700, 0 0 40px #fff700;
        }
      `}</style>
    </div>
  );
}

// Simple confetti burst effect
function ConfettiBurst() {
  // 30 confetti pieces
  const confetti = Array.from({ length: 30 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
      {confetti.map((_, i) => {
        const angle = (360 / confetti.length) * i;
        const color = ["#fff700", "#ff00c8", "#00ffe7", "#fff", "#ffb300"][i % 5];
        const delay = Math.random() * 0.3;
        return (
          <span
            key={i}
            className="absolute w-4 h-4 rounded-full"
            style={{
              left: "50%",
              top: "50%",
              background: color,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              animation: `confetti-burst 0.9s ${delay}s cubic-bezier(.4,0,.2,1) both`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confetti-burst {
          0% { transform: translate(-50%, -50%) scale(1) rotate(var(--angle, 0deg)); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.2) rotate(var(--angle, 0deg)) translateY(-400px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
