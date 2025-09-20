export default async function DashboardPage() {
  // const { nurse, user } = await getCurrentNurseData();

  // if (!nurse || !user) {
  //   return notFound();
  // }

  return (
    <div>
      {/* <h1 className="text-3xl font-bold mb-4">Welcome, {user.fullName}!</h1>
      <p className="text-lg mb-8">
        Here's a summary of your schedule and requests.
      </p> */}

      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UpcomingShifts shifts={nurse.rosters} />
        <RecentLeaveRequests requests={nurse.leaveRequests} />
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/requests"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
        >
          Request Leave
        </Link>
        <Link
          href="/roster"
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
        >
          View Full Roster
        </Link>
      </div> */}
    </div>
  );
}
