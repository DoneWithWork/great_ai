# 🚀 Quick Start Implementation Guide

**Get your Malaysian Nurse Rostering System integrated with your Next.js app in 30 minutes!**

---

## 📋 Prerequisites

- ✅ `great_ai` repository cloned and set up
- ✅ `final_complete_system.py` working in parent directory
- ✅ Node.js and pnpm installed
- ✅ Supabase project created and configured
- ✅ Supabase URL and anon key in `.env.local`

---

## 🔥 Step-by-Step Integration (30 minutes)

### Step 1: Database Schema (10 minutes)

First, install Supabase client:
```bash
pnpm add @supabase/supabase-js
```

Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Update `db/schema.ts` with Supabase-compatible schema:

```typescript
import { sql } from "drizzle-orm";
import { integer, text, timestamp, json, pgTable, boolean } from "drizzle-orm/pg-core";

// Nurses table
export const nurses = pgTable("nurses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  skills: json("skills").$type<string[]>().default(sql`'[]'::json`),
  contract: text("contract").default("FullTime"), // FullTime, PartTime
  preferences: json("preferences").$type<{
    preferredShifts: string[];
    unavailableDays: string[];
  }>().default(sql`'{}'::json`),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Schedules table
export const schedules = pgTable("schedules", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  scenarioId: text("scenario_id").notNull(),
  weekStartDate: timestamp("week_start_date", { withTimezone: true }).notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
  complianceScore: integer("compliance_score").default(0),
  totalCost: integer("total_cost").default(0),
  status: text("status").default("active"), // active, archived
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Schedule assignments table
export const assignments = pgTable("assignments", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  scheduleId: text("schedule_id").references(() => schedules.id, { onDelete: "cascade" }),
  nurseId: text("nurse_id").references(() => nurses.id, { onDelete: "cascade" }),
  day: integer("day").notNull(), // 0-6 (Mon-Sun)
  dayName: text("day_name").notNull(),
  shift: text("shift").notNull(), // Early, Late, Day, Night
  hours: integer("hours").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

Create `lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Supabase client for auth and realtime
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Database connection for Drizzle
const connectionString = `${supabaseUrl}/db?apikey=${supabaseServiceKey}`;
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
```

Run Supabase setup:
```bash
# Generate migration
pnpm drizzle-kit generate

