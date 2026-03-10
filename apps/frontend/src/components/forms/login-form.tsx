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
            {error && <FieldError>{error.message}</FieldError>}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-0 bg-white">
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
