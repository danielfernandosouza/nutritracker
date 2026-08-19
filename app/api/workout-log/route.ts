import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toDateKey } from "@/lib/date";
import { computeStreakFromDates } from "@/lib/streak";

export async function GET() {
  const rows = await prisma.workoutLog.findMany({
    distinct: ["date"],
    orderBy: { createdAt: "desc" },
  });
  const dates = new Set(rows.map((r) => r.date));
  const streak = computeStreakFromDates(dates);
  const todayKey = toDateKey(new Date());
  const today = rows.find((r) => r.date === todayKey) ?? null;

  return NextResponse.json({ streak, loggedToday: !!today, today });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, workoutName, durationMinutes, caloriesBurned, photo } = body;

  if (!date || !workoutName) {
    return NextResponse.json({ error: "date and workoutName are required" }, { status: 400 });
  }

  const data = {
    workoutName,
    durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) || null : undefined,
    caloriesBurned: caloriesBurned !== undefined ? Number(caloriesBurned) || null : undefined,
    photo: photo !== undefined ? photo || null : undefined,
  };

  const existing = await prisma.workoutLog.findFirst({ where: { date } });
  const log = existing
    ? await prisma.workoutLog.update({ where: { id: existing.id }, data })
    : await prisma.workoutLog.create({ data: { date, ...data } });

  return NextResponse.json({ log }, { status: existing ? 200 : 201 });
}
