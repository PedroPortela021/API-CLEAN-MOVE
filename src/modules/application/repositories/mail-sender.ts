export abstract class MailSender {
  abstract sendPasswordResetCode(params: {
    to: string;
    code: string;
  }): Promise<void>;
}
