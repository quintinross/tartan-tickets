'use client';

import { useState, type FormEvent } from 'react';
import type { TicketEvent } from '@/lib/events';

type Props = { events: TicketEvent[] };
type Action = { eventId: string; kind: 'purchase' | 'waitlist' };

function eventDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function priceLabel(priceCents: number) {
  return priceCents === 0 ? 'Free' : `$${(priceCents / 100).toFixed(2)}`;
}

export function EventBrowser({ events: initialEvents }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [action, setAction] = useState<Action | null>(null);
  const [name, setName] = useState('');
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { message: string; isError: boolean }>>({});

  function openAction(eventId: string, kind: Action['kind']) {
    setName('');
    setAction({ eventId, kind });
    setFeedback((current) => ({ ...current, [eventId]: { message: '', isError: false } }));
  }

  async function submitAction(event: TicketEvent, formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!action || pendingEventId) return;

    setPendingEventId(event.id);
    const endpoint = action.kind === 'purchase' ? '/api/orders' : '/api/waitlist';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, name: name.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');

      if (result.event) {
        setEvents((current) => current.map((item) => item.id === event.id ? result.event : item));
      }
      setFeedback((current) => ({
        ...current,
        [event.id]: { message: result.message, isError: false },
      }));
      setAction(null);
    } catch (error) {
      setFeedback((current) => ({
        ...current,
        [event.id]: {
          message: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
          isError: true,
        },
      }));
    } finally {
      setPendingEventId(null);
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Tartan Tickets home">
          <span className="wordmark-mark" aria-hidden="true">T</span>
          <span>TARTAN TICKETS</span>
        </a>
        <span className="topbar-note"><span className="live-dot" /> CMU CAMPUS EVENTS</span>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <div className="intro-copy">
          <p className="eyebrow">YOUR CAMPUS, OUT THERE</p>
          <h1 id="page-title">Make room<br />for a good time.</h1>
          <p className="intro-description">The talks, shows, and little traditions worth stepping out for.</p>
        </div>
        <div className="intro-stamp" aria-hidden="true">
          <span className="stamp-top">PITTSBURGH</span>
          <span className="stamp-center">CMU</span>
          <span className="stamp-bottom">FALL / 2026</span>
        </div>
      </section>

      <section className="events-section" aria-labelledby="events-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ON THE CALENDAR</p>
            <h2 id="events-heading">Upcoming events</h2>
          </div>
          <p className="event-count">{events.length.toString().padStart(2, '0')} EVENTS</p>
        </div>

        {events.length === 0 ? (
          <p className="empty-state">No upcoming events yet.</p>
        ) : (
          <div className="event-grid">
            {events.map((event, index) => {
              const soldOut = event.seatsRemaining === 0;
              const eventAction = action?.eventId === event.id ? action.kind : null;
              const status = feedback[event.id];
              return (
                <article className="event-card" key={event.id}>
                  <div className="event-image-wrap">
                    {event.imageUrl && (
                      <img className="event-image" src={event.imageUrl} alt={event.imageAlt ?? ''} />
                    )}
                    <span className={`event-number event-number-${index + 1}`}>0{index + 1}</span>
                    {soldOut && <span className="sold-out-tag">SOLD OUT</span>}
                  </div>
                  <div className="event-body">
                    <p className="event-date">{eventDate(event.startsAt)}</p>
                    <h3>{event.title}</h3>
                    <p className="event-location">{event.location}</p>
                    <div className="event-meta">
                      <span className="event-price">{priceLabel(event.priceCents)}</span>
                      <span className={soldOut ? 'seats seats-sold' : 'seats'}>
                        {`${event.seatsRemaining} seats remaining`}
                      </span>
                    </div>

                    {eventAction ? (
                      <form className="action-form" onSubmit={(formEvent) => submitAction(event, formEvent)}>
                        <label htmlFor={`name-${event.id}`}>Your name</label>
                        <input
                          autoComplete="name"
                          id={`name-${event.id}`}
                          maxLength={80}
                          onChange={(inputEvent) => setName(inputEvent.target.value)}
                          placeholder="First and last name"
                          required
                          value={name}
                        />
                        <button className="action-button" disabled={pendingEventId === event.id} type="submit">
                          {pendingEventId === event.id
                            ? 'Processing…'
                            : eventAction === 'purchase' ? 'Simulated payment' : 'Confirm waitlist spot'}
                          <span aria-hidden="true">↗</span>
                        </button>
                      </form>
                    ) : (
                      <button
                        className={soldOut ? 'event-button event-button-waitlist' : 'event-button'}
                        onClick={() => openAction(event.id, soldOut ? 'waitlist' : 'purchase')}
                        type="button"
                      >
                        {soldOut ? 'Join waitlist' : 'Buy ticket'}
                        <span aria-hidden="true">↗</span>
                      </button>
                    )}
                    {status?.message && (
                      <p className={status.isError ? 'feedback feedback-error' : 'feedback'} role={status.isError ? 'alert' : 'status'}>
                        {status.message}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="page-footer">
        <span>CMU · STUDENT LIFE</span>
        <span>GOOD THINGS HAPPEN OFF SCRIPT.</span>
      </footer>
    </main>
  );
}