"use client";

import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const mockPatients = [
  { id: 1, name: "John Doe", age: 72, condition: "Stable", room: "101A" },
  { id: 2, name: "Jane Smith", age: 65, condition: "Critical", room: "102B" },
  {
    id: 3,
    name: "Carlos Ruiz",
    age: 58,
    condition: "Recovering",
    room: "103C",
  },
  { id: 4, name: "Aisha Khan", age: 81, condition: "Stable", room: "104D" },
];

const vitalsData = [
  { name: "John", heartRate: 78, bp: 120 },
  { name: "Jane", heartRate: 95, bp: 145 },
  { name: "Carlos", heartRate: 85, bp: 130 },
  { name: "Aisha", heartRate: 70, bp: 115 },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12">
        <h1 className="text-4xl font-bold mb-4 md:mb-0">Nurse Dashboard</h1>
        <Link
          href="/nurse/roster"
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-3 px-6 rounded-xl shadow-lg transition transform hover:scale-105"
        >
          Go to Roster
        </Link>
      </div>

      {/* Patients Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {mockPatients.map((patient) => (
          <div
            key={patient.id}
            className="bg-gray-800 rounded-3xl p-6 hover:bg-gray-700 transition shadow-lg"
          >
            <h3 className="text-2xl font-semibold mb-2 text-gray-100">
              {patient.name}
            </h3>
            <p className="text-gray-400">Age: {patient.age}</p>
            <p className="text-gray-400">
              Condition:{" "}
              <span
                className={`font-bold ${
                  patient.condition === "Critical"
                    ? "text-red-500"
                    : patient.condition === "Recovering"
                    ? "text-yellow-400"
                    : "text-green-400"
                }`}
              >
                {patient.condition}
              </span>
            </p>
            <p className="text-gray-400">Room: {patient.room}</p>
          </div>
        ))}
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        {/* Heart Rate Line Chart */}
        <div className="bg-gray-800 rounded-3xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Heart Rate Overview</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={vitalsData}>
              <CartesianGrid stroke="#444" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="heartRate"
                stroke="#06b6d4"
                strokeWidth={3}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Blood Pressure Bar Chart */}
        <div className="bg-gray-800 rounded-3xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Blood Pressure Overview</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={vitalsData}>
              <CartesianGrid stroke="#444" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Legend />
              <Bar dataKey="bp" fill="#10b981" barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Stats / Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-3xl p-6 shadow-lg hover:bg-gray-700 transition">
          <h3 className="text-2xl font-bold mb-2">Total Patients</h3>
          <p className="text-3xl font-extrabold text-cyan-400">
            {mockPatients.length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-3xl p-6 shadow-lg hover:bg-gray-700 transition">
          <h3 className="text-2xl font-bold mb-2">Critical Cases</h3>
          <p className="text-3xl font-extrabold text-red-500">
            {mockPatients.filter((p) => p.condition === "Critical").length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-3xl p-6 shadow-lg hover:bg-gray-700 transition">
          <h3 className="text-2xl font-bold mb-2">Stable Patients</h3>
          <p className="text-3xl font-extrabold text-green-400">
            {mockPatients.filter((p) => p.condition === "Stable").length}
          </p>
        </div>
      </section>
    </main>
  );
}
