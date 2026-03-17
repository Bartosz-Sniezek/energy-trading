import { ProblemDetailsError } from "@/api/problem-details.error";
import { MeDto } from "@energy-trading/shared/types";
import { cookies } from "next/headers";
import { cache } from "react";

export const getUser = cache(async (): Promise<MeDto | null> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token");

  console.log(cookieStore.getAll());

  if (accessToken == null) return null;

  try {
    const res = await fetch("http://127.0.0.1:8000/api/users/me", {
      method: "GET",
      credentials: "include",
      headers: {
        Cookie: `access_token=${accessToken.value}`,
      },
    });

    const body = await res.json();
    if (res.ok) return body;

    throw new ProblemDetailsError(body);
  } catch (error: unknown) {
    return null;
  }
});
