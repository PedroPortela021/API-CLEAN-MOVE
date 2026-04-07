import {
  CreatePixPaymentParams,
  CreatePixPaymentResponse,
  PaymentGateway,
} from "../../src/modules/application/gateways/payment";

export class FakePaymentGateway implements PaymentGateway {
  public createPixPaymentCalls: CreatePixPaymentParams[] = [];
  public shouldFail = false;
  public responseOverride?: Partial<CreatePixPaymentResponse>;

  async createPixPayment(
    params: CreatePixPaymentParams,
  ): Promise<CreatePixPaymentResponse> {
    this.createPixPaymentCalls.push(params);

    if (this.shouldFail) {
      throw new Error("Payment gateway unavailable.");
    }

    return {
      providerName: this.responseOverride?.providerName ?? "FakePix",
      providerPaymentId:
        this.responseOverride?.providerPaymentId ?? "pix-payment-1",
      pixQrCode: this.responseOverride?.pixQrCode ?? "fake-qr-code",
      pixCopyPasteCode:
        this.responseOverride?.pixCopyPasteCode ?? "fake-copy-paste-code",
      pixExpiresAt: this.responseOverride?.pixExpiresAt ?? params.expiresAt,
    };
  }
}
