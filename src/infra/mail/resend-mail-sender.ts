import { Injectable } from "@nestjs/common";
import { Resend } from "resend";
import { MailSender } from "../../modules/application/gateways/mail-sender";
import { EnvService } from "../env/env.service";

@Injectable()
export class ResendMailSender implements MailSender {
  private readonly resend: Resend;

  constructor(private readonly envService: EnvService) {
    this.resend = new Resend(this.envService.get("RESEND_API_KEY"));
  }

  async sendPasswordResetLink(params: {
    to: string;
    token: string;
  }): Promise<void> {
    const resetUrl = new URL(
      this.envService.get("PASSWORD_RESET_PATH"),
      this.envService.get("FRONTEND_URL"),
    );

    resetUrl.searchParams.set("token", params.token);

    await this.resend.emails.send({
      from: this.envService.get("RESEND_FROM_EMAIL"),
      to: params.to,
      subject: "Recuperacao de senha",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Recuperacao de senha</h2>
          <p>Recebemos uma solicitacao para redefinir sua senha.</p>
          <p>Clique no link abaixo para continuar:</p>
          <p>
            <a href="${resetUrl.toString()}">${resetUrl.toString()}</a>
          </p>
          <p>Se voce nao solicitou, ignore este e-mail.</p>
        </div>
      `,
      text: `Recuperacao de senha\n\nAcesse o link para redefinir sua senha: ${resetUrl.toString()}`,
    });
  }
}
