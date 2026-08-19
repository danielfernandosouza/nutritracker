import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");

  const entries = await prisma.weightEntry.findMany({
    where: from ? { date: { gte: from } } : undefined,
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, weightKg } = body;

  if (!date || !weightKg) {
    return NextResponse.json({ error: "date and weightKg are required" }, { status: 400 });
  }

  const existing = await prisma.weightEntry.findFirst({ where: { date } });
  const entry = existing
    ? await prisma.weightEntry.update({ where: { id: existing.id }, data: { weightKg: Number(weightKg) } })
    : await prisma.weightEntry.create({ data: { date, weightKg: Number(weightKg) } });

  return NextResponse.json({ entry }, { status: existing ? 200 : 201 });
}
