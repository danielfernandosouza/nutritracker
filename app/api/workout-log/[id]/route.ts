import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { estimateCardioBurnKcal, type CardioActivity } from "@/lib/cardio-burn";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.workoutLog.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body = await request.json();
  const { workoutName, cardioActivity, distanceKm, durationMinutes, caloriesBurned } = body;

  const nextDistanceKm = distanceKm !== undefined ? Number(distanceKm) || null : existing.distanceKm;
  const nextDurationMinutes = durationMinutes !== undefined ? Number(durationMinutes) || null : existing.durationMinutes;
  const nextActivity = cardioActivity !== undefined ? cardioActivity || null : existing.cardioActivity;

  let nextCalories = caloriesBurned !== undefined ? Number(caloriesBurned) || null : existing.caloriesBurned;
  const distanceOrDurationChanged = nextDistanceKm !== existing.distanceKm || nextDurationMinutes !== existing.durationMinutes;
  if (existing.type === "CARDIO" && caloriesBurned === undefined && distanceOrDurationChanged && nextDistanceKm && nextDurationMinutes) {
    const profile = await prisma.profile.findUnique({ where: { id: session.user.id }, select: { weightKg: true } });
    if (profile) {
      nextCalories = Math.round(
        estimateCardioBurnKcal((nextActivity as CardioActivity) || "RUN", nextDistanceKm, nextDurationMinutes, profile.weightKg),
      );
    }
  }

  const log = await prisma.workoutLog.update({
    where: { id },
    data: {
      workoutName: workoutName !== undefined ? workoutName : undefined,
      cardioActivity: nextActivity,
      distanceKm: nextDistanceKm,
      durationMinutes: nextDurationMinutes,
      paceMinPerKm: nextDistanceKm && nextDurationMinutes ? nextDurationMinutes / nextDistanceKm : null,
      caloriesBurned: nextCalories,
    },
  });

  return NextResponse.json({ log });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.workoutLog.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.workoutLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
