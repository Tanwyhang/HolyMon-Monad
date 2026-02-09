import Image from "next/image";

interface AgentAvatarProps {
  seed: string;
  size?: number;
  className?: string;
}

const FUN_BACKGROUNDS = [
  "ffdfbf", // Peach
  "c0aede", // Lavender
  "d1d4f9", // Periwinkle
  "b6e3f4", // Sky Blue
  "ffd5dc", // Pink
  "c5fcfb", // Cyan
  "d6f6d5", // Mint
  "fcf4dd", // Cream
  "eecbff", // Violet
  "ffc6ff", // Rose
];

export function AgentAvatar({
  seed,
  size = 48,
  className = "",
}: AgentAvatarProps) {
  // Deterministically select a background color based on the seed
  const bgIndex =
    seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    FUN_BACKGROUNDS.length;
  const bgColor = FUN_BACKGROUNDS[bgIndex];

  // Using pixel-art with the selected fun background color
  const src = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${seed}&backgroundColor=${bgColor}`;

  return (
    <div
      className={`relative overflow-hidden rounded-sm border-2 border-[#4a4a4a] flex items-center justify-center group ${className}`}
      style={{ width: size, height: size, backgroundColor: `#${bgColor}` }}
    >
      {/* Divine Aura (Inner Glow) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <img
        src={src}
        alt={`Avatar for ${seed}`}
        width={size}
        height={size}
        className="w-full h-full object-cover rendering-pixelated filter contrast-110 hover:brightness-110 transition-all duration-300"
        style={{ imageRendering: "pixelated" }}
      />

      {/* Holy Glint Overlay */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-white/30 to-transparent pointer-events-none" />
    </div>
  );
}
