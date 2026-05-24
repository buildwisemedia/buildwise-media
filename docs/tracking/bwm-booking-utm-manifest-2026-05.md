# BWM Booking UTM Manifest

Canonical campaign values for the current Meta booking funnel.

## Defaults

- `utm_source=meta`
- `utm_medium=paid_social`
- `utm_campaign=mo_money_mo_peace`
- `utm_content=<creative-or-tagline-id>`

## QA Smoke Link

```text
https://buildwisemedia.com/book/?utm_source=meta&utm_medium=paid_social&utm_campaign=mo_money_mo_peace&utm_content=qa-smoke
```

## Creative Links

Use the creative or tagline ID as `utm_content`. Keep it lowercase, hyphenated, and stable across Meta, GTM, GA4, and reporting.

```text
https://buildwisemedia.com/book/?utm_source=meta&utm_medium=paid_social&utm_campaign=mo_money_mo_peace&utm_content=mo-peace
https://buildwisemedia.com/book/?utm_source=meta&utm_medium=paid_social&utm_campaign=mo_money_mo_peace&utm_content=mo-time
https://buildwisemedia.com/book/?utm_source=meta&utm_medium=paid_social&utm_campaign=mo_money_mo_peace&utm_content=mo-life
https://buildwisemedia.com/book/?utm_source=meta&utm_medium=paid_social&utm_campaign=mo_money_mo_peace&utm_content=mo-freedom
https://buildwisemedia.com/book/?utm_source=meta&utm_medium=paid_social&utm_campaign=mo_money_mo_peace&utm_content=mo-calm
```

## Event Contract

- Diagnostic/browser Lead uses the form handler `capi_event_id`.
- Calendar/browser Schedule uses `booking_event_id`.
- Cal metadata must include `booking_event_id`, `contact_id`, `capi_event_id`, UTMs, `fbc`, and `fbp`.
- Reporting groups by `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content`.
