import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8765";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/agents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-owner-address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Backend Proxy] Error creating agent:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create agent",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");

    const response = await fetch(
      `${BACKEND_URL}/api/agents?owner=${owner || ""}`,
      {
        method: "GET",
      },
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Backend Proxy] Error listing agents:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list agents",
      },
      { status: 500 },
    );
  }
}
