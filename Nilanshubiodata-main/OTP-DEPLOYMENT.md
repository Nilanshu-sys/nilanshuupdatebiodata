# Phone OTP (MSG91) deployment guide

This repository already contains a Next.js frontend and an Express OTP backend. The phone login screen uses the MSG91 Widget Web SDK custom UI methods and verifies the widget-issued access token on the backend before signing the user into Firebase with a custom token.

## Important before production

- Do not commit `.env` files or Firebase Admin service-account credentials.
- Configure MSG91 approved OTP/SMS template and required Indian DLT settings in your MSG91 account.
- Firebase Authentication must be enabled in the Firebase project. Create a Firebase Admin service account for the backend only.
- Use a strong random `OTP_HASH_SECRET`; do not reuse a Firebase key or password.
- Configure MongoDB Atlas network access and a least-privilege database user.
- The API applies IP rate limiting. The MSG91 Widget flow uses MSG91 for sending/verifying OTPs and the backend endpoint `POST /api/otp/verify-widget-token` validates the widget-issued access token with MSG91 before creating a Firebase custom token. Keep `MSG91_AUTH_KEY` only in backend secret environment variables.
- Test with your own phone and verify provider delivery/charges before public launch.

## 1. Frontend on Netlify

Build command: `npm run build`
Publish directory: `.next` (use Netlify's Next.js runtime/plugin support; do not deploy as a plain static export because this project uses Next.js features).

Set the variables from `.env.example` in Netlify Site configuration → Environment variables. `NEXT_PUBLIC_OTP_API_URL` must be the public HTTPS URL of the deployed Express backend, not localhost. `NEXT_PUBLIC_MSG91_WIDGET_ID` should match your widget ID and `NEXT_PUBLIC_MSG91_TOKEN_AUTH` should contain the token selected/generated in MSG91 under OTP Widget → Tokens. The widget token is intended for client-side integration; never put the main MSG91 Auth Key in a `NEXT_PUBLIC_*` variable. `NEXT_PUBLIC_FIREBASE_*` values must match the Firebase web app. Redeploy after changing environment variables.

## 2. Deploy `otp-backend` as a Node web service

Set the service root directory to `otp-backend` (or configure the host to run from that folder). Build/install command: `npm install`. Start command: `npm start`. Add all variables from `otp-backend/.env.example` in the hosting provider's secret environment settings. Set `FRONTEND_ORIGIN` to a comma-separated list of exact allowed origins, including `https://nilanshubiodata.netlify.app`. Do not add a trailing slash to origins.

The health endpoint is `/api/health`. The widget login endpoint is `POST /api/otp/verify-widget-token`. Legacy direct-SMS endpoints `POST /api/otp/send` and `POST /api/otp/verify` remain available.

## 3. Firebase Admin private key

Copy the service account private key into the backend host's secret environment variable `FIREBASE_PRIVATE_KEY`. Keep the full key including BEGIN/END lines; newline escape sequences are normalized by the server config. Never put this key in a `NEXT_PUBLIC_*` variable.

## 4. Verify the flow

1. Open `/phone-login` on the deployed site.
2. Enter name and an international-format phone number such as `+919876543210`.
3. Request OTP and confirm it arrives by SMS.
4. Enter the six-digit OTP. Successful verification signs in with Firebase and redirects to `/dashboard`.
5. Refresh and confirm the Firebase session remains active.
6. Log out, then confirm the landing page shows Login, Create Account, and Phone OTP options again.

## Current behavior

Phone OTP login creates a Firebase user on first successful verification and reuses the same phone-derived Firebase UID on later logins. The landing page redirects authenticated users to the dashboard. The dashboard navbar accepts Firebase phone-auth users even though they do not have a verified email.
