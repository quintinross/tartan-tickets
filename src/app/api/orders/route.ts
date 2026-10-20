import { NextResponse } from 'next/server';
import { simulatePurchase } from '@/lib/events';

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

  const event = simulatePurchase(eventId, name);
  if (!event) {
    return NextResponse.json({ error: 'That event has sold out.' }, { status: 409 });
  }

  return NextResponse.json(
    { event, message: `Simulated payment complete. Your spot is saved, ${name}.` },
    { status: 201 },
  );
}