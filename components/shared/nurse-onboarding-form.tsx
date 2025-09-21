"use client";

import { completeOnboarding } from "@/app/actions/onBoarding";
import { formSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

export function NurseOnboardingForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const form = useForm<z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      department: "",
      preferredShift: "day",
      bio: "",
      role: "nurse",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      startTransition(async () => {
        await completeOnboarding(values, values);
        if (typeof window !== "undefined") {
          if (values.role === "nurse") {
            window.location.href = "/nurse/dashboard";
          } else {
            window.location.href = "/admin";
          }
        }
      });
    } catch (err) {
      console.error("Onboarding failed", err);
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 glass-card p-6 max-w-xl w-full"
    >
      <div className="">
        <label htmlFor="fullName" className="block text-sm font-medium mb-1 ">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="fullName"
          {...form.register("fullName")}
          className="w-full p-2 rounded-lg bg-white/20 border border-transparent focus:border-pink-500 focus:ring-pink-500"
        />
        {form.formState.errors.fullName && (
          <p className="text-red-500 text-xs mt-1">
            {form.formState.errors.fullName.message}
          </p>
        )}
      </div>
      <div className="">
        <label htmlFor="bio" className="block text-sm font-medium mb-1 ">
          Bio (Hobbies, Interests, etc.)
        </label>
        <textarea
          id="bio"
          {...form.register("bio")}
          className="w-full p-2 rounded-lg bg-white/20 border border-transparent focus:border-pink-500 focus:ring-pink-500"
        />
        {form.formState.errors.bio && (
          <p className="text-red-500 text-xs mt-1">
            {form.formState.errors.bio.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-1">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          {...form.register("phone")}
          className="w-full p-2 rounded-lg bg-white/20 border border-transparent focus:border-pink-500 focus:ring-pink-500"
        />
        {form.formState.errors.phone && (
          <p className="text-red-500 text-xs mt-1">
            {form.formState.errors.phone.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="department" className="block text-sm font-medium mb-1">
          Department / Ward <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="department"
          {...form.register("department")}
          className="w-full p-2 rounded-lg bg-white/20 border border-transparent focus:border-pink-500 focus:ring-pink-500"
        />
        {form.formState.errors.department && (
          <p className="text-red-500 text-xs mt-1">
            {form.formState.errors.department.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          {...form.register("role")}
          className="w-full p-2 rounded-lg bg-white/20 border border-transparent focus:border-pink-500 focus:ring-pink-500 text-white"
          style={{ color: "white" }}
        >
          <option value="nurse" className="bg-gray-800 text-white">
            Nurse
          </option>
          <option value="admin" className="bg-gray-800 text-white">
            Admin
          </option>
        </select>
      </div>
      <div>
        <label
          htmlFor="preferredShift"
          className="block text-sm font-medium mb-1"
        >
          Preferred Shift <span className="text-red-500">*</span>
        </label>
        <select
          id="preferredShift"
          {...form.register("preferredShift")}
          className="w-full p-2 rounded-lg bg-white/20 border border-transparent focus:border-pink-500 focus:ring-pink-500 text-white"
          style={{ color: "white" }}
        >
          <option value="day" className="bg-gray-800 text-white">
            Day Shift
          </option>
          <option value="night" className="bg-gray-800 text-white">
            Night Shift
          </option>
          <option value="flexible" className="bg-gray-800 text-white">
            Flexible
          </option>
        </select>
      </div>

      <p className="text-gray-400 text-sm">
        Fields marked with <span className="text-red-500">*</span> are required.
      </p>
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-gradient-to-r cursor-pointer hover:scale-[101%] duration-300 from-pink-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors disabled:bg-gray-400"
      >
        {isPending ? "Submitting..." : "Complete Onboarding"}
      </button>
    </form>
  );
}
