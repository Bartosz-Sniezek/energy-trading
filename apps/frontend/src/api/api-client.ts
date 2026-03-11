import { isProblemDetails } from "@energy-trading/shared/errors";
import { ProblemDetailsError } from "./problem-details.error";

export type ApiClientRequest = Omit<RequestInit, "method">;
export type GetApiClientRequest = Omit<RequestInit, "method" | "body">;

export abstract class ApiClient {
  protected headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  protected async request<T>(
    url: string,
    method: string,
    init: ApiClientRequest,
  ): Promise<T> {
    const res = await fetch(url, {
      ...init,
      method,
      headers: {
        ...this.headers,
        ...init.headers,
      },
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      if (isProblemDetails(body)) throw new ProblemDetailsError(body);

      throw new ProblemDetailsError({
        type: "about:blank",
        title: "Something went wrong",
        status: res.status,
        instance: url,
      });
    }

    return body;
  }

  protected async get<T>(url: string, init: GetApiClientRequest): Promise<T> {
    return this.request(url, "GET", init);
  }

  protected async post<T>(url: string, init: ApiClientRequest): Promise<T> {
    return this.request(url, "POST", init);
  }

  protected async delete<T>(url: string, init: ApiClientRequest): Promise<T> {
    return this.request(url, "DELETE", init);
  }
}
