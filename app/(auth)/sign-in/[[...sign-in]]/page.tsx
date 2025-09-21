import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div
      className="flex justify-center items-center h-screen bg-gray-50"
      style={{ minHeight: "100vh" }}
    >
      <div className="w-full max-w-md">
        <div
          className="bg-white rounded-lg shadow-lg"
          style={{
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div className="px-8 pb-8">
            <SignIn
              appearance={{
                elements: {
                  formButtonPrimary: {
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    "&:hover": {
                      backgroundColor: "#1d4ed8",
                    },
                  },
                  footerActionLink: {
                    color: "#2563eb",
                    "&:hover": {
                      color: "#1d4ed8",
                    },
                  },
                  formFieldLabel: {
                    color: "#171717",
                  },
                  formFieldInput: {
                    color: "#171717",
                    backgroundColor: "#ffffff",
                    borderColor: "#d1d5db",
                    border: "1px solid #d1d5db",
                  },
                  identityPreviewText: {
                    color: "#171717",
                  },
                  socialButtonsBlockButton: {
                    color: "#171717",
                    backgroundColor: "#ffffff",
                    border: "1px solid #d1d5db",
                    "&:hover": {
                      backgroundColor: "#f9fafb",
                    },
                  },
                  card: {
                    backgroundColor: "transparent",
                    boxShadow: "none",
                    border: "none",
                  },
                  headerTitle: {
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: "#ffffff",
                    textAlign: "center",
                    marginBottom: "0.5rem",
                  },
                  headerSubtitle: {
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    textAlign: "center",
                    marginBottom: "1.5rem",
                  },
                  header: {
                    textAlign: "center",
                    paddingBottom: "1rem",
                  },
                },
              }}
              signUpUrl="/sign-up"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
