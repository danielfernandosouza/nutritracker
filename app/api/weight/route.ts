import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const from = request.nextUrl.searchParams.get("from");

  const entries = await prisma.weightEntry.findMany({
    where: { userId: session.user.id, ...(from ? { date: { gte: from } } : {}) },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { date, weightKg } = body;

  if (!date || !weightKg) {
    return NextResponse.json({ error: "date and weightKg are required" }, { status: 400 });
  }

  const existing = await prisma.weightEntry.findFirst({ where: { date, userId: session.user.id } });
  const entry = existing
    ? await prisma.weightEntry.update({ where: { id: existing.id }, data: { weightKg: Number(weightKg) } })
    : await prisma.weightEntry.create({ data: { date, weightKg: Number(weightKg), userId: session.user.id } });

  return NextResponse.json({ entry }, { status: existing ? 200 : 201 });
}
