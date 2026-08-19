import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const date = request.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const entries = await prisma.waterEntry.findMany({
    where: { userId: session.user.id, date },
    orderBy: { createdAt: "asc" },
  });

  const totalMl = entries.reduce((sum, e) => sum + e.amountMl, 0);
  return NextResponse.json({ entries, totalMl });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { date, amountMl } = body;

  if (!date || !amountMl || Number(amountMl) <= 0) {
    return NextResponse.json({ error: "date and amountMl are required" }, { status: 400 });
  }

  const entry = await prisma.waterEntry.create({
    data: { date, amountMl: Math.round(Number(amountMl)), userId: session.user.id },
  });

  return NextResponse.json({ entry }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await prisma.waterEntry.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
