import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export const SignInLink = ({ message }: { message: string }) => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center gap-1 text-sm">
      <span className="text-foreground">{message}</span>
      <Button
        variant="link"
        onClick={() => router.push("/login")}
        className="h-auto p-0 underline font-semibold"
        asChild
      >
        <span>Sign in</span>
      </Button>
    </div>
  );
};
