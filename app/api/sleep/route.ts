import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const date = request.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const entry = await prisma.sleepEntry.findFirst({ where: { userId: session.user.id, date } });
  return NextResponse.json({ entry });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { date, bedTime, wakeTime } = body;

  const timePattern = /^\d{2}:\d{2}$/;
  if (!date || !timePattern.test(bedTime ?? "") || !timePattern.test(wakeTime ?? "")) {
    return NextResponse.json({ error: "date, bedTime and wakeTime (HH:MM) are required" }, { status: 400 });
  }

  const existing = await prisma.sleepEntry.findFirst({ where: { date, userId: session.user.id } });
  const entry = existing
    ? await prisma.sleepEntry.update({ where: { id: existing.id }, data: { bedTime, wakeTime } })
    : await prisma.sleepEntry.create({ data: { date, bedTime, wakeTime, userId: session.user.id } });

  return NextResponse.json({ entry }, { status: existing ? 200 : 201 });
}
