"use client";
import { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Event } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { DeepARInput } from "@/types/types";
import { getRosterAction } from "@/app/actions/getRoster";

const localizer = momentLocalizer(moment);

export default function RosterPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchRoster() {
    // Example DeepAR input
    setLoading(true);
    const input: DeepARInput = {
      instances: [
        { start: "2025-09-21T00:00:00", target: [10, 12, 15, 17, 20] },
      ],
      configuration: {
        num_samples: 100,
        output_types: ["mean"],
        quantiles: ["0.1", "0.5", "0.9"],
      },
    };

    const roster = await getRosterAction(input);
    if (roster && typeof roster === "object" && !Array.isArray(roster)) {
      setEvents(transformRosterToEvents(roster as Roster));
    }
    setLoading(false);
  }

  const eventStyleGetter = (event: Event) => {
    let backgroundColor = "#0ea5e9"; // default

    if (typeof event.title === "string") {
      const nurseId = event.title.split(" - ")[0]; // get n001
      let hash = 0;
      for (let i = 0; i < nurseId.length; i++) {
        hash = nurseId.charCodeAt(i) + ((hash << 5) - hash);
      }
      backgroundColor = `hsl(${hash % 360}, 60%, 50%)`; // pastel-like unique colour
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
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-4xl font-bold mb-4 md:mb-0 text-cyan-400">
          Weekly Roster
        </h1>
      </div>
      <button
        onClick={fetchRoster}
        className={`px-6 py-3 font-semibold rounded-xl transition-colors my-3 ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        } text-white flex items-center justify-center gap-2`}
        disabled={loading}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            Generating...
          </>
        ) : (
          "Generate Roster"
        )}
      </button>
      <section className="bg-[#1e293b] rounded-3xl p-6 shadow-lg mb-12">
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
        />
      </section>
    </main>
  );
}
type Roster = {
  [day: string]: {
    day_shift: string[];
    night_shift: string[];
  };
};

function transformRosterToEvents(roster: Roster): Event[] {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const events: Event[] = [];

  // Reference Sunday at 00:00:00
  const today = new Date();
  const referenceSunday = new Date(today);
  referenceSunday.setDate(today.getDate() - today.getDay());
  referenceSunday.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysOfWeek.length; i++) {
    const dayName = daysOfWeek[i];
    const dayShifts = roster[dayName];
    if (!dayShifts) continue;

    // Day shift: 12 AM - 12 PM
    dayShifts.day_shift.forEach((nurseId) => {
      const start = new Date(referenceSunday);
      start.setDate(referenceSunday.getDate() + i);
      start.setHours(0, 0, 0, 0); // 12 AM

      const end = new Date(start);
      end.setHours(23, 59, 0, 0); // 11:59 PM same day

      events.push({
        title: `${nurseId} - Day`,
        start,
        end,
      });
    });

    // Night shift: 12 PM - 12 AM
    dayShifts.night_shift.forEach((nurseId) => {
      const start = new Date(referenceSunday);
      start.setDate(referenceSunday.getDate() + i);
      start.setHours(12, 0, 0, 0); // 12 PM

      const end = new Date(start);
      end.setDate(end.getDate() + 1); // next day
      end.setHours(0, 0, 0, 0); // 12 AM next day

      events.push({
        title: `${nurseId} - Night`,
        start,
        end,
      });
    });
  }

  return events;
}
