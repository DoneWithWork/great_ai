"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

// Mock leave data
const mockLeaveBalance = 20;
const mockPastLeaves = [
  {
    start: "2025-08-01",
    end: "2025-08-03",
    type: "Annual",
    status: "Approved",
  },
  { start: "2025-07-15", end: "2025-07-16", type: "Sick", status: "Approved" },
  {
    start: "2025-06-10",
    end: "2025-06-12",
    type: "Annual",
    status: "Rejected",
  },
];

// Zod schema
const leaveSchema = z.object({
  startDate: z.string().nonempty("Start date is required"),
  endDate: z.string().nonempty("End date is required"),
  type: z.enum(["Annual", "Sick", "Unpaid"]),
  reason: z.string().min(5, "Reason should be at least 5 characters"),
});

type LeaveFormData = z.infer<typeof leaveSchema>;

export default function RequestsPage() {
  const [availableLeaves, setAvailableLeaves] = useState(mockLeaveBalance);
  const [pastLeaves, setPastLeaves] = useState(mockPastLeaves);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
  });

  const onSubmit = (data: LeaveFormData) => {
    // Mock submit
    alert(
      `Leave requested: ${data.type} from ${data.startDate} to ${data.endDate}`
    );
    setPastLeaves([
      {
        start: data.startDate,
        end: data.endDate,
        type: data.type,
        status: "Pending",
      },
      ...pastLeaves,
    ]);
    reset();
    setAvailableLeaves(
      (prev) =>
        prev -
        (new Date(data.endDate).getDate() -
          new Date(data.startDate).getDate() +
          1)
    );
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-12">
      <h1 className="text-3xl font-bold mb-2 text-cyan-400">Leave Requests</h1>
      <p className="text-gray-400 mb-8">
        Submit a new leave request or view your existing requests.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1 bg-[#1e293b]/70 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-[#334155]">
          <h2 className="text-xl font-bold text-cyan-300 mb-4">
            Request Leave
          </h2>
          <p className="text-gray-400 mb-4">
            Available leave days: {availableLeaves}
          </p>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="block mb-1 text-gray-300">Start Date</label>
              <input
                type="date"
                {...register("startDate")}
                className="w-full p-2 rounded-md bg-[#0f172a]/50 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-cyan-400"
              />
              {errors.startDate && (
                <p className="text-red-400 text-sm">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-1 text-gray-300">End Date</label>
              <input
                type="date"
                {...register("endDate")}
                className="w-full p-2 rounded-md bg-[#0f172a]/50 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-cyan-400"
              />
              {errors.endDate && (
                <p className="text-red-400 text-sm">{errors.endDate.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 text-gray-300">Type</label>
              <select
                {...register("type")}
                className="w-full p-2 rounded-md bg-[#0f172a]/50 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-cyan-400"
              >
                <option value="Annual">Annual</option>
                <option value="Sick">Sick</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-gray-300">Reason</label>
              <textarea
                {...register("reason")}
                rows={3}
                className="w-full p-2 rounded-md bg-[#0f172a]/50 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-cyan-400"
              />
              {errors.reason && (
                <p className="text-red-400 text-sm">{errors.reason.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="mt-2 bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2 px-4 rounded-xl shadow-lg transition transform hover:scale-105"
            >
              Submit Request
            </button>
          </form>
        </div>

        {/* Past Leaves Table */}
        <div className="lg:col-span-2 bg-[#1e293b]/70 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-[#334155] overflow-x-auto">
          <h2 className="text-xl font-bold text-cyan-300 mb-4">
            Past Leave Requests
          </h2>
          <table className="min-w-full border border-gray-600 rounded-xl overflow-hidden">
            <thead>
              <tr className="text-left text-gray-400 uppercase border-b border-gray-700">
                <th className="px-6 py-3">Start Date</th>
                <th className="px-6 py-3">End Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {pastLeaves.map((leave, idx) => (
                <tr key={idx} className="hover:bg-[#334155] transition">
                  <td className="px-6 py-4">{leave.start}</td>
                  <td className="px-6 py-4">{leave.end}</td>
                  <td className="px-6 py-4">{leave.type}</td>
                  <td
                    className={`px-6 py-4 font-semibold ${
                      leave.status === "Approved"
                        ? "text-green-400"
                        : leave.status === "Rejected"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {leave.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
