import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SearchParams } from "@/lib/filters/query";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const tokenValue = params.token;
  const token = typeof tokenValue === "string" ? tokenValue : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50 p-4">
      <ResetPasswordForm token={token} />
    </div>
  );
}
