import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <div className="text-center glass-card p-8 md:p-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Nurse Rostering AI
        </h1>
        <p className="text-lg md:text-xl mb-8">
          Modern, sleek, and intelligent rostering for healthcare professionals.
        </p>
        {userId ? (
          <Link
            href="/dashboard"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
          >
            Get Started
          </Link>
        )}
      </div>
    </main>
  );
}
