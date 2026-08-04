# Implementation notes

## 2026-08-04 — Bob private-beta consent and verification UX

- Robert approved completing and live-testing the full onboarding pipeline before any client invitation email or SMS is sent.
- This branch changes only the existing `/sms-consent/` mechanics and supporting copy; the established BWM visual direction remains locked.
- The page will require an opaque invitation link, collect optional carrier consent, verify mobile possession with a short code, and show a clear activated/private-beta state.
- Declining SMS must remain valid and must not create an SMS authorization or marketing nurture.
- Error messages must not reveal whether a supplied email, phone, invitation, or client record exists.
- Welcome copy is concise and nontechnical, explicitly calls the program a private beta, supports text and voice notes, asks for feedback, and reminds users about STOP.
