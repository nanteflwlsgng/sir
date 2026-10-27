import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/presentation/get-current-user";

export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user ? "/tableau-de-bord" : "/connexion");
}
