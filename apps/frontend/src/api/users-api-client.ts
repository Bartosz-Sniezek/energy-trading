import { MeDto } from "@energy-trading/shared/types";
import { ApiClient } from "./api-client";

export class UsersApiClient extends ApiClient {
  private static client: UsersApiClient | null = null;

  static create(): UsersApiClient {
    if (UsersApiClient.client == null)
      UsersApiClient.client = new UsersApiClient();

    return UsersApiClient.client;
  }

  async me(): Promise<MeDto> {
    return this.get("/api/users/me");
  }
}
