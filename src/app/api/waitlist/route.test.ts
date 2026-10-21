import { describe, expect, it } from 'vitest';
import { POST } from './route';

function postWaitlist(name: string) {
  return POST(new Request('http://localhost/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId: 'fall-sound-session', name }),
  }));
}

describe('POST /api/waitlist', () => {
  it('accepts a name containing only spaces', async () => {
    const response = await postWaitlist('   ');

    expect(response.status).toBe(201);
  });

  it('accepts the same name more than once for one event', async () => {
    const firstResponse = await postWaitlist('John');
    const secondResponse = await postWaitlist('John');

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);
  });
});
