"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { sendLeaveRequestAction } from "@/app/actions/sendLeaveRequestAction";
import { getUserLeaveRequestAction } from "@/app/actions/getUserLeaveRequest";

const leaveSchema = z.object({
  startDate: z.string().nonempty("Start date is required"),
  endDate: z.string().nonempty("End date is required"),
  type: z.enum(["annual", "sick", "unpaid"]),
  reason: z.string().min(5, "Reason should be at least 5 characters"),
});
interface LeaveRequest {
  startDate: Date;
  endDate: Date;
  leaveType: "annual" | "sick" | "unpaid";
  status?: "Pending" | "Approved" | "Rejected";
}

type LeaveFormData = z.infer<typeof leaveSchema>;

export default function RequestsPage() {
  const [availableLeaves, setAvailableLeaves] = useState(20);
  const [pastLeaves, setPastLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
  });

  // Fetch past leave requests
  useEffect(() => {
    async function fetchLeaves() {
      setLoading(true);
      setError(null);

      const result = await getUserLeaveRequestAction();
      console.log(result);
      if ("error" in result) {
        setError(result.error);
      } else {
        setPastLeaves(
          result.map(
            (r: {
              id: number;
              startDate: Date | string;
              endDate: Date | string;
              reason: string | null;
              approvalStatus: "pending" | "rejected" | "approved" | null;
              nurseId: number;
              leaveType: string;
              submittedAt: Date | null;
              reviewedAt: Date | null;
            }) => ({
              startDate: new Date(r.startDate),
              endDate: new Date(r.endDate),
              leaveType:
                r.leaveType === "annual" ||
                r.leaveType === "sick" ||
                r.leaveType === "unpaid"
                  ? (r.leaveType as "annual" | "sick" | "unpaid")
                  : "annual",
              status:
                r.approvalStatus === "approved"
                  ? "Approved"
                  : r.approvalStatus === "rejected"
                  ? "Rejected"
                  : "Pending",
            })
          )
        );
      }
      setLoading(false);
    }
    fetchLeaves();
  }, []);

  const onSubmit = async (data: LeaveFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await sendLeaveRequestAction(undefined, {
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        type: data.type,
      });

      if ("error" in result) {
      } else {
        setSuccess(true);
        reset();
        // Refresh leave requests after submission
        const updatedLeaves = await getUserLeaveRequestAction();
        if (!("error" in updatedLeaves)) {
          setPastLeaves(
            updatedLeaves.map(
              (r: {
                id: number;
                startDate: Date | string;
                endDate: Date | string;
                reason: string | null;
                approvalStatus: "pending" | "rejected" | "approved" | null;
                nurseId: number;
                leaveType: string;
                submittedAt: Date | null;
                reviewedAt: Date | null;
              }) => ({
                startDate: new Date(r.startDate),
                endDate: new Date(r.endDate),
                leaveType:
                  r.leaveType === "annual" ||
                  r.leaveType === "sick" ||
                  r.leaveType === "unpaid"
                    ? (r.leaveType as "annual" | "sick" | "unpaid")
                    : "annual",
                status:
                  r.approvalStatus === "approved"
                    ? "Approved"
                    : r.approvalStatus === "rejected"
                    ? "Rejected"
                    : "Pending",
              })
            )
          );
        }
      }
    } catch (err) {
      setError("Something went wrong");
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
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

          {error && <p className="text-red-400 mb-2">{error}</p>}
          {success && (
            <p className="text-green-400 mb-2">Leave request submitted!</p>
          )}

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
                <option value="">Select leave type</option>
                <option value="annual">Annual</option>
                <option value="sick">Sick</option>
                <option value="unpaid">Unpaid</option>
              </select>
              {errors.type && (
                <p className="text-red-400 text-sm">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 text-gray-300">Reason</label>
              <textarea
                {...register("reason")}
                rows={3}
                className="w-full p-2 rounded-md bg-[#0f172a]/50 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-cyan-400"
                placeholder="Please provide a reason for your leave request..."
              />
              {errors.reason && (
                <p className="text-red-400 text-sm">{errors.reason.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded-xl shadow-lg transition transform hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>

        {/* Past Leaves Table */}
        <div className="lg:col-span-2 bg-[#1e293b]/70 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-[#334155] overflow-x-auto">
          <h2 className="text-xl font-bold text-cyan-300 mb-4">
            Past Leave Requests
          </h2>
          {loading && <p className="text-gray-400">Loading...</p>}
          {!loading && pastLeaves.length === 0 && !error && (
            <p className="text-gray-400">No leave requests found.</p>
          )}
          {!loading && pastLeaves.length > 0 && (
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
                    <td className="px-6 py-4">
                      {leave.startDate instanceof Date
                        ? leave.startDate.toISOString().split("T")[0]
                        : leave.startDate}
                    </td>
                    <td className="px-6 py-4">
                      {leave.endDate instanceof Date
                        ? leave.endDate.toISOString().split("T")[0]
                        : leave.endDate}
                    </td>
                    <td className="px-6 py-4">
                      {leave.leaveType.charAt(0).toUpperCase() +
                        leave.leaveType.slice(1)}
                    </td>
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
          )}
        </div>
      </div>
    </main>
  );
}
