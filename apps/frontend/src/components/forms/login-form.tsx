"use client";

import { Button } from "../ui/button";
import { FieldGroup, Field, FieldLabel, FieldError } from "../ui/field";
import { Input } from "../ui/input";
import { Controller, useForm } from "react-hook-form";
import { useSignIn } from "@/hooks/use-signin";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { useRouter } from "next/navigation";
import { OrSeparator } from "../separator";
import { SignInDto } from "@energy-trading/shared/types";
import { signInDtoSchema } from "@energy-trading/shared/schemas";
import {
  ErrorCode,
  resolveProblemDetailsUrn,
} from "@energy-trading/shared/errors";
import { JSX } from "react";
import { isProblemDetailsError } from "@/api/problem-details.error";

const getErrorComponent = (error: unknown): JSX.Element | null => {
  console.log("hmmm???", error);
  if (!error) return null;

  if (isProblemDetailsError(error)) {
    if (
      error.details.type ===
      resolveProblemDetailsUrn(ErrorCode.USER_ACCOUNT_NOT_ACTIVATED)
    ) {
      return (
        <div className="flex flex-col gap-3">
          <FieldError>Your account hasn’t been activated yet.</FieldError>
          <Button type="button" variant="outline">
            <span>Resend activation link</span>
          </Button>
        </div>
      );
    }

    return <FieldError>{error.details.title}</FieldError>;
  }

  if (error instanceof Error) return <FieldError>{error.message}</FieldError>;

  return <FieldError>Something went wrong</FieldError>;
};

export const LoginForm = () => {
  const form = useForm<SignInDto>({
    resolver: zodResolver(signInDtoSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const router = useRouter();

  const { error, isPending, mutate } = useSignIn();

  function onSubmit(data: SignInDto): void {
    mutate(data);
  }

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
          Welcome back!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form id="signin-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="max-w-md">
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="signin-form-email">
                      Email address
                    </FieldLabel>
                    <Input
                      {...field}
                      id="signin-form-email"
                      aria-invalid={fieldState.invalid}
                      placeholder="Email address"
                      disabled={isPending}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="signin-form-password">
                      Password
                    </FieldLabel>
                    <Input
                      {...field}
                      type="password"
                      id="signin-form-password"
                      aria-invalid={fieldState.invalid}
                      placeholder="Password"
                      autoComplete="false"
                      name="password"
                      disabled={isPending}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />
            {error && getErrorComponent(error)}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-0 bg-white pt-0">
        <Field>
          <Button type="submit" form="signin-form" disabled={isPending}>
            Sign in
          </Button>
        </Field>
        <OrSeparator />
        <div className="flex items-center justify-center gap-1 text-sm">
          <span className="text-muted-foreground">Don't have an account?</span>
          <Button
            variant="link"
            onClick={() => router.push("/signup")}
            className="h-auto p-0"
            asChild
          >
            <span>Sign up</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
