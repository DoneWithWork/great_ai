"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createLeaveRequest } from "@/lib/actions/user.actions";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
  leaveType: z.string().min(1, "Leave type is required"),
  reason: z.string().optional(),
});

export function RequestLeaveForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leaveType: "Annual Leave",
      reason: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const result = await createLeaveRequest(values);
    if (result?.error) {
      // Handle error, e.g., show a toast notification
      console.error(result.error);
    } else {
      // Redirect to the requests page or show a success message
      router.push("/requests");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 glass-card p-6">
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium mb-1">Start Date</label>
        <input type="date" id="startDate" {...form.register("startDate")} className="w-full p-2 rounded-lg bg-white/20 border border-transparent focus:border-blue-500 focus:ring-blue-500" />
        {form.formState.errors.startDate && <p className="text-red-500 text-xs mt-1">{form.formState.errors.startDate.message}</p>}
      </div>
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium mb-1">End Date</label>
        <input type="date" id="endDate" {...form.register("endDate")} className="w-full p-2 rounded-lg bg-white/20 border border-transparent focus:border-blue-500 focus:ring-blue-500" />
        {form.formState.errors.endDate && <p className="text-red-500 text-xs mt-1">{form.formState.errors.endDate.message}</p>}
      </div>
      <div>
        <label htmlFor="leaveType" className="block text-sm font-medium mb-1">Leave Type</label>
        <select id="leaveType" {...form.register("leaveType")} className="w-full p-2 rounded-lg bg-white/20 border border-transparent focus:border-blue-500 focus:ring-blue-500">
          <option>Annual Leave</option>
          <option>Sick Leave</option>
          <option>Unpaid Leave</option>
        </select>
        {form.formState.errors.leaveType && <p className="text-red-500 text-xs mt-1">{form.formState.errors.leaveType.message}</p>}
      </div>
      <div>
        <label htmlFor="reason" className="block text-sm font-medium mb-1">Reason (Optional)</label>
        <textarea id="reason" {...form.register("reason")} className="w-full p-2 rounded-lg bg-white/20 border border-transparent focus:border-blue-500 focus:ring-blue-500" />
      </div>
      <button type="submit" disabled={form.formState.isSubmitting} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors disabled:bg-gray-400">
        {form.formState.isSubmitting ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
