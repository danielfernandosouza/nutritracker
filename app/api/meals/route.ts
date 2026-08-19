import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isPhotoTooLarge } from "@/lib/photo";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const date = request.nextUrl.searchParams.get("date");
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  if (!date && !(from && to)) {
    return NextResponse.json({ error: "date, or from+to, is required" }, { status: 400 });
  }

  const meals = await prisma.meal.findMany({
    where: { userId: session.user.id, ...(date ? { date } : { date: { gte: from!, lte: to! } }) },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ meals });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { date, name, calories, protein, carbs, fat, sodium, sugar, emoji, photo } = body;

  if (!date || !name) {
    return NextResponse.json({ error: "date and name are required" }, { status: 400 });
  }
  if (isPhotoTooLarge(photo)) {
    return NextResponse.json({ error: "Foto muito grande. Tente uma imagem menor." }, { status: 413 });
  }

  const meal = await prisma.meal.create({
    data: {
      userId: session.user.id,
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
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, name, calories, protein, carbs, fat, sodium, sugar, emoji, photo } = body;

  if (!id || !name) {
    return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  }
  if (isPhotoTooLarge(photo)) {
    return NextResponse.json({ error: "Foto muito grande. Tente uma imagem menor." }, { status: 413 });
  }

  const { count } = await prisma.meal.updateMany({
    where: { id, userId: session.user.id },
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

  if (count === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const meal = await prisma.meal.findUnique({ where: { id } });
  return NextResponse.json({ meal });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.meal.deleteMany({ where: { id, userId: session.user.id } });

  return NextResponse.json({ ok: true });
}
