# EventsApp

Expo client for **EventServer** (`/v1`). Consumer tabs are **Map / List / Profile**. Email sign-in, favourites, **Submit an event**, and **Become a business** live on Profile; Admin is behind Profile.

## Run

```sh
npm install
npx expo start
```

Point the client at EventServer with `EXPO_PUBLIC_API_URL` (no trailing slash), e.g. `http://192.168.1.10:8000`. Simulators default to `http://localhost:8000` (`10.0.2.2` on Android).

SW Ontario city chips (Toronto, Ottawa, London, Mississauga) sit above the existing city / category / search filters.

## Auth

Session token is stored with `expo-secure-store` on iOS/Android and `localStorage` on web. Authenticated requests send `Authorization: Bearer <token>`.

Expected EventServer routes (JSON, prefix `/v1`):

| Method | Path | Body / notes |
| --- | --- | --- |
| `POST` | `/auth/signup` | `{ email, password, display_name }` → `{ access_token, user? }` |
| `POST` | `/auth/login` | `{ email, password }` → `{ access_token, user? }` |
| `GET` | `/auth/me` | Bearer token → current user (`email`, `display_name`, `home_lat`, `home_lng`) |
| `POST` | `/auth/logout` | Optional; the app always clears the local session |

User model fields used by the client: `email`, `display_name`, `home_lat` / `home_lng`. Passwords never leave the device except as the signup/login payload (EventServer stores `hashed_password`).

If those routes are missing, the sign-in/sign-up screens still render and show a 404/network error instead of a fake local account.

## Submit an event

Signed-in users can crowdsource a listing from **Profile → Submit an event** (title, description, city, venue/address, start time, optional price, category). Submissions show under **My submissions** on Profile, including a local cache so v1 works before EventServer grows a moderation queue.

| Method | Path | Body / notes |
| --- | --- | --- |
| `POST` | `/me/events` | Bearer. JSON `{ title, description, city, venue_name, address, starts_at, price_cad, is_free, category_slug }` → a submitted event (`submission_id`, `status`, …) or `{ item }` / `{ event }` |
| `GET` | `/me/events` | Bearer. `{ items: SubmittedEvent[] }` (or a bare array) |

Suggested EventServer model: pending until staff accept into the public `events` table. If these routes 404, the client still keeps the submission on-device and labels it “Saved on device”. Verified businesses can also send `photo_urls`, `video_url`, and `bio` on the same POST (library picker on device, or pasted URLs — event media only, never an ID photo).

## Become a business (DIGITAL proof)

Low-friction **digital** verification: website + business email. **No government ID upload, face scan, or selfie check** — the app will not add those flows.

From **Profile → Post as a business / Become a business**: business name, website, business email, optional phone, city chips (Toronto / Ottawa / London / Mississauga), and what you are (venue / promoter / retail / other). Copy on the form: *Verify your business email — same domain as your website works best. No ID selfie required.*

Status screen tracks `pending_email` → `pending_review` → `verified` | `rejected`. Email links can open `eventsapp://business-verify?token=…` (or `/business-verify?token=` / `?code=`). When verified, Profile shows **Posting unlocked** and Submit event gains photos, optional short video URL, and bio.

| Method | Path | Body / notes |
| --- | --- | --- |
| `POST` | `/me/business/apply` | Bearer. JSON `{ business_name, website, business_email, phone, city, kind }`. `kind` is `venue` \| `promoter` \| `retail` \| `other`. → a business application (`application_id`, `status`, `email_verified`, …) or `{ item }` / `{ business }` / `{ application }` |
| `GET` | `/me/business` | Bearer. Current application, or **404** if this user has none |
| `POST` | `/me/business/verify-email` | Bearer. `{ token }` from the emailed link **or** `{ code }` typed from the message. Moves `pending_email` → `pending_review` (or `verified` if EventServer auto-approves domain match) |
| `POST` | `/me/business/resend-verification` | Bearer. Optional `{ business_email }`. Re-sends the mailbox check |

Suggested EventServer proof: confirm the mailbox, and prefer / auto-approve when the email domain matches the website host. Staff review is for mismatches — still digital, still no KYC camera. If these routes 404/501, the client caches the application on-device (same pattern as Submit event) and the status UI still works.

## Favourites

Signed-in users can heart an event from the card/map sheet and open **Favourites** from the header or account screen.

| Method | Path |
| --- | --- |
| `GET` | `/me/favourites` → `{ items: EventListItem[] }` (or a bare array) |
| `PUT` | `/me/favourites/{event_id}` |
| `DELETE` | `/me/favourites/{event_id}` |

These map to EventServer’s `User.favourites` relationship. If the endpoints are absent, the UI stays in place and surfaces the 404.
