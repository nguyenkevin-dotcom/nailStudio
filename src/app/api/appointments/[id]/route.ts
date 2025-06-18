
import { NextResponse, type NextRequest } from 'next/server';
import { query } from '@/lib/db';

interface Params {
  id: string;
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid appointment ID' }, { status: 400 });
    }

    const result = await query('DELETE FROM appointments WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Appointment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete appointment:', error);
    return NextResponse.json({ message: 'Failed to delete appointment', error: (error as Error).message }, { status: 500 });
  }
}
