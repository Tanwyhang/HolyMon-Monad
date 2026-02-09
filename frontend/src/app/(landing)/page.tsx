import { Suspense } from "react";

import { Footer } from "@/components/footer";
import { LandingTextarea } from "@/components/landing-textarea";
import { LandingChatSessions } from "@/components/landing-chat-sessions";
import { PingPongVideo } from "@/components/ping-pong-video";

export default function Page() {
  return (
    <main className="flex-1 size-full overflow-hidden flex flex-col relative">
      {/* Background video with ping-pong looping */}
      <PingPongVideo />
      <div className="flex-1 size-full overflow-hidden flex flex-col justify-center items-center gap-8 px-4 md:px-0 relative z-10">
        <h1 className="text-3xl xl:text-4xl font-semibold text-center tracking-tighter text-pretty">
          Ask anything about Eliza
        </h1>
        <div className="max-w-xl mx-auto w-full">
          <Suspense fallback={null}>
            <LandingTextarea />
          </Suspense>
        </div>

        {/* Previous Chat Sessions */}
        <div className="max-w-2xl mx-auto w-full">
          <Suspense fallback={null}>
            <LandingChatSessions />
          </Suspense>
        </div>
      </div>
      <div className="relative z-10">
        <Footer />
      </div>
    </main>
  );
}
