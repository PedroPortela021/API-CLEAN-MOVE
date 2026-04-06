import { MailSender } from "../../src/modules/application/repositories/mail-sender";

export class FakeMailSender implements MailSender {
  public readonly sent: { to: string; code: string }[] = [];

  async sendPasswordResetCode(params: {
    to: string;
    code: string;
  }): Promise<void> {
    this.sent.push({ to: params.to, code: params.code });
  }
}
