import { MailSender } from "../../src/modules/application/gateways/mail-sender";

export class FakeMailSender implements MailSender {
  public readonly sent: { to: string; token: string }[] = [];

  async sendPasswordResetLink(params: {
    to: string;
    token: string;
  }): Promise<void> {
    this.sent.push({ to: params.to, token: params.token });
  }
}
