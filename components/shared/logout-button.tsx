"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { APP_ROUTES } from "@/constants";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="outline"
      className="cursor-pointer"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.push(APP_ROUTES.SIGN_IN);
        router.refresh();
      }}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Logging out..." : "Logout"}
    </Button>
  );
}
