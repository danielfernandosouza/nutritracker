import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

const FROM = "NutriTracker <naoresponda@nutritracker.com.br>";

const LOGO_URL = "https://nutritracker-plum.vercel.app/icons/icon-512.png";

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await getClient().emails.send({
    from: FROM,
    to,
    subject: "Redefinir sua senha — NutriTracker",
    html: `
      <div style="margin:0;padding:32px 16px;background-color:#0B0B0C;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background-color:#FAF9F4;border-radius:20px;overflow:hidden;">
          <tr>
            <td style="background-color:#0B0B0C;background-image:linear-gradient(135deg,#1A1D0F,#0B0B0C);padding:28px 32px;text-align:center;">
              <img src="${LOGO_URL}" width="48" height="48" alt="NutriTracker" style="border-radius:12px;display:block;margin:0 auto 12px;">
              <span style="color:#C6FF3D;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">NutriTracker</span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 8px;">
              <h1 style="margin:0 0 16px;color:#1C1C1A;font-size:22px;font-weight:700;">Redefinir sua senha</h1>
              <p style="margin:0 0 24px;color:#4A4A45;font-size:15px;line-height:1.6;">
                Recebemos um pedido pra redefinir a senha da sua conta no NutriTracker. Clique no botão
                abaixo pra escolher uma senha nova. Esse link expira em 30 minutos.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <a href="${resetUrl}" style="display:inline-block;background-color:#C6FF3D;color:#0B0B0C;font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;">
                Redefinir senha
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;border-top:1px solid #ECEAE0;">
              <p style="margin:20px 0 0;color:#8B887E;font-size:12.5px;line-height:1.6;">
                Se você não pediu isso, pode ignorar esse e-mail — sua senha continua a mesma.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;text-align:center;color:#5C5C58;font-size:11.5px;">NutriTracker · nutritracker.com.br</p>
      </div>
    `,
  });
}
