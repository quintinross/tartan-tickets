import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EventBrowser } from './event-browser';

const availableEvent = {
  id: 'autumn-social',
  title: 'Autumn Social',
  startsAt: '2026-10-20T19:00:00.000Z',
  location: 'Cohon University Center',
  priceCents: 1200,
  capacity: 40,
  seatsRemaining: 12,
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Story 1: Browse events', () => {
  it('shows an upcoming event date, location, price, and seats remaining', () => {
    render(<EventBrowser events={[availableEvent]} />);

    expect(screen.getByRole('heading', { name: 'Autumn Social' })).toBeInTheDocument();
    expect(screen.getByText(/October 20, 2026/)).toBeInTheDocument();
    expect(screen.getByText('Cohon University Center')).toBeInTheDocument();
    expect(screen.getByText('$12.00')).toBeInTheDocument();
    expect(screen.getByText('12 seats remaining')).toBeInTheDocument();
  });

  it('shows Join waitlist instead of Buy when an event is sold out', () => {
    render(<EventBrowser events={[{ ...availableEvent, seatsRemaining: 0 }]} />);

    expect(screen.getByRole('button', { name: 'Join waitlist' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Buy ticket' })).not.toBeInTheDocument();
    expect(screen.getByText('0 seats remaining')).toBeInTheDocument();
    expect(screen.getByText('SOLD OUT')).toBeInTheDocument();
  });

  it('shows the specified empty state when there are no upcoming events', () => {
    render(<EventBrowser events={[]} />);

    expect(screen.getByText('No upcoming events yet.')).toBeInTheDocument();
  });

  it('uses a typed name and simulated payment to claim a seat', async () => {
    const updatedEvent = { ...availableEvent, seatsRemaining: 11 };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ event: updatedEvent, message: 'Ticket reserved for Alex.' }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    render(<EventBrowser events={[availableEvent]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Buy ticket' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your name' }), {
      target: { value: 'Alex' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Simulated payment' }));

    expect(await screen.findByText('Ticket reserved for Alex.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/orders', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ eventId: availableEvent.id, name: 'Alex' }),
    }));
    expect(screen.getByText('11 seats remaining')).toBeInTheDocument();
  });

  it('lets a named student join a sold-out event waitlist', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'You joined the waitlist for Autumn Social.' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(<EventBrowser events={[{ ...availableEvent, seatsRemaining: 0 }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your name' }), {
      target: { value: 'Alex' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm waitlist spot' }));

    expect(await screen.findByText('You joined the waitlist for Autumn Social.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/waitlist', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ eventId: availableEvent.id, name: 'Alex' }),
    }));
  });
});

describe('Story B: Waitlist Notification', () => {
  it('lets a named student join a sold-out event waitlist and shows their queue position', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'You joined the waitlist for Autumn Social.' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(<EventBrowser events={[{ ...availableEvent, seatsRemaining: 0 }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your name' }), { target: { value: 'Alex' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm waitlist spot' }));

    expect(await screen.findByText('You joined the waitlist for Autumn Social.')).toBeInTheDocument();
    expect(await screen.findByText('You are #1 in line for Autumn Social.')).toBeInTheDocument();
  });

  it('sends a notification when a seat is released to the next waitlisted student', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'You joined the waitlist for Autumn Social.' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(<EventBrowser events={[{ ...availableEvent, seatsRemaining: 0 }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your name' }), { target: { value: 'Alex' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm waitlist spot' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Release next seat' }));

    expect(await screen.findByText('Seat available for Alex. Claim it before it expires.')).toBeInTheDocument();
  });

  it('gives the waitlisted student a claim action when the seat opens', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'You joined the waitlist for Autumn Social.' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(<EventBrowser events={[{ ...availableEvent, seatsRemaining: 0 }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your name' }), { target: { value: 'Alex' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm waitlist spot' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Release next seat' }));

    expect(await screen.findByRole('button', { name: 'Claim seat' })).toBeInTheDocument();
  });

  it('holds the seat until the student pays or declines it', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'You joined the waitlist for Autumn Social.' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(<EventBrowser events={[{ ...availableEvent, seatsRemaining: 0 }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your name' }), { target: { value: 'Alex' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm waitlist spot' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Release next seat' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Claim seat' }));

    expect(await screen.findByText('Seat held for Alex. Pay or decline to keep it.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay now' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decline seat' })).toBeInTheDocument();
  });

  it('expires the hold and offers the seat to the next student when the time is up', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'You joined the waitlist for Autumn Social.' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(<EventBrowser events={[{ ...availableEvent, seatsRemaining: 0 }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your name' }), { target: { value: 'Alex' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm waitlist spot' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Release next seat' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Claim seat' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Expire hold' }));

    expect(await screen.findByText('The seat was released because the hold expired.')).toBeInTheDocument();
  });

  it('does not send duplicate notifications for the same seat release', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'You joined the waitlist for Autumn Social.' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(<EventBrowser events={[{ ...availableEvent, seatsRemaining: 0 }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your name' }), { target: { value: 'Alex' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm waitlist spot' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Release next seat' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Release next seat' }));

    expect(screen.getAllByText('Seat available for Alex. Claim it before it expires.')).toHaveLength(1);
  });

  it('keeps waitlists separate across multiple events', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'You joined the waitlist for Autumn Social.' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const anotherEvent = { ...availableEvent, id: 'fall-sound-session', title: 'Fall Sound Session', seatsRemaining: 0 };
    render(<EventBrowser events={[{ ...availableEvent, seatsRemaining: 0 }, anotherEvent]} />);

    const joinButtons = screen.getAllByRole('button', { name: 'Join waitlist' });
    fireEvent.click(joinButtons[0]);
    fireEvent.change(screen.getByRole('textbox', { name: 'Your name' }), { target: { value: 'Alex' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm waitlist spot' }));

    expect(await screen.findByText('You are #1 in line for Autumn Social.')).toBeInTheDocument();
    expect(screen.getByText('Fall Sound Session')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Join waitlist' })).toHaveLength(2);
  });

  it('uses the waitlist flow when the event is sold out', async () => {
    render(<EventBrowser events={[{ ...availableEvent, seatsRemaining: 0 }]} />);

    expect(screen.getByRole('button', { name: 'Join waitlist' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Buy ticket' })).not.toBeInTheDocument();
  });
});