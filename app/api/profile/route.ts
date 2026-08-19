import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeTargets, computeBMI, type ProfileInput } from "@/lib/calculations";

export async function GET() {
  const profile = await prisma.profile.findUnique({ where: { id: "me" } });

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

  return NextResponse.json({
    profile,
    targets: computeTargets(input),
    bmi: computeBMI(profile.weightKg, profile.heightCm),
  });
}

export async function PUT(request: NextRequest) {
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
  };

  const profile = await prisma.profile.upsert({
    where: { id: "me" },
    create: { id: "me", ...data },
    update: data,
  });

  return NextResponse.json({ profile });
}
