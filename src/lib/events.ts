export type TicketEvent = {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  priceCents: number;
  capacity: number;
  seatsRemaining: number;
  imageUrl?: string;
  imageAlt?: string;
};

type WaitlistEntry = { eventId: string; name: string };
type TicketStore = { events: TicketEvent[]; waitlist: WaitlistEntry[] };

const initialEvents: TicketEvent[] = [
  {
    id: 'autumn-social',
    title: 'Autumn Social',
    startsAt: '2026-10-20T19:00:00.000Z',
    location: 'Cohon University Center',
    priceCents: 1200,
    capacity: 40,
    seatsRemaining: 12,
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'A live band performing under warm stage lights',
  },
  {
    id: 'film-on-the-green',
    title: 'Film on the Green',
    startsAt: '2026-10-24T23:00:00.000Z',
    location: 'The Cut, Carnegie Mellon University',
    priceCents: 0,
    capacity: 80,
    seatsRemaining: 38,
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Rows of red seats in a movie theater',
  },
  {
    id: 'fall-sound-session',
    title: 'Fall Sound Session',
    startsAt: '2026-10-30T23:30:00.000Z',
    location: 'Rangos Ballroom',
    priceCents: 800,
    capacity: 60,
    seatsRemaining: 0,
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'A crowd enjoying an outdoor music performance',
  },
];

const globalForTickets = globalThis as typeof globalThis & { tartanTicketStore?: TicketStore };
const store = globalForTickets.tartanTicketStore ??= { events: initialEvents, waitlist: [] };

export function getUpcomingEvents(now = new Date()): TicketEvent[] {
  return store.events
    .filter((event) => new Date(event.startsAt) > now)
    .map((event) => ({ ...event }));
}

export function getEvent(eventId: string): TicketEvent | undefined {
  return store.events.find((event) => event.id === eventId);
}

export function simulatePurchase(eventId: string, name: string): TicketEvent | undefined {
  const event = getEvent(eventId);
  if (!event || event.seatsRemaining < 1) return undefined;

  event.seatsRemaining -= 1;
  return { ...event };
}

export function joinWaitlist(eventId: string, name: string): 'joined' | 'unavailable' {
  const event = getEvent(eventId);
  if (!event || event.seatsRemaining > 0) return 'unavailable';

  store.waitlist.push({ eventId, name });
  return 'joined';
}