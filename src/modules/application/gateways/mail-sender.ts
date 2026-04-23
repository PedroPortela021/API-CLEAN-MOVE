export abstract class MailSender {
  abstract sendPasswordResetLink(params: {
    to: string;
    token: string;
  }): Promise<void>;
}
