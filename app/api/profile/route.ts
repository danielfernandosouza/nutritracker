import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { computeTargets, computeBMI, type ProfileInput } from "@/lib/calculations";
import { computeWaterTargetMl, computeSleepTargetHours } from "@/lib/wellness";
import { lastDateKeys } from "@/lib/date";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { id: session.user.id } });

  if (!profile) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const input: ProfileInput = {
    sex: profile.sex as ProfileInput["sex"],
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    activityLevel: profile.activityLevel as ProfileInput["activityLevel"],
    goal: profile.goal as ProfileInput["goal"],
  };

  const yesterday = lastDateKeys(2)[0];
  const workedOutYesterday = !!(await prisma.workoutLog.findFirst({
    where: { userId: session.user.id, date: yesterday },
    select: { id: true },
  }));
  const sleepTarget = computeSleepTargetHours(profile.age, workedOutYesterday);

  return NextResponse.json({
    profile,
    targets: computeTargets(input),
    bmi: computeBMI(profile.weightKg, profile.heightCm),
    wellness: {
      waterTargetMl: computeWaterTargetMl(input),
      sleepTargetMinHours: sleepTarget.minHours,
      sleepTargetMaxHours: sleepTarget.maxHours,
    },
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    name,
    sex,
    age,
    heightCm,
    weightKg,
    activityLevel,
    goal,
    exerciseNotes,
    mealsPerDay,
    daysPerWeek,
    splitStyle,
    equipmentPreference,
    favoriteMuscleGroups,
    restWeekdays,
  } = body;

  if (!sex || !age || !heightCm || !weightKg || !activityLevel || !goal) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  const data = {
    name: name || null,
    sex,
    age: Number(age),
    heightCm: Number(heightCm),
    weightKg: Number(weightKg),
    activityLevel,
    goal,
    exerciseNotes: exerciseNotes || null,
    mealsPerDay: mealsPerDay ? Number(mealsPerDay) : null,
    daysPerWeek: daysPerWeek ? Number(daysPerWeek) : null,
    splitStyle: splitStyle || null,
    equipmentPreference: equipmentPreference || null,
    favoriteMuscleGroups: Array.isArray(favoriteMuscleGroups) ? favoriteMuscleGroups : [],
    // Omitted (not an array) leaves the existing value alone on update, and falls back to the
    // schema default ([]) on create — unlike favoriteMuscleGroups above, edits made from the
    // onboarding wizard (which doesn't know about rest days) shouldn't silently wipe them out.
    ...(Array.isArray(restWeekdays)
      ? { restWeekdays: restWeekdays.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) }
      : {}),
  };

  const profile = await prisma.profile.upsert({
    where: { id: session.user.id },
    create: { id: session.user.id, ...data },
    update: data,
  });

  return NextResponse.json({ profile });
}
