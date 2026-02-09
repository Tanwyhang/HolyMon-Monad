import { NextRequest, NextResponse } from "next/server";
import type { CreateAgentRequest, CreateAgentResponse } from "@/types/agent";
import {
  createAgent as createAgentStorage,
  getAgentAsCharacter,
} from "@/lib/agent-storage";
import { toElizaCharacter } from "@/lib/agent-converter";

export async function POST(request: NextRequest) {
  try {
    const body: CreateAgentRequest = await request.json();

    const { name, symbol, slug, prompt, backstory, visualTraits, elizaos } =
      body;

    if (!name || !symbol || !slug) {
      return NextResponse.json(
        { error: "name, symbol, and slug are required" },
        { status: 400 },
      );
    }

    if (symbol.length < 3 || symbol.length > 8) {
      return NextResponse.json(
        { error: "symbol must be 3-8 characters" },
        { status: 400 },
      );
    }

    if (!/^[A-Z0-9]+$/.test(symbol)) {
      return NextResponse.json(
        { error: "symbol must be uppercase letters and numbers only" },
        { status: 400 },
      );
    }

    if (!slug || slug.length < 3) {
      return NextResponse.json(
        { error: "slug must be at least 3 characters" },
        { status: 400 },
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "slug must be lowercase letters and numbers only" },
        { status: 400 },
      );
    }

    const agent = createAgentStorage({
      name,
      symbol,
      slug,
      prompt,
      backstory,
      visualTraits,
      elizaos,
    });

    // Check if client wants ElizaOS Character format
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format");

    if (format === "character") {
      const character = toElizaCharacter(agent);
      return NextResponse.json(
        {
          success: true,
          agent: character,
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        },
      );
    }

    const response: CreateAgentResponse = {
      success: true,
      agent,
    };

    return NextResponse.json(response, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("[API Agent Create] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create agent",
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
