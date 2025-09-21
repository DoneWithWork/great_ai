"use client";
import { getRosterAction } from "@/app/actions/getRoster";
import { DeepARInput } from "@/types/types";
import { useTransition } from "react";

export default function AdminDashboardPage() {
  const [isPending, startTransition] = useTransition();

  async function getRoster() {
    const userInput: DeepARInput = {
      instances: [
        {
          start: "2024-01-01T00:00:00",
          target: [10, 12, 15, 17, 20, 22, 25, 27],
        },
      ],
      configuration: {
        num_samples: 100,
        output_types: ["mean", "quantiles"],
        quantiles: ["0.1", "0.5", "0.9"],
      },
    };
    startTransition(async () => {
      let N = await getRosterAction(userInput);
      N = N ? Math.ceil(N) : null;
    });
  }
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-lg mb-8">Overview of nurses and pending requests.</p>
      <button
        onClick={getRoster}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        {isPending ? "Loading..." : "Generating roster"}
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"></div>
    </div>
  );
}
