import { getAdminDashboardData } from "@/lib/actions/admin.actions";

// A component to display pending leave requests
// function PendingLeaveRequests({ requests }: { requests: LeaveRequest[] }) {
//   return (
//     <div className="glass-card p-6">
//       <h2 className="text-xl font-bold mb-4">Pending Leave Requests</h2>
//       {requests.length > 0 ? (
//         <ul>
//           {requests.map((request) => (
//             <li key={request.id} className="mb-2 p-2 rounded-lg bg-white/10">
//               <p>
//                 <strong>Nurse:</strong> {request.nurse.user.fullName}
//               </p>
//               <p>
//                 <strong>Dates:</strong>{" "}
//                 {new Date(request.startDate).toLocaleDateString()} -{" "}
//                 {new Date(request.endDate).toLocaleDateString()}
//               </p>
//               <p>
//                 <strong>Type:</strong> {request.leaveType}
//               </p>
//               <div className="flex gap-2 mt-2">
//                 <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-lg text-xs transition-colors">
//                   Approve
//                 </button>
//                 <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-lg text-xs transition-colors">
//                   Reject
//                 </button>
//               </div>
//             </li>
//           ))}
//         </ul>
//       ) : (
//         <p>No pending leave requests.</p>
//       )}
//     </div>
//   );
// }

export default async function AdminDashboardPage() {
  const { error } = await getAdminDashboardData();

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-lg mb-8">Overview of nurses and pending requests.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"></div>
    </div>
  );
}
