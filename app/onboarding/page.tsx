import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NurseOnboardingForm } from "@/components/shared/nurse-onboarding-form";
import { Loader } from "lucide-react";

const OnboardingPage = async () => {
  const user = await currentUser();
  if ((await auth()).sessionClaims?.metadata.onboardingComplete === true) {
    redirect("/");
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 min-h-screen bg-gray-900 ">
      <span className="font-semibold text-2xl flex flex-row gap-6">
        Welcome {user?.fullName}
        <span>
          <Loader size={30} className="animate-pulse mt-1" />
        </span>
      </span>
      <p className="text-gray-400">
        Please fill out the following form to complete your onboarding.
      </p>
      <NurseOnboardingForm />
    </div>
  );
};

export default OnboardingPage;
