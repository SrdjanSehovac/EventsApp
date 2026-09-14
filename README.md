# EventsApp

Expo client for **EventServer** (`/v1`). Map, events, and admin tabs are unchanged. This app adds email sign-in and favourites.

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

## Favourites

Signed-in users can heart an event from the card/map sheet and open **Favourites** from the header or account screen.

| Method | Path |
| --- | --- |
| `GET` | `/me/favourites` → `{ items: EventListItem[] }` (or a bare array) |
| `PUT` | `/me/favourites/{event_id}` |
| `DELETE` | `/me/favourites/{event_id}` |

These map to EventServer’s `User.favourites` relationship. If the endpoints are absent, the UI stays in place and surfaces the 404.
