import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants";

export default function BranchesPage() {
  redirect(APP_ROUTES.SETTINGS_BRANCHES);
}
