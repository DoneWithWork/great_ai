import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center items-center h-screen">
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
            footerActionLink: "text-blue-600 hover:text-blue-700"
          }
        }}
        signInUrl="/sign-in"
        redirectUrl="/onboarding"
        afterSignUpUrl="/onboarding"
      />
    </div>
  );
}
