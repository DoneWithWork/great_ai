// seed-nurses.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { nurse, users } from "./db/schema";
import { sql } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // make sure this is set
});

const db = drizzle(pool);

const DEPARTMENTS = [
  "ICU",
  "Emergency",
  "Pediatrics",
  "Oncology",
  "Cardiology",
  "Surgery",
  "Maternity",
  "Radiology",
  "Neurology",
  "Orthopedics",
];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDayOffs(): number[] {
  const day1 = getRandomInt(0, 6);
  let day2 = getRandomInt(0, 6);
  while (day2 === day1) day2 = getRandomInt(0, 6);
  return [day1, day2];
}

function getRandomShift(): "day" | "night" | "flexible" {
  const shifts: Array<"day" | "night" | "flexible"> = [
    "day",
    "night",
    "flexible",
  ];
  return shifts[getRandomInt(0, shifts.length - 1)];
}

function getRandomDepartment(): string {
  return DEPARTMENTS[getRandomInt(0, DEPARTMENTS.length - 1)];
}

export async function seedNurses() {
  try {
    const NUM_NURSES = 100; // change as needed

    for (let i = 1; i <= NUM_NURSES; i++) {
      const userId = `nurse-${Date.now()}-${i}`;
      const fullName = `Nurse ${i}`;
      const email = `nurse${Date.now()}-${i}@example.com`;

      // Insert user record
      await db.insert(users).values({
        id: userId,
        fullName,
        email,
        role: "nurse",
        bio: `This is the bio for ${fullName}`,
        onBoarded: true,
        phone: `01234567${i}`,
        createdAt: sql`now()`,
        updatedAt: sql`now()`,
        deletedAt: null,
      });

      // Insert nurse record
      await db.insert(nurse).values({
        userId,
        preferredShift: getRandomShift(),
        department: getRandomDepartment(),
        contractHours: 40 + getRandomInt(0, 10),
        active: true,
        dayOffs: getRandomDayOffs(),
        createdAt: sql`now()`,
        updatedAt: sql`now()`,
        deletedAt: null,
      });
    }

    console.log("Nurse seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}
