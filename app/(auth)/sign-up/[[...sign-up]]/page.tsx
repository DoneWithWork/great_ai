import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-black mb-2">
            Join Great AI Hackathon
          </h1>
          <p className="text-gray-600">
            Create your account to get started
          </p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
              footerActionLink: "text-blue-600 hover:text-blue-700",
              formFieldLabel: "text-black",
              formFieldInput: "text-black bg-white border-gray-300",
              identityPreviewText: "text-black",
              socialButtonsBlockButton: "text-black bg-white border border-gray-300 hover:bg-gray-50",
              card: "bg-white shadow-lg",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              header: "hidden"
            }
          }}
          signInUrl="/sign-in"
          redirectUrl="/onboarding"
          afterSignUpUrl="/onboarding"
        />
      </div>
    </div>
  );
}
