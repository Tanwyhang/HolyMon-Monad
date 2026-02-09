"use client";

import Link from "next/link";
import { PingPongVideo } from "@/components/ping-pong-video";
import { ThreeSpam } from "@/components/three-spam";
import { pressStart2P } from "@/app/fonts";

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#050505] text-gray-200 flex flex-col items-center justify-center px-4 relative overflow-hidden font-mono selection:bg-amber-500 selection:text-black">
      {/* PING-PONG VIDEO BACKGROUND */}
      <PingPongVideo />

      {/* 3D SPAM OBJECTS */}
      <ThreeSpam />

      <div className="max-w-6xl w-full text-center relative z-10 flex flex-col items-center gap-8">
        {/* Logo/Title with retro game style - EXTRA BIG */}
        <h1
          className={`${pressStart2P.className} text-6xl md:text-8xl lg:text-9xl mb-4 tracking-tighter uppercase text-white drop-shadow-[6px_6px_0_#836EF9] hover:drop-shadow-[8px_8px_0_#d97706] transition-all duration-300 transform hover:-translate-y-2`}
        >
          HolyMon
        </h1>

        {/* Fun, Big Brutalist Button */}
        <Link
          href="/dashboard"
          className="mt-8 group relative inline-flex items-center justify-center scale-110 hover:scale-125 transition-transform duration-300"
        >
          <span className="absolute inset-0 w-full h-full bg-[#836EF9] translate-x-3 translate-y-3 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-200 ease-out border-4 border-black" />
          <span className="relative inline-block px-12 py-6 bg-white border-4 border-black text-black font-black text-2xl md:text-3xl uppercase tracking-widest group-hover:-translate-y-1 group-hover:-translate-x-1 transition-transform duration-200 ease-out hover:bg-amber-400">
            Launch App
          </span>
        </Link>
      </div>
    </main>
  );
}
