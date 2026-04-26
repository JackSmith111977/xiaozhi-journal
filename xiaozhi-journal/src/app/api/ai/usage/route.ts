import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    platformCalls: 0,
    dailyLimit: 5,
  })
}
