import { useState } from "react";
import HighImpactSoldCelebration from "@/components/auction/HighImpactSoldCelebration";

export default function HighImpactSoldCelebrationTest() {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <button
        className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-lg text-2xl mb-8 mt-16 shadow-lg hover:bg-yellow-300 transition"
        onClick={() => setShow(true)}
      >
        Show Celebration Overlay
      </button>
      {show && (
        <HighImpactSoldCelebration
          teamLogoUrl={"/gcnpl-logo.png"}
          teamName="Test Team"
          amount={123456}
          onDone={() => setShow(false)}
        />
      )}
      <div className="text-white/70 mt-12 text-center max-w-xl">
        This page lets you test the high-impact celebration overlay in isolation.<br />
        Click the button above to trigger the overlay.
      </div>
    </div>
  );
}