# Apply to Supabase (you'll need to run the SQL in Supabase dashboard)
# Or use Supabase CLI: supabase db push
```

### Step 2: Python Integration Service (10 minutes)

Create `lib/python-integration.ts`:

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface ScheduleRequest {
  scenarioId: string;
  nurses: Array<{
    id: string;
    skills: string[];
    contract: string;
    preferences?: any;
  }>;
}

export interface ScheduleResult {
  success: boolean;
  data?: {
    scenario_id: string;
    assignments: Array<{
      nurse: string;
      day: number;
      day_name: string;
      shift: string;
      hours: number;
    }>;
    statistics: {
      total_hours: number;
      compliance_score: number;
      total_cost: number;
    };
  };
  error?: string;
}

export async function generateSchedule(request: ScheduleRequest): Promise<ScheduleResult> {
  try {
    // Path to your Python system
    const pythonScript = path.join(process.cwd(), '..', 'final_complete_system.py');
    
    // Create temporary input file
    const inputData = JSON.stringify(request);
    
    // Execute Python system
    const command = `python3 ${pythonScript} --input='${inputData}'`;
    const { stdout, stderr } = await execAsync(command, { 
      timeout: 180000, // 3 minutes timeout
      cwd: path.join(process.cwd(), '..')
    });

    if (stderr) {
      console.error('Python stderr:', stderr);
    }

    // Parse result
    const result = JSON.parse(stdout);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Schedule generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### Step 3: API Route (5 minutes)

Create `app/api/generate-schedule/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateSchedule } from '@/lib/python-integration';
import { db } from '@/lib/supabase';
import { schedules, assignments } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Call Python optimization system
    const result = await generateSchedule(body);
    
    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Schedule generation failed' },
        { status: 500 }
      );
    }

    // Save to Supabase
    const scheduleId = uuidv4();
    await db.insert(schedules).values({
      id: scheduleId,
      scenarioId: result.data.scenario_id,
      weekStartDate: new Date(),
      complianceScore: Math.round(result.data.statistics.compliance_score || 0),
      totalCost: Math.round(result.data.statistics.total_cost || 0),
    });

    // Save assignments
    const assignmentData = result.data.assignments.map(assignment => ({
      id: uuidv4(),
      scheduleId: scheduleId,
      nurseId: assignment.nurse,
      day: assignment.day,
      dayName: assignment.day_name,
      shift: assignment.shift,
      hours: assignment.hours,
    }));

    await db.insert(assignments).values(assignmentData);

    return NextResponse.json({
      success: true,
      scheduleId: scheduleId,
      data: result.data
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 4: Basic Dashboard (5 minutes)

Create `app/dashboard/page.tsx`:

```tsx
'use client';

import { useState } from 'react';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const generateTestSchedule = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: 'n030w4',
          nurses: [
            { id: 'nurse_1', skills: ['GeneralCare'], contract: 'FullTime' },
            { id: 'nurse_2', skills: ['GeneralCare'], contract: 'FullTime' },
            { id: 'nurse_3', skills: ['GeneralCare'], contract: 'PartTime' },
          ]
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">🏥 Malaysian Nurse Rostering Dashboard</h1>
      
      <div className="mb-8">
        <button
          onClick={generateTestSchedule}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? '⏳ Generating Schedule...' : '🚀 Generate Test Schedule'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Schedule Result:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded">
              <div className="text-sm text-gray-600">Compliance Score</div>
              <div className="text-2xl font-bold text-green-600">
                {result.data?.statistics?.compliance_score || 0}%
              </div>
            </div>
            <div className="bg-white p-4 rounded">
              <div className="text-sm text-gray-600">Total Hours</div>
              <div className="text-2xl font-bold">
                {result.data?.statistics?.total_hours || 0}h
              </div>
            </div>
            <div className="bg-white p-4 rounded">
              <div className="text-sm text-gray-600">Total Cost</div>
              <div className="text-2xl font-bold text-blue-600">
                RM{result.data?.statistics?.total_cost || 0}
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded">
            <h3 className="font-bold mb-2">Assignments:</h3>
            <div className="text-sm">
              {result.data?.assignments?.slice(0, 5).map((assignment: any, idx: number) => (
                <div key={idx} className="mb-1">
                  {assignment.nurse} - {assignment.day_name} - {assignment.shift} ({assignment.hours}h)
                </div>
              ))}
              {result.data?.assignments?.length > 5 && (
                <div className="text-gray-500">...and {result.data.assignments.length - 5} more</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Test Your Integration

1. **Copy your Python system:**
   ```bash
   cp ../final_complete_system.py .
   cp -r ../datasets_json .
   ```

2. **Install additional dependencies:**
   ```bash
   pnpm add uuid @types/uuid postgres
   ```

3. **Set up Supabase project:**
   - Go to https://supabase.com
   - Create new project
   - Copy URL and anon key to `.env.local`
   - Run the generated SQL from `drizzle-kit generate` in Supabase SQL editor

4. **Start development server:**
   ```bash
   pnpm dev
   ```

3. **Visit dashboard:**
   - Open http://localhost:3000/dashboard
   - Click "Generate Test Schedule"
   - See Malaysian-compliant schedule with compliance score!

---

## 🎉 You Did It!

**In 30 minutes, you've created:**
- ✅ Database schema for nurse rostering
- ✅ Python integration service  
- ✅ API endpoint for schedule generation
- ✅ Dashboard to view results

**Next steps:**
- Add nurse management UI
- Create interactive schedule calendar
- Add mobile responsive design
- Deploy to production

---

## 🆘 Troubleshooting

**Python execution fails?**
- Ensure `final_complete_system.py` is in parent directory
- Check Python dependencies are installed
- Verify datasets_json folder exists

**Supabase setup issues?**
- Verify SUPABASE_URL and SUPABASE_ANON_KEY in `.env.local`
- Check if tables exist in Supabase dashboard
- Run the SQL migration manually in Supabase SQL editor
- Ensure Row Level Security (RLS) is disabled for testing

**Database errors?**
- Check Supabase project is active and accessible
- Verify environment variables are correct
- Check Supabase logs in dashboard for detailed errors

**Need help?** Check the main `INTEGRATION_GUIDE.md` for detailed explanations.

---

*Quick Start Guide - Get running in 30 minutes!*
