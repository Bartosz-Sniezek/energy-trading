"use client";

import { SignInLink } from "@/components/auth/sign-in-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { useActivateAccount } from "@/hooks/auth/use-activate-account";
import { ErrorCode } from "@energy-trading/shared/errors";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Activate() {
  const searchParams = useSearchParams();
  const { error, status, mutate } = useActivateAccount();

  const token = searchParams.get("token");

  useEffect(() => {
    if (token) mutate(token);
  }, [token]);

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardDescription>
          <Field className="flex items-center">
            <img
              src="/images/logo.svg"
              alt="logo"
              className="h-max-18 max-w-50 object-contain"
            />
          </Field>
        </CardDescription>
        <CardTitle className="text-center text-2xl py-2">
          Account activation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status === "success" && (
          <SignInLink message="Your account is now active. You can now" />
        )}

        {error &&
          error.isErrorCode(ErrorCode.USER_ACCOUNT_ALREADY_ACTIVATED) && (
            <SignInLink message="Your account was already activated. You can" />
          )}

        {error &&
          !error.isErrorCode(ErrorCode.USER_ACCOUNT_ALREADY_ACTIVATED) && (
            <p>{error.details.title}</p>
          )}
      </CardContent>
    </Card>
  );
}
