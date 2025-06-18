
import { NextResponse, type NextRequest } from 'next/server';
import { query } from '@/lib/db';
import type { Appointment, NewAppointment } from '@/types';
import { z } from 'zod';
import { format } from 'date-fns';

const appointmentSchema = z.object({
  name: z.string().min(2).max(50),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date string" }), // Expecting ISO string
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format" }),
  services: z.array(z.string()).min(1),
  groupSize: z.number().min(1).max(3),
  phoneNumber: z.string().optional(),
});


export async function GET() {
  try {
    const result = await query('SELECT id, name, date, time, services, group_size AS "groupSize", phone_number AS "phoneNumber" FROM appointments ORDER BY date, time');
    // Ensure date is returned in a consistent format (YYYY-MM-DD) or as Date objects
    const appointments = result.rows.map(app => ({
      ...app,
      date: new Date(app.date) // Ensure date is a Date object
    }));
    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Failed to fetch appointments:', error);
    return NextResponse.json({ message: 'Failed to fetch appointments', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = appointmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.format() }, { status: 400 });
    }
    
    const { name, date, time, services, groupSize, phoneNumber } = validation.data;

    // Format date for SQL (YYYY-MM-DD)
    const formattedDate = format(new Date(date), 'yyyy-MM-dd');

    const result = await query(
      'INSERT INTO appointments (name, date, time, services, group_size, phone_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, date, time, services, group_size AS "groupSize", phone_number AS "phoneNumber"',
      [name, formattedDate, time, services, groupSize, phoneNumber || null]
    );
    const newAppointment: Appointment = {
      ...result.rows[0],
      date: new Date(result.rows[0].date) // Ensure date is a Date object
    };
    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error('Failed to create appointment:', error);
    return NextResponse.json({ message: 'Failed to create appointment', error: (error as Error).message }, { status: 500 });
  }
}
