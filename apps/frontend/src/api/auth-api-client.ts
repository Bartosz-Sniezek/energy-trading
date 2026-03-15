import { SignInDto } from "@energy-trading/shared/types";
import { ApiClient } from "./api-client";

export class AuthApiClient extends ApiClient {
  private static client: AuthApiClient | null = null;

  static create(): AuthApiClient {
    if (AuthApiClient.client == null)
      AuthApiClient.client = new AuthApiClient();

    return AuthApiClient.client;
  }

  async login(data: SignInDto): Promise<void> {
    return this.post("/api/auth/login", {
      body: JSON.stringify(data),
    });
  }

  async requestActivationTokenResend(token: string): Promise<void> {
    return this.post("/api/auth/resend-activation-email?token=" + token);
  }

  async activateAccount(token: string): Promise<void> {
    return this.post(`/api/auth/activate?token=${token}`);
  }
}
