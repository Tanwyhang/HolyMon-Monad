import { NextRequest, NextResponse } from "next/server";
import {
  getAgents as getAgentsStorage,
  getAgentStatsSummary,
  getAllAgentsAsCharacters,
} from "@/lib/agent-storage";
import type { HolyMonAgent } from "@/types/agent";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const format = searchParams.get("format");

    // Check if client wants ElizaOS Character format
    if (format === "character") {
      const characters = getAllAgentsAsCharacters();
      const filteredCharacters = userId
        ? characters.filter((c) => {
            const settings = c.settings as Record<string, unknown>;
            const hmData = settings?.holyMonData as HolyMonAgent | undefined;
            return hmData?.owner === userId;
          })
        : characters;

      return NextResponse.json(
        {
          success: true,
          agents: filteredCharacters,
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        },
      );
    }

    // Default HolyMon format
    const agents = getAgentsStorage();

    const filteredAgents = userId
      ? agents.filter((a) => a.owner === userId)
      : agents;

    const summary = getAgentStatsSummary();

    return NextResponse.json(
      {
        success: true,
        agents: filteredAgents,
        summary,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  } catch (error) {
    console.error("[API Agent List] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch agents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
