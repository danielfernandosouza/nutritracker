import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const date = request.nextUrl.searchParams.get("date");
  const exerciseId = request.nextUrl.searchParams.get("exerciseId");
  const days = request.nextUrl.searchParams.get("days");

  if (exerciseId) {
    const from = new Date();
    from.setDate(from.getDate() - (days ? Number(days) : 14));
    const fromKey = from.toISOString().slice(0, 10);
    const sets = await prisma.exerciseSetLog.findMany({
      where: { userId: session.user.id, exerciseId, date: { gte: fromKey } },
      orderBy: [{ date: "asc" }, { setNumber: "asc" }],
      select: { date: true, setNumber: true, weightKg: true, reps: true },
    });
    return NextResponse.json({ sets });
  }

  if (!date) {
    return NextResponse.json({ error: "date or exerciseId is required" }, { status: 400 });
  }
  const sets = await prisma.exerciseSetLog.findMany({
    where: { userId: session.user.id, date },
    select: { exerciseId: true, setNumber: true, weightKg: true, reps: true },
  });
  return NextResponse.json({ sets });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { date, exerciseId, exerciseName, setNumber, weightKg, reps } = body;

  if (!date || !exerciseId || !exerciseName || !setNumber) {
    return NextResponse.json({ error: "date, exerciseId, exerciseName and setNumber are required" }, { status: 400 });
  }

  const existing = await prisma.exerciseSetLog.findFirst({
    where: { userId: session.user.id, date, exerciseId, setNumber: Number(setNumber) },
  });
  const data = {
    weightKg: weightKg !== undefined && weightKg !== null && weightKg !== "" ? Number(weightKg) : null,
    reps: reps !== undefined && reps !== null && reps !== "" ? Number(reps) : null,
  };
  const log = existing
    ? await prisma.exerciseSetLog.update({ where: { id: existing.id }, data })
    : await prisma.exerciseSetLog.create({
        data: { userId: session.user.id, date, exerciseId, exerciseName, setNumber: Number(setNumber), ...data },
      });

  return NextResponse.json({ log }, { status: existing ? 200 : 201 });
}
