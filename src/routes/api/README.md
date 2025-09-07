# API Overview

This folder exposes read-only projection endpoints and basic CRUD helpers for series and history. Examples below use the VS Code REST Client syntax.

Tip: put the following at the top of your `.http` file or reuse from code blocks here.

```http
@host = http://localhost:5173
```

## Endpoints

- GET `/api/occurrences` — Combined persisted history + computed projections over a date range.
- GET `/api/upcoming` — Future-only convenience wrapper around `/api/occurrences`.
- GET `/api/series` — List expense series.
- POST `/api/series` — Create a series (RRULE auto-derived from cadence + nextDate).
- PUT `/api/update` — Generic single-field update (any table in schema).
- PUT `/api/history/{id}` — Update a single history row field (e.g., mark verified).

---

## Occurrences (combined)

- Combines persisted `expense_history` rows and projected occurrences from active `expense_series`.
- Dedupes by `(seriesId, expenseDate)` preferring history over projection.
- Projections use RRULE if present, otherwise fall back to interval stepping.

Query params:
- `start` YYYY-MM-DD (default: today)
- `end` YYYY-MM-DD (default: today + 30 days)
- `seriesId` comma-separated ids (optional)
- `include` csv: `history,projection` (default both)

Example: Month view (all series)
```http
GET {{host}}/api/occurrences?start=2025-09-01&end=2025-09-30
```

Example: Fortnightly series in September (projections only)
```http
GET {{host}}/api/occurrences?start=2025-09-01&end=2025-09-30&seriesId=12&include=projection
```

Example: History-only window for a set of series
```http
GET {{host}}/api/occurrences?start=2025-09-01&end=2025-09-30&seriesId=12,23&include=history
```

---

## Upcoming (future-only)

- Wrapper around `/api/occurrences` with `start=today`, `end=until`.

Query params:
- `until` YYYY-MM-DD (default: today + 30 days)
- `seriesId` comma-separated ids (optional)
- `include` csv: `history,projection` (default both)

Example: Next 30 days (all series)
```http
GET {{host}}/api/upcoming
```

Example: Next 45 days for specific series
```http
GET {{host}}/api/upcoming?seriesId=12,23&until=2025-10-21
```

---

## Series

List all series
```http
GET {{host}}/api/series
```

Create a series (RRULE auto-generated from `frequency*` + `nextDate`)
```http
POST {{host}}/api/series
Content-Type: application/json

{
  "name": "Skinny Broadband",
  "status": "active",
  "frequencyInterval": 1,
  "frequencyUnit": "month",
  "amountCents": 10500,
  "provider": "Skinny",
  "paymentMethod": "CC 1481",
  "nextDate": "2025-09-12"
}
```

Update a single field on series (generic)
```http
PUT {{host}}/api/update
Content-Type: application/json

{
  "table": "expenseSeries",
  "id": 12,
  "column": "frequencyInterval",
  "value": 2
}
```

Note: When updating `frequencyInterval`, `frequencyUnit`, or `nextDate`, the server recomputes and stores the `rrule` so it stays in sync.

---

## History

Update a field on a history row (e.g., mark verified)
```http
PUT {{host}}/api/history/345
Content-Type: application/json

{
  "field": "status",
  "value": "verified"
}
```

Generic update (alternate path)
```http
PUT {{host}}/api/update
Content-Type: application/json

{
  "table": "expenseHistory",
  "id": 345,
  "column": "note",
  "value": "Paid manually on 2025-09-02"
}
```

---

## Notes

- Projections come only from active series; history returns whatever is persisted within the date range.
- All dates are treated as UTC “all-day” (YYYY-MM-DD).
- Last-day-of-month anchors clamp appropriately across months (e.g., 31st → 30th/29th/28th when needed).
- For large ranges, consider limiting windows; recurrence enumeration is efficient but unbounded ranges can be expensive.

