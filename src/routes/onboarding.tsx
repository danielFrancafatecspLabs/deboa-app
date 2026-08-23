import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleComplete = () => {
    // After onboarding, check if user has local data to migrate
    const ctxRaw = localStorage.getItem("deboa.context");
    const histRaw = localStorage.getItem("deboa.history");
    const profRaw = localStorage.getItem("deboa.financialProfile");
    const hasLocalData = !!(ctxRaw || histRaw || profRaw);

    if (user && hasLocalData) {
      router.navigate({ to: "/auth/migrate" });
    } else {
      router.navigate({ to: "/" });
    }
  };

  return <OnboardingFlow onComplete={handleComplete} />;
}