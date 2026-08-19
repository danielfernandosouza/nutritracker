import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { anthropic, MODEL, MEAL_ESTIMATE_TOOL, WORKOUT_ESTIMATE_TOOL, buildSystemPrompt, buildWorkoutSystemPrompt } from "@/lib/anthropic";
import { prisma } from "@/lib/db";
import { computeTargets, type ProfileInput } from "@/lib/calculations";
import { isPhotoTooLarge } from "@/lib/photo";
import type { MealTotals } from "@/lib/targets";

export const maxDuration = 60;

type ChatRequestBody = {
  message?: string;
  images?: { data: string; mediaType: string }[];
  dayTotals: MealTotals;
  mode?: "meal" | "workout";
};

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_IMAGES = 3;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json()) as ChatRequestBody;
  const { message, images, dayTotals, mode = "meal" } = body;

  if (!message && (!images || images.length === 0)) {
    return NextResponse.json({ error: "message or images is required" }, { status: 400 });
  }
  if (images && images.length > MAX_IMAGES) {
    return NextResponse.json({ error: `Envie no máximo ${MAX_IMAGES} fotos por vez.` }, { status: 400 });
  }
  if (images?.some((img) => isPhotoTooLarge(img.data))) {
    return NextResponse.json({ error: "Foto muito grande. Tente uma imagem menor." }, { status: 413 });
  }

  const profile = await prisma.profile.findUnique({ where: { id: session.user.id } });
  if (!profile) {
    return NextResponse.json({ error: "Perfil não configurado. Complete o cadastro primeiro." }, { status: 400 });
  }
  const targets = computeTargets({
    sex: profile.sex as ProfileInput["sex"],
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    activityLevel: profile.activityLevel as ProfileInput["activityLevel"],
    goal: profile.goal as ProfileInput["goal"],
  });

  const content: Anthropic.ContentBlockParam[] = [];

  for (const image of images ?? []) {
    if (!ALLOWED_IMAGE_TYPES.has(image.mediaType)) {
      return NextResponse.json({ error: "unsupported image type" }, { status: 400 });
    }
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: image.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: image.data,
      },
    });
  }

  const hasImages = !!images && images.length > 0;
  const multiPhotoNote =
    hasImages && images.length > 1
      ? " As fotos são ângulos diferentes da mesma refeição — combine as informações de todas elas numa única estimativa."
      : "";

  content.push({
    type: "text",
    text:
      message ||
      (mode === "workout"
        ? "Leia a duração e as calorias gastas nessa foto."
        : `Estime os valores nutricionais dessa refeição.${multiPhotoNote}`),
  });

  const tool = mode === "workout" ? WORKOUT_ESTIMATE_TOOL : MEAL_ESTIMATE_TOOL;
  const system = mode === "workout" ? buildWorkoutSystemPrompt() : buildSystemPrompt(dayTotals, targets);

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      output_config: { effort: "low" },
      system,
      tools: [tool],
      tool_choice: hasImages ? { type: "tool", name: tool.name } : { type: "auto" },
      messages: [{ role: "user", content }],
    });

    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === tool.name) {
        return NextResponse.json({ type: "estimate", data: block.input });
      }
      if (block.type === "text") {
        return NextResponse.json({ type: "text", text: block.text });
      }
    }

    return NextResponse.json({ type: "text", text: "Não consegui gerar uma resposta." });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "Chave de API inválida ou ausente." }, { status: 500 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Limite de requisições atingido, tente novamente em instantes." }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: error.message }, { status: error.status ?? 500 });
    }
    throw error;
  }
}
