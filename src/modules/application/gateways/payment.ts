export type CreatePixPaymentParams = {
  paymentId: string;
  appointmentId: string;
  amountInCents: number;
  description: string;
  expiresAt: Date;
};

export type CreatePixPaymentResponse = {
  providerName: string;
  providerPaymentId: string;
  pixQrCode: string;
  pixCopyPasteCode: string;
  pixExpiresAt: Date;
};

export abstract class PaymentGateway {
  abstract createPixPayment(
    params: CreatePixPaymentParams,
  ): Promise<CreatePixPaymentResponse>;
}
