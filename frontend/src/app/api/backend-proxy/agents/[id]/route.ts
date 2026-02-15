import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8765";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const agentId = resolvedParams.id;

    const response = await fetch(`${BACKEND_URL}/api/agents/${agentId}`, {
      method: "GET",
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Backend Proxy] Error getting agent:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get agent",
      },
      { status: 500 },
    );
  }
}
