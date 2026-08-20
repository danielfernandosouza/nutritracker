import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { toDateKey, lastDateKeys } from "@/lib/date";
import { computeStreakFromDates } from "@/lib/streak";
import { isPhotoTooLarge } from "@/lib/photo";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await prisma.workoutLog.findMany({
    where: { userId: session.user.id },
    distinct: ["date"],
    orderBy: { createdAt: "desc" },
  });
  const dates = new Set(rows.map((r) => r.date));
  const streak = computeStreakFromDates(dates);
  const todayKey = toDateKey(new Date());
  const today = rows.find((r) => r.date === todayKey) ?? null;

  const weekWindow = new Set(lastDateKeys(7));
  const weekRows = rows.filter((r) => weekWindow.has(r.date));
  const weekDates = [...new Set(weekRows.map((r) => r.date))];
  const weekPlanDayIds = [...new Set(weekRows.map((r) => r.planDayId).filter((id): id is string => !!id))];

  return NextResponse.json({ streak, loggedToday: !!today, today, weekDates, weekPlanDayIds });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { date, workoutName, planDayId, durationMinutes, caloriesBurned, photo } = body;

  if (!date || !workoutName) {
    return NextResponse.json({ error: "date and workoutName are required" }, { status: 400 });
  }
  if (isPhotoTooLarge(photo)) {
    return NextResponse.json({ error: "Foto muito grande. Tente uma imagem menor." }, { status: 413 });
  }

  const data = {
    workoutName,
    planDayId: planDayId !== undefined ? planDayId || null : undefined,
    durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) || null : undefined,
    caloriesBurned: caloriesBurned !== undefined ? Number(caloriesBurned) || null : undefined,
    photo: photo !== undefined ? photo || null : undefined,
  };

  const existing = await prisma.workoutLog.findFirst({ where: { date, userId: session.user.id } });
  const log = existing
    ? await prisma.workoutLog.update({ where: { id: existing.id }, data })
    : await prisma.workoutLog.create({ data: { date, userId: session.user.id, ...data } });

  return NextResponse.json({ log }, { status: existing ? 200 : 201 });
}
