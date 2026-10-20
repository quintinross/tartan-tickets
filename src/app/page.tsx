import { EventBrowser } from '@/components/event-browser';
import { getUpcomingEvents } from '@/lib/events';

export const dynamic = 'force-dynamic';

export default function Home() {
  return <EventBrowser events={getUpcomingEvents()} />;
}