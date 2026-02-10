"use client";

import Link from "next/link";
import LiveFaithTheater from "@/components/live-faith-theater";

export default function TournamentArena() {
  return (
    <main className="h-screen bg-black text-white font-sans flex flex-col overflow-hidden">
      <div className="flex-1 relative">
        <LiveFaithTheater />
      </div>
    </main>
  );
}
