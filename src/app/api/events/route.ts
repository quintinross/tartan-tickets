import { NextResponse } from 'next/server';
import { getUpcomingEvents } from '@/lib/events';

export function GET() {
  return NextResponse.json(getUpcomingEvents());
}