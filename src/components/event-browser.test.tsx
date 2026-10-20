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