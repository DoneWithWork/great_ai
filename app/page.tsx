import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-900 text-gray-200 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute -left-96 top-1/4 w-[60rem] h-[60rem] bg-gradient-to-r from-blue-800 via-blue-600 to-purple-700 opacity-30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute right-0 bottom-0 w-[50rem] h-[50rem] bg-gradient-to-l from-green-700 via-teal-500 to-blue-600 opacity-25 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full px-6 py-16 md:py-32 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 leading-tight">
          RostalQ
        </h1>

        <p className="text-xl md:text-2xl mb-8 text-gray-300">
          Smart scheduling for nurses & HR – reduce fatigue, boost fairness,
          save time.
        </p>

        {userId ? (
          <Link
            href="/dashboard"
            className="inline-block bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-4 px-10 rounded-lg shadow-lg transition"
          >
            Go to Dashboard
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className="inline-block bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-4 px-10 rounded-lg shadow-lg transition"
          >
            Get Started
          </Link>
        )}
      </div>

      {/* Features section */}
      <section className="relative z-10 max-w-5xl w-full px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gray-800 rounded-2xl p-6 hover:bg-gray-700 transition">
          {/* maybe include an icon */}
          <h3 className="text-2xl font-semibold mb-2 text-gray-100">
            Save Time
          </h3>
          <p className="text-gray-400">
            Let AI generate schedules based on availability, skills, and
            preferences.
          </p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 hover:bg-gray-700 transition">
          <h3 className="text-2xl font-semibold mb-2 text-gray-100">
            Fair & Balanced Shifts
          </h3>
          <p className="text-gray-400">
            Ensure shifts are assigned evenly among nurses to reduce burnout.
          </p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 hover:bg-gray-700 transition">
          <h3 className="text-2xl font-semibold mb-2 text-gray-100">
            Better Patient Care
          </h3>
          <p className="text-gray-400">
            Consistency + rest = nurses ready, patients safer.
          </p>
        </div>
      </section>

      {/* Optional: Trust / testimonial / stats section */}
      <section className="relative z-10 max-w-4xl w-full px-6 pb-16 text-center">
        <p className="text-gray-400 mb-4">Trusted by</p>
        {/* Example placeholder logos */}
        <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
          <div className="h-12 w-32 bg-gray-700 rounded-lg"></div>
          <div className="h-12 w-32 bg-gray-700 rounded-lg"></div>
          <div className="h-12 w-32 bg-gray-700 rounded-lg"></div>
        </div>
        <p className="text-gray-400 italic">
          “Using Nurse Rostering AI, we cut scheduling effort by 50%.” – HR
          Lead, Big Hospital
        </p>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-8 bg-gray-800 text-gray-400 text-sm text-center">
        &copy; {new Date().getFullYear()} Nurse Rostering AI. All rights
        reserved.
      </footer>
    </main>
  );
}
