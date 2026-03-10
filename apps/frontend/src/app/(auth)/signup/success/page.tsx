"use client";

import { useSearchParams } from "next/navigation";

export default function SignupSuccessPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div>
      <h1>Check your inbox</h1>
      <p>
        We sent a confirmation link to <strong>{email}</strong>
      </p>
    </div>
  );
}
