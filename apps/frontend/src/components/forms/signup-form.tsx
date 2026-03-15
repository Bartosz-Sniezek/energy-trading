"use client";

import { Button } from "../ui/button";
import { FieldGroup, Field, FieldLabel, FieldError } from "../ui/field";
import { Input } from "../ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { SignUpDto, signUpDtoSchema, useSignUp } from "@/hooks/use-signup";
import { useRouter } from "next/navigation";
import { OrSeparator } from "../separator";
import { SignInLink } from "../auth/sign-in-link";

export const SignUpForm = () => {
  const form = useForm<SignUpDto>({
    resolver: zodResolver(signUpDtoSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });
  const router = useRouter();

  const { error, isPending, mutate } = useSignUp();

  function onSubmit(data: SignUpDto): void {
    mutate(data);
    router.push(`/signup/success?email=${data.email}`);
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
          Create your account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form id="signup-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="max-w-md">
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="signup-form-email">
                      Email address
                    </FieldLabel>
                    <Input
                      {...field}
                      id="signup-form-email"
                      aria-invalid={fieldState.invalid}
                      placeholder="Email address..."
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
                    <FieldLabel htmlFor="signup-form-password">
                      Password
                    </FieldLabel>
                    <Input
                      {...field}
                      type="password"
                      id="signup-form-password"
                      aria-invalid={fieldState.invalid}
                      placeholder="Password..."
                      autoComplete="false"
                      name="password"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />
            <Controller
              name="firstName"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="signup-form-firstname">
                      First Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="signup-form-firstname"
                      aria-invalid={fieldState.invalid}
                      placeholder="First Name..."
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />
            <Controller
              name="lastName"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="signup-form-lastname">
                      First Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="signup-form-lastname"
                      aria-invalid={fieldState.invalid}
                      placeholder="Last Name..."
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
          <Button type="submit" variant="default" form="signup-form">
            Sign up
          </Button>
        </Field>
        <OrSeparator />
        <SignInLink message="Already have an account?" mutedText />
      </CardFooter>
    </Card>
  );
};
