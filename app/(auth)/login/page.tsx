import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  // Voltar pelo histórico do navegador (ex: várias telas atrás, com um modal aberto que não
  // capturou o gesto) pode pousar aqui mesmo com a sessão ainda válida — sem isso, o usuário via
  // a tela de login e parecia ter sido deslogado, quando na verdade a sessão nunca caiu. Checar no
  // servidor, antes de renderizar qualquer coisa, evita a corrida que existia com o auto-login por
  // biometria quando isso era feito num useEffect no cliente (ver histórico do commit 690e431).
  const session = await auth();
  if (session?.user) redirect("/home");

  return <LoginForm />;
}
