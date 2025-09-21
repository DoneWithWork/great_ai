import { getMyLeaveRequests } from "@/lib/actions/user.actions";

// function AllLeaveRequests({ requests }: { requests: LeaveRequest[] }) {
//   return (
//     <div className="glass-card p-6 mt-8">
//       <h2 className="text-xl font-bold mb-4">Your Leave Requests</h2>
//       {requests.length > 0 ? (
//         <ul>
//           {requests.map((request) => (
//             <li key={request.id} className="mb-2 p-2 rounded-lg bg-white/10">
//               <p>
//                 <strong>Dates:</strong>{" "}
//                 {new Date(request.startDate).toLocaleDateString()} -{" "}
//                 {new Date(request.endDate).toLocaleDateString()}
//               </p>
//               <p>
//                 <strong>Type:</strong> {request.leaveType}
//               </p>
//               <p>
//                 <strong>Status:</strong>{" "}
//                 <span
//                   className={`px-2 py-1 rounded-full text-xs ${
//                     request.approvalStatus === "approved"
//                       ? "bg-green-500"
//                       : request.approvalStatus === "rejected"
//                       ? "bg-red-500"
//                       : "bg-yellow-500"
//                   }`}
//                 >
//                   {request.approvalStatus}
//                 </span>
//               </p>
//               {request.reason && (
//                 <p className="text-sm mt-1">
//                   <strong>Reason:</strong> {request.reason}
//                 </p>
//               )}
//             </li>
//           ))}
//         </ul>
//       ) : (
//         <p>You have not made any leave requests.</p>
//       )}
//     </div>
//   );
// }

export default async function RequestsPage() {
  const result = await getMyLeaveRequests();

  // Handle error cases
  if ("error" in result) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-4">Leave Requests</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {result.error}
        </div>
        <p className="text-lg mb-8">
          Please try again later or contact support if the problem persists.
        </p>
      </div>
    );
  }

  const { requests } = result;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Leave Requests</h1>
      <p className="text-lg mb-8">
        Submit a new leave request or view your existing ones.
      </p>

      {requests && requests.length > 0 ? (
        <div className="glass-card p-6 mt-8">
          <h2 className="text-xl font-bold mb-4">Your Leave Requests</h2>
          <ul>
            {requests.map((request) => (
              <li key={request.id} className="mb-2 p-2 rounded-lg bg-white/10">
                <p>
                  <strong>Dates:</strong>{" "}
                  {new Date(request.startDate).toLocaleDateString()} -{" "}
                  {new Date(request.endDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Type:</strong> {request.leaveType}
                </p>
                <p>
                  <strong>Status:</strong> {request.approvalStatus}
                </p>
                {request.reason && (
                  <p>
                    <strong>Reason:</strong> {request.reason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="glass-card p-6 mt-8">
          <h2 className="text-xl font-bold mb-4">Your Leave Requests</h2>
          <p>You have not made any leave requests yet.</p>
        </div>
      )}
    </div>
  );
}
