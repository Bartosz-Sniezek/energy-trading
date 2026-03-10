import { Separator } from "./ui/separator";

export const OrSeparator = () => (
  <div className="flex w-screen max-w-full items-center gap-2 text-sm text-muted-foreground">
    <Separator className="flex-1" />
    <span>or</span>
    <Separator className="flex-1" />
  </div>
);
