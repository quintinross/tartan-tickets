import { NextResponse } from 'next/server';
import { joinWaitlist } from '@/lib/events';

export async function POST(request: Request) {
  let body: { eventId?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Please try again.' }, { status: 400 });
  }

  const eventId = body.eventId?.trim();
  const name = body.name?.trim();
  if (!eventId || !name || name.length > 80) {
    return NextResponse.json({ error: 'Enter your name to continue.' }, { status: 400 });
  }

  const result = joinWaitlist(eventId, name);
  if (result === 'unavailable') {
    return NextResponse.json({ error: 'Waitlist is not available for this event.' }, { status: 409 });
  }
  if (result === 'duplicate') {
    return NextResponse.json({ error: 'That name is already on the waitlist.' }, { status: 409 });
  }

  return NextResponse.json({ message: `You joined the waitlist for ${name}.` }, { status: 201 });
}