"use client";

import { approveLeaveRequestAction } from "@/app/actions/approveRequestLeaveAction";
import { getAllLeaveRequestActions } from "@/app/actions/getAllLeaveRequestActions";
import { useState, useEffect } from "react";

interface LeaveRequest {
  id: number;
  nurse: {
    user: {
      fullName: string;
    };
  };
  startDate: Date;
  endDate: Date;
  leaveType: string;
  reason: string | null;
  approvalStatus: "pending" | "approved" | "rejected" | null;
  submittedAt: Date | null;
  rejectionReason?: string;
}

export default function AdminLeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    requestId: number | null;
  }>({ isOpen: false, requestId: null });
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch all leave requests
  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAllLeaveRequestActions();
      if ("error" in result) {
        setError(result.error);
      } else {
        setRequests(result);
      }
    } catch (err) {
      setError("Failed to fetch leave requests");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      const result = await approveLeaveRequestAction(id.toString(), "approved");

      if ("error" in result) {
        alert(`Error: ${result.error}`);
      } else {
        // Update the local state
        setRequests(
          requests.map((r) =>
            r.id === id ? { ...r, approvalStatus: "approved" as const } : r
          )
        );
        alert("Leave request approved successfully!");
      }
    } catch (err) {
      alert("Failed to approve leave request");
      console.error("Approve error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number, reason: string) => {
    setActionLoading(id);
    try {
      const result = await approveLeaveRequestAction(
        id.toString(),
        "rejected",
        reason.trim() || "No reason provided"
      );

      if ("error" in result) {
        alert(`Error: ${result.error}`);
      } else {
        // Update the local state
        setRequests(
          requests.map((r) =>
            r.id === id
              ? {
                  ...r,
                  approvalStatus: "rejected" as const,
                  rejectionReason: reason.trim() || "No reason provided",
                }
              : r
          )
        );
        alert("Leave request rejected successfully!");
        setRejectionModal({ isOpen: false, requestId: null });
        setRejectionReason("");
      }
    } catch (err) {
      alert("Failed to reject leave request");
      console.error("Reject error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectionModal = (id: number) => {
    setRejectionModal({ isOpen: true, requestId: id });
    setRejectionReason("");
  };

  const closeRejectionModal = () => {
    setRejectionModal({ isOpen: false, requestId: null });
    setRejectionReason("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-400";
      case "rejected":
        return "text-red-400";
      case "pending":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const pendingRequests = requests.filter(
    (r) => r.approvalStatus === "pending"
  );
  const processedRequests = requests.filter(
    (r) => r.approvalStatus !== "pending"
  );

  return (
    <main className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-cyan-400">
            Leave Requests Management
          </h1>
          <p className="text-gray-400">
            Review and manage all leave requests from staff members.
          </p>
        </div>
        <button
          onClick={fetchLeaveRequests}
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-500 text-black font-bold py-2 px-4 rounded-xl shadow-lg transition"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Pending Requests */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">
          Pending Requests ({pendingRequests.length})
        </h2>
        <div className="bg-[#1e293b]/70 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-[#334155] overflow-x-auto">
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : pendingRequests.length === 0 ? (
            <p className="text-gray-400">No pending requests found.</p>
          ) : (
            <table className="min-w-full border border-gray-600 rounded-xl overflow-hidden">
              <thead>
                <tr className="text-left text-gray-400 uppercase border-b border-gray-700">
                  <th className="px-6 py-3">Staff Member</th>
                  <th className="px-6 py-3">Start Date</th>
                  <th className="px-6 py-3">End Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Submitted</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#334155] transition">
                    <td className="px-6 py-4">{req.nurse.user.fullName}</td>
                    <td className="px-6 py-4">
                      {req.startDate.toDateString()}
                    </td>
                    <td className="px-6 py-4">{req.endDate.toDateString()}</td>
                    <td className="px-6 py-4 capitalize">{req.leaveType}</td>
                    <td
                      className="px-6 py-4 max-w-xs truncate"
                      title={req.reason || undefined}
                    >
                      {req.reason}
                    </td>
                    <td className="px-6 py-4">
                      {req.submittedAt?.toDateString() || "-"}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={actionLoading === req.id}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-black font-bold py-1 px-3 rounded-xl shadow transition"
                      >
                        {actionLoading === req.id ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => openRejectionModal(req.id)}
                        disabled={actionLoading === req.id}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-black font-bold py-1 px-3 rounded-xl shadow transition"
                      >
                        {actionLoading === req.id ? "..." : "Reject"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Processed Requests */}
      <div>
        <h2 className="text-xl font-bold text-gray-300 mb-4">
          Processed Requests ({processedRequests.length})
        </h2>
        <div className="bg-[#1e293b]/70 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-[#334155] overflow-x-auto">
          {processedRequests.length === 0 ? (
            <p className="text-gray-400">No processed requests found.</p>
          ) : (
            <table className="min-w-full border border-gray-600 rounded-xl overflow-hidden">
              <thead>
                <tr className="text-left text-gray-400 uppercase border-b border-gray-700">
                  <th className="px-6 py-3">Staff Member</th>
                  <th className="px-6 py-3">Start Date</th>
                  <th className="px-6 py-3">End Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Rejection Reason</th>
                </tr>
              </thead>
              <tbody>
                {processedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#334155] transition">
                    <td className="px-6 py-4">{req.nurse.user.fullName}</td>
                    <td className="px-6 py-4">
                      {req.startDate.toDateString()}
                    </td>
                    <td className="px-6 py-4">{req.endDate.toDateString()}</td>
                    <td className="px-6 py-4 capitalize">{req.leaveType}</td>
                    <td
                      className={`px-6 py-4 font-semibold capitalize ${getStatusColor(
                        req.approvalStatus || "pending"
                      )}`}
                    >
                      {req.approvalStatus || "pending"}
                    </td>
                    <td className="px-6 py-4">{req.rejectionReason || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-red-400 mb-4">
              Reject Leave Request
            </h3>
            <p className="text-gray-300 mb-4">
              Please provide a reason for rejecting this leave request:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 rounded-md bg-[#0f172a]/50 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-cyan-400 mb-4"
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeRejectionModal}
                disabled={actionLoading !== null}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  rejectionModal.requestId &&
                  handleReject(rejectionModal.requestId, rejectionReason)
                }
                disabled={actionLoading !== null}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl transition"
              >
                {actionLoading === rejectionModal.requestId
                  ? "Rejecting..."
                  : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
