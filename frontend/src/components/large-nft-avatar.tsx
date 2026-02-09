import { useState, useEffect } from "react";
import type { VisualTraits } from "@/types/agent";

interface LargeNFTAvatarProps {
  seed: string;
  size?: number;
  showTier?: boolean;
  tier?: number;
  traits?: VisualTraits;
  showParticles?: boolean;
}

const TIER_COLORS: Record<number, { border: string; glow: string }> = {
  1: { border: "#6B7280", glow: "rgba(107,114,128,0.3)" },
  2: { border: "#3B82F6", glow: "rgba(59,130,246,0.3)" },
  3: { border: "#8B5CF6", glow: "rgba(139,92,246,0.3)" },
  4: { border: "#F59E0B", glow: "rgba(245,158,11,0.3)" },
  5: { border: "#FCD34D", glow: "rgba(252,211,77,0.4)" },
};

export default function LargeNFTAvatar({
  seed,
  size = 400,
  showTier = true,
  tier = 1,
  traits,
  showParticles = true,
}: LargeNFTAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dicebearUrl, setDicebearUrl] = useState("");

  // Determine border/aura color: use trait color if available, otherwise tier color
  const tierColor = TIER_COLORS[tier] || TIER_COLORS[1];
  const activeColor = traits?.colorScheme
    ? COLOR_MAP[traits.colorScheme] || traits.colorScheme
    : tierColor.border;

  useEffect(() => {
    // Combine name and traits into a composite seed for max variability
    // We strictly use the seed passed in (which might be the selected avatar base)
    // plus accessories to ensure style consistency
    const compositeSeed = traits
      ? `${seed}-${traits.accessories.join("")}`
      : seed;

    // Use the active color (without #) for the background, or a default
    const bgHex = activeColor.replace("#", "");
    const url = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(compositeSeed)}&backgroundColor=${bgHex}&scale=100`;
    setDicebearUrl(url);
    setImageLoaded(false);

    const img = document.createElement("img");
    img.onload = () => {
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error("Failed to load avatar:", url);
      setImageLoaded(true);
    };
    img.src = url;
  }, [seed, traits]); // Re-run when seed or traits change

  return (
    <div
      className="relative flex items-center justify-center transition-colors duration-300"
      style={{
        width: size,
        height: size,
      }}
    >
      <div
        className="relative w-full h-full group"
        style={
          {
            // No background on container, let the agent tile be the bg
            // overflow: "visible", // Ensure particles can fly out
          }
        }
      >
        {/* Brutalist Solid Aura Background */}
        <div
          className="absolute inset-0 opacity-20 z-0"
          style={{
            backgroundColor: activeColor,
          }}
        />

        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: "radial-gradient(#333 1px, transparent 1px)",
            backgroundSize: "8px 8px",
          }}
        />

        {/* Pixel Particles - GLOWING GOLD/WHITE - In front of background */}
        {/* Standard floating particles - MORE of them */}
        <div
          className="absolute top-1/4 left-1/4 w-3 h-3 animate-pixel-particle z-5"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 8px #FFD700",
            animationDelay: "0s",
          }}
        />
        <div
          className="absolute top-3/4 right-1/4 w-3 h-3 animate-pixel-particle z-5"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 8px #FFF8DC",
            animationDelay: "0.3s",
          }}
        />
        <div
          className="absolute bottom-1/4 left-3/4 w-3 h-3 animate-pixel-particle z-5"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 8px #FFD700",
            animationDelay: "0.6s",
          }}
        />
        <div
          className="absolute top-1/5 right-1/5 w-2 h-2 animate-pixel-particle z-5"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 6px #FFF8DC",
            animationDelay: "0.9s",
          }}
        />
        <div
          className="absolute bottom-1/5 left-1/5 w-2 h-2 animate-pixel-particle z-5"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 6px #FFD700",
            animationDelay: "1.2s",
          }}
        />

        {/* Fast rising particles - MORE of them */}
        <div
          className="absolute top-1/2 left-1/2 w-2 h-2 animate-pixel-particle-fast z-5"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 8px #FFD700",
            animationDelay: "0.5s",
          }}
        />
        <div
          className="absolute bottom-10 right-10 w-2 h-2 animate-pixel-particle-fast z-5"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 8px #FFF8DC",
            animationDelay: "1.0s",
          }}
        />
        <div
          className="absolute top-20 left-20 w-1.5 h-1.5 animate-pixel-particle-fast z-5"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 6px #FFD700",
            animationDelay: "1.5s",
          }}
        />
        <div
          className="absolute bottom-20 right-20 w-1.5 h-1.5 animate-pixel-particle-fast z-5"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 6px #FFF8DC",
            animationDelay: "2.0s",
          }}
        />

        {/* Chaotic particles - MORE of them, LARGER */}
        <div
          className="absolute top-10 right-1/2 w-4 h-4 animate-pixel-particle-chaotic z-5"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 12px #FFD700",
            animationDelay: "0.2s",
            opacity: 0.9,
          }}
        />
        <div
          className="absolute bottom-1/3 left-10 w-3 h-3 animate-pixel-particle-chaotic z-5"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 10px #FFF8DC",
            animationDelay: "0.6s",
            opacity: 0.8,
          }}
        />
        <div
          className="absolute top-1/3 right-10 w-2 h-2 animate-pixel-particle-chaotic z-5"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 8px #FFD700",
            animationDelay: "1.0s",
          }}
        />
        <div
          className="absolute bottom-10 left-1/3 w-3 h-3 animate-pixel-particle-chaotic z-5"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 10px #FFF8DC",
            animationDelay: "1.4s",
          }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-2 h-2 animate-pixel-particle-chaotic z-5"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 8px #FFD700",
            animationDelay: "1.8s",
          }}
        />

        {/* EXPLOSIVE particles - fast scale + move */}
        <div
          className="absolute top-1/4 left-1/3 w-3 h-3 animate-pixel-particle-explode z-5"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 10px #FFD700",
            animationDelay: "0.1s",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/3 w-3 h-3 animate-pixel-particle-explode z-5"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 10px #FFF8DC",
            animationDelay: "0.7s",
          }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-2 h-2 animate-pixel-particle-explode z-5"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 8px #FFD700",
            animationDelay: "1.3s",
          }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-2 h-2 animate-pixel-particle-explode z-5"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 8px #FFF8DC",
            animationDelay: "1.9s",
          }}
        />

        {/* Flashing particles - opacity pulses */}
        <div
          className="absolute top-1/6 right-1/6 w-4 h-4 animate-pixel-particle-flash z-5"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 12px #FFD700",
            animationDelay: "0.4s",
          }}
        />
        <div
          className="absolute bottom-1/6 left-1/6 w-3 h-3 animate-pixel-particle-flash z-5"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 10px #FFF8DC",
            animationDelay: "1.1s",
          }}
        />

        {/* Pixel Particles - GLOWING GOLD/WHITE */}
        {/* Standard floating particles - MORE of them */}
        <div
          className="absolute top-1/4 left-1/4 w-3 h-3 animate-pixel-particle"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 8px #FFD700",
            animationDelay: "0s",
          }}
        />
        <div
          className="absolute top-3/4 right-1/4 w-3 h-3 animate-pixel-particle"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 8px #FFF8DC",
            animationDelay: "0.3s",
          }}
        />
        <div
          className="absolute bottom-1/4 left-3/4 w-3 h-3 animate-pixel-particle"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 8px #FFD700",
            animationDelay: "0.6s",
          }}
        />
        <div
          className="absolute top-1/5 right-1/5 w-2 h-2 animate-pixel-particle"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 6px #FFF8DC",
            animationDelay: "0.9s",
          }}
        />
        <div
          className="absolute bottom-1/5 left-1/5 w-2 h-2 animate-pixel-particle"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 6px #FFD700",
            animationDelay: "1.2s",
          }}
        />

        {/* Fast rising particles - MORE of them */}
        <div
          className="absolute top-1/2 left-1/2 w-2 h-2 animate-pixel-particle-fast"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 8px #FFD700",
            animationDelay: "0.5s",
          }}
        />
        <div
          className="absolute bottom-10 right-10 w-2 h-2 animate-pixel-particle-fast"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 8px #FFF8DC",
            animationDelay: "1.0s",
          }}
        />
        <div
          className="absolute top-20 left-20 w-1.5 h-1.5 animate-pixel-particle-fast"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 6px #FFD700",
            animationDelay: "1.5s",
          }}
        />
        <div
          className="absolute bottom-20 right-20 w-1.5 h-1.5 animate-pixel-particle-fast"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 6px #FFF8DC",
            animationDelay: "2.0s",
          }}
        />

        {/* Chaotic particles - MORE of them, LARGER */}
        <div
          className="absolute top-10 right-1/2 w-4 h-4 animate-pixel-particle-chaotic"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 12px #FFD700",
            animationDelay: "0.2s",
            opacity: 0.9,
          }}
        />
        <div
          className="absolute bottom-1/3 left-10 w-3 h-3 animate-pixel-particle-chaotic"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 10px #FFF8DC",
            animationDelay: "0.6s",
            opacity: 0.8,
          }}
        />
        <div
          className="absolute top-1/3 right-10 w-2 h-2 animate-pixel-particle-chaotic"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 8px #FFD700",
            animationDelay: "1.0s",
          }}
        />
        <div
          className="absolute bottom-10 left-1/3 w-3 h-3 animate-pixel-particle-chaotic"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 10px #FFF8DC",
            animationDelay: "1.4s",
          }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-2 h-2 animate-pixel-particle-chaotic"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 8px #FFD700",
            animationDelay: "1.8s",
          }}
        />

        {/* EXPLOSIVE particles - fast scale + move */}
        <div
          className="absolute top-1/4 left-1/3 w-3 h-3 animate-pixel-particle-explode"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 10px #FFD700",
            animationDelay: "0.1s",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/3 w-3 h-3 animate-pixel-particle-explode"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 10px #FFF8DC",
            animationDelay: "0.7s",
          }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-2 h-2 animate-pixel-particle-explode"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 8px #FFD700",
            animationDelay: "1.3s",
          }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-2 h-2 animate-pixel-particle-explode"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 8px #FFF8DC",
            animationDelay: "1.9s",
          }}
        />

        {/* Flashing particles - opacity pulses */}
        <div
          className="absolute top-1/6 right-1/6 w-4 h-4 animate-pixel-particle-flash"
          style={{
            backgroundColor: "#FFD700",
            boxShadow: "0 0 12px #FFD700",
            animationDelay: "0.4s",
          }}
        />
        <div
          className="absolute bottom-1/6 left-1/6 w-3 h-3 animate-pixel-particle-flash"
          style={{
            backgroundColor: "#FFF8DC",
            boxShadow: "0 0 10px #FFF8DC",
            animationDelay: "1.1s",
          }}
        />

        {/* Brutalist Frame */}
        <div className="absolute inset-0 border-8 border-black z-20" />

        <div className="relative w-full h-full flex items-center justify-center z-10">
          {dicebearUrl && (
            <img
              src={dicebearUrl}
              alt={seed}
              className="pixelated w-full h-full object-cover"
              style={{
                imageRendering: "pixelated",
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.2s steps(2)",
              }}
            />
          )}
        </div>

        {showParticles && (
          <>
            {/* Floating Particles - NEON GLOWING STYLE */}
            {/* Standard floating particles */}
            <div
              className="absolute top-1/4 left-1/4 w-3 h-3 animate-pixel-particle z-25"
              style={{
                backgroundColor: "#FFD700",
                boxShadow: "0 0 10px #FFD700, 0 0 20px #FFD700",
                animationDelay: "0s",
              }}
            />
            <div
              className="absolute top-3/4 right-1/4 w-3 h-3 animate-pixel-particle z-25"
              style={{
                backgroundColor: "#FFF8DC",
                boxShadow: "0 0 10px #FFF8DC, 0 0 20px #FFF8DC",
                animationDelay: "0.3s",
              }}
            />
            <div
              className="absolute bottom-1/4 left-3/4 w-3 h-3 animate-pixel-particle z-25"
              style={{
                backgroundColor: "#FFD700",
                boxShadow: "0 0 10px #FFD700, 0 0 20px #FFD700",
                animationDelay: "0.6s",
              }}
            />
            <div
              className="absolute top-1/5 right-1/5 w-2 h-2 animate-pixel-particle z-25"
              style={{
                backgroundColor: "#FFF8DC",
                boxShadow: "0 0 8px #FFF8DC, 0 0 16px #FFF8DC",
                animationDelay: "0.9s",
              }}
            />
            <div
              className="absolute bottom-1/5 left-1/5 w-2 h-2 animate-pixel-particle z-25"
              style={{
                backgroundColor: "#FFD700",
                boxShadow: "0 0 8px #FFD700, 0 0 16px #FFD700",
                animationDelay: "1.2s",
              }}
            />

            {/* Fast rising particles */}
            <div
              className="absolute top-1/2 left-1/2 w-2 h-2 animate-pixel-particle-fast z-25"
              style={{
                backgroundColor: "#FFD700",
                boxShadow: "0 0 10px #FFD700, 0 0 20px #FFD700",
                animationDelay: "0.5s",
              }}
            />
            <div
              className="absolute bottom-10 right-10 w-2 h-2 animate-pixel-particle-fast z-25"
              style={{
                backgroundColor: "#FFF8DC",
                boxShadow: "0 0 10px #FFF8DC, 0 0 20px #FFF8DC",
                animationDelay: "1.0s",
              }}
            />
            <div
              className="absolute top-20 left-20 w-1.5 h-1.5 animate-pixel-particle-fast z-25"
              style={{
                backgroundColor: "#FFD700",
                boxShadow: "0 0 8px #FFD700, 0 0 16px #FFD700",
                animationDelay: "1.5s",
              }}
            />
            <div
              className="absolute bottom-20 right-20 w-1.5 h-1.5 animate-pixel-particle-fast z-25"
              style={{
                backgroundColor: "#FFF8DC",
                boxShadow: "0 0 8px #FFF8DC, 0 0 16px #FFF8DC",
                animationDelay: "2.0s",
              }}
            />

            {/* Chaotic particles - LARGER */}
            <div
              className="absolute top-10 right-1/2 w-4 h-4 animate-pixel-particle-chaotic z-25"
              style={{
                backgroundColor: "#FFD700",
                boxShadow: "0 0 12px #FFD700, 0 0 24px #FFD700",
                animationDelay: "0.2s",
                opacity: 0.9,
              }}
            />
            <div
              className="absolute bottom-1/3 left-10 w-3 h-3 animate-pixel-particle-chaotic z-25"
              style={{
                backgroundColor: "#FFF8DC",
                boxShadow: "0 0 10px #FFF8DC, 0 0 20px #FFF8DC",
                animationDelay: "0.6s",
                opacity: 0.8,
              }}
            />
            <div
              className="absolute top-1/3 right-10 w-2 h-2 animate-pixel-particle-chaotic z-25"
              style={{
                backgroundColor: "#FFD700",
                boxShadow: "0 0 8px #FFD700, 0 0 16px #FFD700",
                animationDelay: "1.0s",
              }}
            />
            <div
              className="absolute bottom-10 left-1/3 w-3 h-3 animate-pixel-particle-chaotic z-25"
              style={{
                backgroundColor: "#FFF8DC",
                boxShadow: "0 0 10px #FFF8DC, 0 0 20px #FFF8DC",
                animationDelay: "1.4s",
              }}
            />
            <div
              className="absolute top-1/2 right-1/4 w-2 h-2 animate-pixel-particle-chaotic z-25"
              style={{
                backgroundColor: "#FFD700",
                boxShadow: "0 0 8px #FFD700, 0 0 16px #FFD700",
                animationDelay: "1.8s",
              }}
            />

            {/* EXPLOSIVE particles - fast scale + move */}
            <div
              className="absolute top-1/4 left-1/3 w-3 h-3 animate-pixel-particle-explode z-25"
              style={{
                backgroundColor: "#FFD700",
                boxShadow: "0 0 10px #FFD700, 0 0 20px #FFD700",
                animationDelay: "0.1s",
              }}
            />
            <div
              className="absolute bottom-1/4 right-1/3 w-3 h-3 animate-pixel-particle-explode z-25"
              style={{
                backgroundColor: "#FFF8DC",
                boxShadow: "0 0 10px #FFF8DC, 0 0 20px #FFF8DC",
                animationDelay: "0.7s",
              }}
            />
            <div
              className="absolute top-1/2 left-1/4 w-2 h-2 animate-pixel-particle-explode z-25"
              style={{
                backgroundColor: "#FFD700",
                boxShadow: "0 0 8px #FFD700, 0 0 16px #FFD700",
                animationDelay: "1.3s",
              }}
            />
            <div
              className="absolute top-1/3 right-1/4 w-2 h-2 animate-pixel-particle-explode z-25"
              style={{
                backgroundColor: "#FFF8DC",
                boxShadow: "0 0 8px #FFF8DC, 0 0 16px #FFF8DC",
                animationDelay: "1.9s",
              }}
            />

            {/* Flashing particles - opacity pulses */}
            <div
              className="absolute top-1/6 right-1/6 w-4 h-4 animate-pixel-particle-flash z-25"
              style={{
                backgroundColor: "#FFD700",
                boxShadow: "0 0 12px #FFD700, 0 0 24px #FFD700",
                animationDelay: "0.4s",
              }}
            />
            <div
              className="absolute bottom-1/6 left-1/6 w-3 h-3 animate-pixel-particle-flash z-25"
              style={{
                backgroundColor: "#FFF8DC",
                boxShadow: "0 0 10px #FFF8DC, 0 0 20px #FFF8DC",
                animationDelay: "1.1s",
              }}
            />
          </>
        )}

        {showTier && (
          <div
            className="absolute top-4 right-4 px-6 py-3 font-black text-2xl uppercase tracking-wider z-20 border-4 border-black"
            style={{
              backgroundColor: activeColor,
              color: "#000",
              boxShadow: "4px 4px 0px 0px #000",
            }}
          >
            T{tier}
          </div>
        )}

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${activeColor}, ${activeColor} 1px, transparent 1px, transparent 10px)`,
            opacity: 0.15,
          }}
        />
      </div>
    </div>
  );
}

// Map color names to hex values for the component to use
const COLOR_MAP: Record<string, string> = {
  purple: "#836EF9",
  pink: "#EC4899",
  amber: "#F59E0B",
  blue: "#3B82F6",
  cyan: "#06B6D4",
  red: "#EF4444",
  green: "#22C55E",
  orange: "#F97316",
  indigo: "#6366F1",
  rose: "#F43F5E",
};
