import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UNLOCK_COOKIE_NAME } from "@/lib/session-lock";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  // Sessão válida sozinha não basta mais pra pular esta tela (ver middleware.ts) — só pula se o
  // cookie de "destravado" também estiver presente, cobrindo o caso de voltar pelo histórico do
  // navegador enquanto ainda destravado nesta abertura do app. Checagem no servidor: sem flash do
  // formulário, sem depender de nenhum modal capturar o gesto de voltar.
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  if (session?.user && cookieStore.get(UNLOCK_COOKIE_NAME)) {
    redirect("/home");
  }

  return <LoginForm />;
}
