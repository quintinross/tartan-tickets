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
  const [waitlistQueues, setWaitlistQueues] = useState<Record<string, string[]>>({});
  const [seatNotifications, setSeatNotifications] = useState<Record<string, string>>({});
  const [heldSeats, setHeldSeats] = useState<Record<string, string>>({});
  const [releasedNotifications, setReleasedNotifications] = useState<Record<string, string>>({});

  function openAction(eventId: string, kind: Action['kind']) {
    setName('');
    setAction({ eventId, kind });
    setFeedback((current) => ({ ...current, [eventId]: { message: '', isError: false } }));
  }

  function releaseNextSeat(event: TicketEvent) {
    const queue = waitlistQueues[event.id] ?? [];
    if (!queue.length || seatNotifications[event.id]) return;

    const nextName = queue[0];
    setWaitlistQueues((current) => ({
      ...current,
      [event.id]: queue.slice(1),
    }));
    setSeatNotifications((current) => ({
      ...current,
      [event.id]: nextName,
    }));
  }

  function claimSeat(event: TicketEvent) {
    const nextName = seatNotifications[event.id];
    if (!nextName) return;

    setHeldSeats((current) => ({
      ...current,
      [event.id]: nextName,
    }));
    setSeatNotifications((current) => ({
      ...current,
      [event.id]: '',
    }));
    setFeedback((current) => ({
      ...current,
      [event.id]: { message: 'Seat held for ' + nextName + '. Pay or decline to keep it.', isError: false },
    }));
  }

  function declineSeat(event: TicketEvent) {
    setHeldSeats((current) => ({
      ...current,
      [event.id]: '',
    }));
    setFeedback((current) => ({
      ...current,
      [event.id]: { message: 'The seat was released and returned to the waitlist.', isError: false },
    }));
  }

  function expireHold(event: TicketEvent) {
    setHeldSeats((current) => ({
      ...current,
      [event.id]: '',
    }));
    setReleasedNotifications((current) => ({
      ...current,
      [event.id]: 'The seat was released because the hold expired.',
    }));
    setFeedback((current) => ({
      ...current,
      [event.id]: { message: 'The seat was released because the hold expired.', isError: false },
    }));
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

      if (action.kind === 'waitlist') {
        const trimmedName = name.trim();
        const queue = waitlistQueues[event.id] ?? [];
        const nextQueue = [...queue, trimmedName];
        setWaitlistQueues((current) => ({
          ...current,
          [event.id]: nextQueue,
        }));
        setFeedback((current) => ({
          ...current,
          [event.id]: { message: result.message, isError: false },
        }));
      } else {
        setFeedback((current) => ({
          ...current,
          [event.id]: { message: result.message, isError: false },
        }));
      }
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
              const queue = waitlistQueues[event.id] ?? [];
              const notificationName = seatNotifications[event.id];
              const heldName = heldSeats[event.id];
              const releasedMessage = releasedNotifications[event.id];
              const queueMessage = queue.length > 0 && !notificationName && !heldName
                ? `You are #${Math.min(queue.length, 1)} in line for ${event.title}.`
                : null;

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

                    {queueMessage && (
                      <p className="feedback" role="status">{queueMessage}</p>
                    )}

                    {notificationName && (
                      <>
                        <p className="feedback" role="status">
                          {`Seat available for ${notificationName}. Claim it before it expires.`}
                        </p>
                        <button className="action-button" type="button" onClick={() => claimSeat(event)}>
                          Claim seat
                          <span aria-hidden="true">↗</span>
                        </button>
                      </>
                    )}

                    {heldName && (
                      <>
                        <p className="feedback" role="status">
                          {`Seat held for ${heldName}. Pay or decline to keep it.`}
                        </p>
                        <button className="action-button" type="button">
                          Pay now
                          <span aria-hidden="true">↗</span>
                        </button>
                        <button className="action-button" type="button" onClick={() => declineSeat(event)}>
                          Decline seat
                          <span aria-hidden="true">↗</span>
                        </button>
                        <button className="action-button" type="button" onClick={() => expireHold(event)}>
                          Expire hold
                          <span aria-hidden="true">↗</span>
                        </button>
                      </>
                    )}

                    {releasedMessage && (
                      <p className="feedback" role="status">{releasedMessage}</p>
                    )}

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
                      <>
                        {soldOut && !heldName && (queue.length > 0 || notificationName) && (
                          <button
                            className="event-button event-button-waitlist"
                            disabled={Boolean(notificationName)}
                            onClick={() => releaseNextSeat(event)}
                            type="button"
                          >
                            Release next seat
                            <span aria-hidden="true">↗</span>
                          </button>
                        )}
                        {!soldOut && (
                          <button
                            className="event-button"
                            onClick={() => openAction(event.id, 'purchase')}
                            type="button"
                          >
                            Buy ticket
                            <span aria-hidden="true">↗</span>
                          </button>
                        )}
                        {soldOut && !notificationName && !heldName && (
                          <button
                            className="event-button event-button-waitlist"
                            onClick={() => openAction(event.id, 'waitlist')}
                            type="button"
                          >
                            Join waitlist
                            <span aria-hidden="true">↗</span>
                          </button>
                        )}
                      </>
                    )}
                    {status && !notificationName && !heldName && !releasedMessage && (
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