import { getCurrentNurseData } from "@/lib/actions/user.actions";
import { notFound } from "next/navigation";
import Link from "next/link";

// A simple component to display upcoming shifts
function UpcomingShifts({ shifts }: { shifts: any[] }) {
  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-bold mb-4">Upcoming Shifts</h2>
      {shifts.length > 0 ? (
        <ul>
          {shifts.map((rosterItem) => (
            <li key={rosterItem.id} className="mb-2 p-2 rounded-lg bg-white/10">
              <p><strong>Date:</strong> {new Date(rosterItem.date).toLocaleDateString()}</p>
              <p><strong>Shift:</strong> {rosterItem.shift.name} ({rosterItem.shift.shiftType})</p>
              <p><strong>Time:</strong> {new Date(rosterItem.shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(rosterItem.shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No upcoming shifts.</p>
      )}
    </div>
  );
}

// A simple component to display recent leave requests
function RecentLeaveRequests({ requests }: { requests: any[] }) {
  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-bold mb-4">Recent Leave Requests</h2>
      {requests.length > 0 ? (
        <ul>
          {requests.map((request) => (
            <li key={request.id} className="mb-2 p-2 rounded-lg bg-white/10">
              <p><strong>Dates:</strong> {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}</p>
              <p><strong>Type:</strong> {request.leaveType}</p>
              <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-xs ${request.approvalStatus === 'approved' ? 'bg-green-500' : request.approvalStatus === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}>{request.approvalStatus}</span></p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No recent leave requests.</p>
      )}
    </div>
  );
}


export default async function DashboardPage() {
  const { nurse, user } = await getCurrentNurseData();

  if (!nurse || !user) {
    // The server action already calls notFound(), but we do it here again for safety.
    return notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Welcome, {user.fullName}!</h1>
      <p className="text-lg mb-8">Here's a summary of your schedule and requests.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UpcomingShifts shifts={nurse.rosters} />
        <RecentLeaveRequests requests={nurse.leaveRequests} />
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/requests" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">
          Request Leave
        </Link>
        <Link href="/roster" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">
          View Full Roster
        </Link>
      </div>
    </div>
  );
}