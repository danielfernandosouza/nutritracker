import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

/**
 * Sem domínio verificado no Resend, o remetente precisa ser esse endereço sandbox — e, nesse
 * modo, o Resend só entrega pro e-mail dono da conta usada pra gerar a API key.
 */
const FROM = "NutriTracker <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await getClient().emails.send({
    from: FROM,
    to,
    subject: "Redefinir sua senha — NutriTracker",
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0B0B0C;">Redefinir sua senha</h2>
        <p style="color: #444; line-height: 1.5;">
          Recebemos um pedido pra redefinir a senha da sua conta no NutriTracker. Clique no botão
          abaixo pra escolher uma senha nova. Esse link expira em 30 minutos.
        </p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #c6ff3d; color: #0B0B0C; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">
            Redefinir senha
          </a>
        </p>
        <p style="color: #888; font-size: 13px; line-height: 1.5;">
          Se você não pediu isso, pode ignorar esse e-mail — sua senha continua a mesma.
        </p>
      </div>
    `,
  });
}
