import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: process.env.ALUDAAI_DATABASE_URL ? "configured" : "not configured",
    flowise: process.env.ALUDAAI_FLOWISE_HOST ? "configured" : "not configured"
  })
}
