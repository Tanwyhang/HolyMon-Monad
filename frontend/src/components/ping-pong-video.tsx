"use client";

/**
 * PingPongVideo Component
 *
 * Simple fullscreen background video that:
 * 1. Plays automatically when the page loads
 * 2. Covers the entire viewport and scales correctly
 * 3. Loops infinitely using native loop attribute
 * 4. Has no visible controls
 */
export function PingPongVideo() {
  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden">
      <video
        src="/landing.webm"
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        style={{
          objectFit: "cover",
          objectPosition: "center",
        }}
      />
    </div>
  );
}
