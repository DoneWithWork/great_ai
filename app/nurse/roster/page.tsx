"use client";

import { useState } from "react";
import { Calendar, momentLocalizer, Event } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Link from "next/link";

const localizer = momentLocalizer(moment);

const mockRoster: Event[] = [
  {
    title: "John Doe - Morning",
    start: new Date(2025, 8, 21, 8, 0),
    end: new Date(2025, 8, 21, 20, 0),
  },
  {
    title: "Jane Smith - Night",
    start: new Date(2025, 8, 22, 20, 0),
    end: new Date(2025, 8, 23, 8, 0),
  },
  {
    title: "Carlos Ruiz - Evening",
    start: new Date(2025, 8, 23, 14, 0),
    end: new Date(2025, 8, 23, 22, 0),
  },
  {
    title: "Aisha Khan - Morning",
    start: new Date(2025, 8, 24, 8, 0),
    end: new Date(2025, 8, 24, 20, 0),
  },
];

export default function RosterPage() {
  const [events] = useState(mockRoster);

  const eventStyleGetter = (event: Event) => {
    let backgroundColor = "#0ea5e9"; // cyan
    if (typeof event.title === "string") {
      if (event.title.toLowerCase().includes("night"))
        backgroundColor = "#8b5cf6";
      else if (event.title.toLowerCase().includes("evening"))
        backgroundColor = "#facc15";
    }
    return {
      style: {
        backgroundColor,
        color: "#f0f9ff",
        borderRadius: "6px",
        border: "none",
        padding: "2px",
      },
    };
  };

  const handleAddToGoogleCalendar = (event: Event) => {
    alert(`Adding ${event.title} to Google Calendar!`);
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-gray-100 p-2 md:p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-4xl font-bold mb-4 md:mb-0 text-cyan-400">
          Weekly Roster
        </h1>
        <Link
          href="/nurse/dashboard"
          className="bg-[#1e3a8a] hover:bg-[#1e40af] text-cyan-200 font-bold py-3 px-6 rounded-xl shadow-lg transition transform hover:scale-105"
        >
          Back to Dashboard
        </Link>
      </div>
      {/* Weekly Calendar */}
      <section className="bg-[#1e293b] rounded-3xl p-6 shadow-lg mb-12">
        <h2 className="text-2xl font-bold mb-4 text-cyan-300">
          {"This Weeks Shifts"}
        </h2>
        <div className="react-big-calendar dark-calendar">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView="week"
            views={["week"]}
            step={60}
            timeslots={1}
            style={{ height: 600 }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(event) => handleAddToGoogleCalendar(event)}
            min={new Date(2025, 8, 21, 0, 0)} // 24h
            max={new Date(2025, 8, 21, 23, 59)}
          />
        </div>
      </section>
      {/* Past Week Table
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-cyan-300">Past Weeks</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-[#1e293b] rounded-2xl overflow-hidden">
            <thead>
              <tr className="text-left text-gray-400 uppercase border-b border-[#334155]">
                <th className="px-6 py-3">Week</th>
                <th className="px-6 py-3">Total Shifts</th>
                <th className="px-6 py-3">Critical Shifts</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-[#334155] transition">
                <td className="px-6 py-4">2025-09-14 → 2025-09-20</td>
                <td className="px-6 py-4">12</td>
                <td className="px-6 py-4 text-red-400 font-bold">3</td>
              </tr>
              <tr className="hover:bg-[#334155] transition">
                <td className="px-6 py-4">2025-09-07 → 2025-09-13</td>
                <td className="px-6 py-4">14</td>
                <td className="px-6 py-4 text-red-400 font-bold">2</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section> */}
    </main>
  );
}
