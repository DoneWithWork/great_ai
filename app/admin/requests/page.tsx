"use client";

import { useState } from "react";

// Mock incoming leave requests
const mockRequests = [
  {
    id: 1,
    nurse: "John Doe",
    start: "2025-09-25",
    end: "2025-09-27",
    type: "Annual",
    reason: "Family trip",
    status: "Pending",
  },
  {
    id: 2,
    nurse: "Jane Smith",
    start: "2025-09-28",
    end: "2025-09-29",
    type: "Sick",
    reason: "Flu",
    status: "Pending",
  },
  {
    id: 3,
    nurse: "Carlos Ruiz",
    start: "2025-10-01",
    end: "2025-10-03",
    type: "Annual",
    reason: "Vacation",
    status: "Pending",
  },
];

export default function AdminLeaveRequestsPage() {
  const [requests, setRequests] = useState(mockRequests);

  const handleApprove = (id: number) => {
    setRequests(
      requests.map((r) => (r.id === id ? { ...r, status: "Approved" } : r))
    );
    alert("Leave approved!");
  };

  const handleReject = (id: number) => {
    setRequests(
      requests.map((r) => (r.id === id ? { ...r, status: "Rejected" } : r))
    );
    alert("Leave rejected!");
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-12">
      <h1 className="text-3xl font-bold mb-2 text-cyan-400">
        Leave Requests Approval
      </h1>
      <p className="text-gray-400 mb-8">
        Review incoming leave requests and approve or reject them.
      </p>

      <div className="bg-[#1e293b]/70 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-[#334155] overflow-x-auto">
        <table className="min-w-full border border-gray-600 rounded-xl overflow-hidden">
          <thead>
            <tr className="text-left text-gray-400 uppercase border-b border-gray-700">
              <th className="px-6 py-3">Nurse</th>
              <th className="px-6 py-3">Start Date</th>
              <th className="px-6 py-3">End Date</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Reason</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-[#334155] transition">
                <td className="px-6 py-4">{req.nurse}</td>
                <td className="px-6 py-4">{req.start}</td>
                <td className="px-6 py-4">{req.end}</td>
                <td className="px-6 py-4">{req.type}</td>
                <td className="px-6 py-4">{req.reason}</td>
                <td
                  className={`px-6 py-4 font-semibold ${
                    req.status === "Approved"
                      ? "text-green-400"
                      : req.status === "Rejected"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {req.status}
                </td>
                <td className="px-6 py-4 flex gap-2">
                  {req.status === "Pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="bg-green-500 hover:bg-green-600 text-black font-bold py-1 px-3 rounded-xl shadow transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="bg-red-500 hover:bg-red-600 text-black font-bold py-1 px-3 rounded-xl shadow transition"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
