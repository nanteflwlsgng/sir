import { SubmitButton } from "@/shared/presentation/ui/submit-button";
import { logoutAction } from "./actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <SubmitButton variant="ghost" size="sm" pendingLabel="Déconnexion…">
        Déconnexion
      </SubmitButton>
    </form>
  );
}
