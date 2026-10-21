# Tartan Tickets

This is a front-end demo for the HW3 waitlist notification story. Payments,
authentication, and a database are not implemented. Demo data is held in
memory and may reset when the app restarts or is redeployed.

## Security spec audit

Assessment against the current demo and [security spec](./docs/Starter%20Spec%20A%20-%20Tartan%20Tickets%20-%20SECURITY_SPEC.md). “Partly” indicates limited protection or behavior exists, but the full requirement is not implemented.

| Requirement | Status | Why |
|---|---|---|
| SEC-1 | Not at all | There is no CMU SSO, user authentication, or password handling. |
| SEC-2 | Not at all | The demo has no sessions or inactivity timeout. |
| SEC-3 | Partly | Vercel serves the deployed site over HTTPS, but HSTS is not configured or verified here. |
| SEC-4 | Not at all | There are no accounts, roles, club memberships, or per-request authorization checks. |
| SEC-5 | Not at all | Club-owned resources and access-denial audit logging are not implemented. |
| SEC-6 | Not at all | There are no ticket lookup routes or student ownership checks. |
| SEC-7 | Partly | The demo does not collect card details, but it does not use Stripe-hosted Checkout. |
| SEC-8 | Not at all | The simulated purchase only reduces the in-memory seat count; there is no server-calculated charge or quantity. |
| SEC-9 | Not at all | There is no Stripe webhook endpoint, signature verification, or rejection logging. |
| SEC-10 | Not at all | Stripe event processing and duplicate-event protection are not implemented. |
| SEC-11 | Partly | No Stripe secret key is used in this demo, but secrets-manager storage and environment-specific key handling are not implemented. |
| SEC-12 | Not at all | Stripe account changes and the required two-person approval process do not exist. |
| SEC-13 | Not at all | The demo does not create QR tickets or random ticket tokens. |
| SEC-14 | Not at all | Ticket scanning, concurrent check-in protection, and “Already used” responses are not implemented. |
| SEC-15 | Not at all | There is no invalid-scan tracking, rate limit, or officer notification. |
| SEC-16 | Not at all | Checkout rate limiting and reservation-hoarding protection are not implemented. |
| SEC-17 | Partly | The demo accepts a name, but it does not collect the required purchase fields or persist purchase records. |
| SEC-18 | Not at all | No attendee records or 90-day data-removal process exist. |
| SEC-19 | Not at all | Attendee exports, officer authorization, and export logging are not implemented. |
| SEC-20 | Fully | Regression tests confirm HTML-like student names and event titles are rendered literally as text, not elements; the demo has no event-description input or display feature. |
| SEC-21 | Not at all | The demo has no audit logging for the listed sensitive actions. |
| SEC-22 | Not at all | There is no append-only audit log, admin-only access, or one-year retention. |
