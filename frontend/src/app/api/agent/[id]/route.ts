import { NextRequest, NextResponse } from "next/server";
import {
  getAgentById as getAgentStorage,
  getAgentAsCharacter,
} from "@/lib/agent-storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const agentId = resolvedParams.id;

    if (!agentId) {
      return NextResponse.json(
        { error: "agent ID is required" },
        { status: 400 },
      );
    }

    // Check if client wants ElizaOS Character format
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format");

    if (format === "character") {
      const character = getAgentAsCharacter(agentId);

      if (!character) {
        return NextResponse.json({ error: "agent not found" }, { status: 404 });
      }

      return NextResponse.json(
        {
          success: true,
          agent: character,
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

    const agent = getAgentStorage(agentId);

    if (!agent) {
      return NextResponse.json({ error: "agent not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        agent,
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
    console.error("[API Agent Get] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch agent",
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
