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
    init?: ApiClientRequest,
    retries: number = 0,
  ): Promise<T> {
    const myUrl = new URL(url, "http://127.0.0.1:8000").toString();
    const res = await fetch(myUrl, {
      ...init,
      method,
      credentials: "include",
      headers: {
        ...this.headers,
        ...init?.headers,
      },
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      if (res.status === 401 && retries < 1) {
        let shouldRefresh = !myUrl.includes("/api/auth/refresh");

        if (shouldRefresh && myUrl.includes("/api/auth")) {
          shouldRefresh &&= false;
        }

        if (shouldRefresh) {
          const retry = retries + 1;
          await this.request("/api/auth/refresh", "POST", undefined, retry);

          return await this.request(url, method, init, retry);
        }
      }

      if (res.status === 500)
        throw new ProblemDetailsError({
          type: "about:blank",
          title: "Something went wrong. Try again later.",
          status: res.status,
          instance: url,
        });

      if (isProblemDetails(body)) throw new ProblemDetailsError(body);

      throw new ProblemDetailsError({
        type: "about:blank",
        title: "Something went wrong. Try again later.",
        status: res.status,
        instance: url,
      });
    }

    return body;
  }

  protected async get<T>(url: string, init?: GetApiClientRequest): Promise<T> {
    return this.request(url, "GET", init);
  }

  protected async post<T>(url: string, init?: ApiClientRequest): Promise<T> {
    return this.request(url, "POST", init);
  }

  protected async delete<T>(url: string, init?: ApiClientRequest): Promise<T> {
    return this.request(url, "DELETE", init);
  }
}
