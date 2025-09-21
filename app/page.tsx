import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-start bg-gray-900 text-gray-100 overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-96 top-1/4 w-[60rem] h-[60rem] bg-gradient-to-r from-blue-800 via-blue-600 to-purple-700 opacity-30 rounded-full blur-3xl animate-spin-slow"></div>
        <div className="absolute right-0 bottom-0 w-[50rem] h-[50rem] bg-gradient-to-l from-green-700 via-teal-500 to-blue-600 opacity-25 rounded-full blur-3xl animate-pulse delay-2000"></div>
        {/* Floating nurse icons or particles */}
        <div className="absolute top-1/2 left-1/3 w-0 h-0 animate-float">
          {/* Add subtle SVG icons moving around */}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 text-center mt-24 px-6 md:px-16">
        <h1 className="text-6xl md:text-8xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 leading-tight animate-text-fade">
          RostalQ
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-300 animate-fade-up">
          AI-powered nurse scheduling that slashes admin time, balances shifts,
          and keeps patients safer.
        </p>

        {userId ? (
          <Link
            href="/nurse/dashboard"
            className="inline-block bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-4 px-12 rounded-xl shadow-2xl transform hover:scale-105 transition"
          >
            🚀 Go to Dashboard
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className="inline-block bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-4 px-12 rounded-xl shadow-2xl transform hover:scale-105 transition"
          >
            {"Get Started – It's Free"}
          </Link>
        )}
      </div>

      {/* Features Section */}
      <section className="relative z-10 max-w-6xl w-full px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-12">
        {[
          {
            title: "Save 50%+ Admin Time",
            description:
              "AI generates schedules instantly based on skills, availability, and preferences.",
            icon: "⏱️",
          },
          {
            title: "Fair & Balanced Shifts",
            description:
              "Prevent burnout with balanced assignments across all staff.",
            icon: "⚖️",
          },
          {
            title: "Better Patient Care",
            description: "Consistent, rested nurses = safer, happier patients.",
            icon: "❤️",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="bg-gray-800 rounded-3xl p-8 hover:bg-gray-700 transition transform hover:scale-105 shadow-lg"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-2xl font-semibold mb-2 text-gray-100">
              {feature.title}
            </h3>
            <p className="text-gray-400">{feature.description}</p>
          </div>
        ))}
      </section>

      {/* Testimonial Section */}
      <section className="relative z-10 max-w-4xl w-full px-6 py-16 text-center">
        <p className="text-gray-400 mb-6 uppercase tracking-wider">
          Trusted by Leading Hospitals
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
          <div className="h-12 w-32 bg-gray-700 rounded-lg"></div>
          <div className="h-12 w-32 bg-gray-700 rounded-lg"></div>
          <div className="h-12 w-32 bg-gray-700 rounded-lg"></div>
        </div>
        <blockquote className="text-gray-300 italic text-lg max-w-2xl mx-auto">
          “RostalQ cut our scheduling time in half and made shifts completely
          fair. Our nurses love it!” – HR Lead, Big Hospital
        </blockquote>
      </section>

      {/* AI Demo / Call to Action */}
      <section className="relative z-10 max-w-4xl w-full px-6 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
          See RostalQ in Action
        </h2>
        <p className="text-gray-400 mb-8">
          Watch AI instantly generate schedules. Reduce errors, fatigue, and
          stress across your team.
        </p>
        <Link
          href="/sign-in"
          className="inline-block bg-pink-500 hover:bg-pink-600 text-black font-bold py-4 px-12 rounded-xl shadow-2xl transform hover:scale-105 transition"
        >
          {"Get Started – It's Free"}
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-8 bg-gray-800 text-gray-400 text-sm text-center">
        &copy; {new Date().getFullYear()} RostalQ. All rights reserved.
      </footer>
    </main>
  );
}
