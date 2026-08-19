import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  if (!date && !(from && to)) {
    return NextResponse.json({ error: "date, or from+to, is required" }, { status: 400 });
  }

  const meals = await prisma.meal.findMany({
    where: date ? { date } : { date: { gte: from!, lte: to! } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ meals });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, name, calories, protein, carbs, fat, sodium, sugar, emoji, photo } = body;

  if (!date || !name) {
    return NextResponse.json({ error: "date and name are required" }, { status: 400 });
  }

  const meal = await prisma.meal.create({
    data: {
      date,
      name,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      sodium: Number(sodium) || 0,
      sugar: Number(sugar) || 0,
      emoji: emoji || "🍽️",
      photo: photo || null,
    },
  });

  return NextResponse.json({ meal }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, calories, protein, carbs, fat, sodium, sugar, emoji, photo } = body;

  if (!id || !name) {
    return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  }

  const meal = await prisma.meal.update({
    where: { id },
    data: {
      name,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      sodium: Number(sodium) || 0,
      sugar: Number(sugar) || 0,
      emoji: emoji || "🍽️",
      photo: photo === undefined ? undefined : photo || null,
    },
  });

  return NextResponse.json({ meal });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.meal.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
