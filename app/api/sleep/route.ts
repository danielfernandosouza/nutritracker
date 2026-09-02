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

/** Edita um registro existente por id — mesmo padrão já usado em peso e refeições. */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, bedTime, wakeTime } = body;

  const timePattern = /^\d{2}:\d{2}$/;
  if (!id || !timePattern.test(bedTime ?? "") || !timePattern.test(wakeTime ?? "")) {
    return NextResponse.json({ error: "id, bedTime and wakeTime (HH:MM) are required" }, { status: 400 });
  }

  const { count } = await prisma.sleepEntry.updateMany({
    where: { id, userId: session.user.id },
    data: { bedTime, wakeTime },
  });
  if (count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });

  const entry = await prisma.sleepEntry.findUnique({ where: { id } });
  return NextResponse.json({ entry });
}
