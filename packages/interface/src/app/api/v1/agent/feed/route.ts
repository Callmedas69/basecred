import { NextResponse } from "next/server"
import { createActivityRepository } from "@/repositories/activityRepository"

/**
 * GET /api/v1/agent/feed — Public global activity feed (no auth)
 * Returns last 20 agent reputation checks.
 */
export async function GET() {
  try {
    const repo = createActivityRepository()
    const entries = await repo.getGlobalFeed(20)
    return NextResponse.json({ entries })
  } catch (error: unknown) {
    console.error("Get global feed error:", error)
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
