"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { APP_ROUTES } from "@/constants";
import { BrandWordmark } from "@/components/shared/brand-wordmark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <BrandWordmark />
      <Card className="w-full border-navy-200">
        <CardHeader className="text-center">
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            setError(null);
            const result = await authClient.signIn.email({
              email,
              password,
              callbackURL: redirectTo,
            });
            setPending(false);
            if (result.error) {
              setError(result.error.message ?? "Unable to sign in.");
              return;
            }
            router.push(redirectTo);
            router.refresh();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button className="w-full cursor-pointer" disabled={pending} type="submit">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {pending ? "Signing in..." : "Sign in"}
          </Button>
          <Link className="block text-sm text-navy-700 underline" href={APP_ROUTES.FORGOT_PASSWORD}>
            Forgot password?
          </Link>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}
