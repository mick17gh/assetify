import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants";

export default function SettingsIndexPage() {
  redirect(APP_ROUTES.SETTINGS_ORGANIZATION);
}
