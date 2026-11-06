"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { APP_ROUTES } from "@/constants";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const label = pending ? "Logging out..." : "Logout";

  const button = (
    <Button
      variant="outline"
      className="w-full cursor-pointer group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0"
      disabled={pending}
      aria-label={label}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.push(APP_ROUTES.SIGN_IN);
        router.refresh();
      }}
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin group-data-[collapsible=icon]:mr-0" />
      ) : (
        <LogOut className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0" />
      )}
      <span className="group-data-[collapsible=icon]:sr-only">{label}</span>
    </Button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
