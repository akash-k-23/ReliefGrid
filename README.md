# ReliefGrid

ReliefGrid is a JavaScript humanitarian coordination platform for relief requests, offline support commitments, volunteer applications, verified NGO coordination, administration, notifications, and disaster preparedness education.

## Stack

- React, Vite, Tailwind CSS, React Router, Motion
- Express, Mongoose, MongoDB
- JWT HTTP-only cookies and bcryptjs
- Nodemailer SMTP password reset delivery

## Requirements

- Node.js 20 or newer
- MongoDB 7 or newer, local or remote
- An SMTP account for password reset emails

## Setup on Windows

Install each app separately. Use two terminals from the project root.

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
Set-Location frontend
npm install
npm run dev
```

In a second terminal:

```powershell
Set-Location backend
npm install
npm run dev
```

## Setup on Ubuntu

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm --prefix frontend install
npm --prefix backend install
npm --prefix frontend run dev
```

In a second terminal:

```bash
npm --prefix backend run dev
```

The frontend is in `frontend/` and the backend is in `backend/`. Configure MongoDB separately using the package manager or official MongoDB instructions for your Ubuntu release.

## Environment

Copy each example file to the matching app and replace every example secret or SMTP value.

`backend/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/reliefgrid
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=ReliefGrid <no-reply@example.com>
CLIENT_URL=http://localhost:5173
PUBLIC_API_URL=http://localhost:5000
SMS_PROVIDER=mock
SMS_COUNTRY_CODE=IN
SMS_SENDER_ID=
SMS_DLT_TEMPLATE_ID=
SMS_DLT_ENTITY_ID=
EMERGENCY_SMS_TEMPLATE=ReliefGrid alert: {{title}} near {{location}}. {{url}} If you can help, open the request. Emergencies: 112.
EMERGENCY_ALERT_MAX_RADIUS_KM=100
SMS_MAX_ATTEMPTS=5
SMS_MIN_INTERVAL_MS=1000
SMS_WORKER_BATCH_SIZE=5
ACHIEVEMENT_DONATION_THRESHOLDS=1,5,10,25,50
ACHIEVEMENT_VOLUNTEER_THRESHOLDS=1,5,10,25,50
ACHIEVEMENT_COMBINED_THRESHOLDS=1,5,15,30
```

`frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Never commit `.env`. SMTP configuration is required for forgot-password requests for existing users. Reset tokens are hashed in MongoDB, expire after 15 minutes, and are invalidated after a successful reset.

SMS delivery is disabled by default: `SMS_PROVIDER=mock` records `MOCKED`, never `SENT` or `DELIVERED`. For Twilio, set `SMS_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and a registered `SMS_SENDER_ID`. For an India-compatible gateway, set `SMS_PROVIDER=gateway`, `SMS_GATEWAY_URL`, `SMS_GATEWAY_TOKEN`, and `SMS_GATEWAY_WEBHOOK_TOKEN`. Production India delivery also requires `SMS_DLT_TEMPLATE_ID` and `SMS_DLT_ENTITY_ID`; register the sender and exact message template with the provider/telecom operator and set `EMERGENCY_SMS_TEMPLATE` to match that approved template. Configure `PUBLIC_API_URL` for delivery callbacks. Phone verification requires a live provider and a user phone number in E.164 format. Users must explicitly verify and opt in before alert sends.

Configure achievement thresholds as ascending comma-separated integers with the same number of entries as each badge family (five donations, five volunteer badges, four combined badges). Badges are awarded from backend verified donations and completed activities only.

## Verification

```bash
npm --prefix frontend run build
npm --prefix frontend run lint
npm test
```

After deploying the schema changes, backfill existing request coordinates and create the spatial indexes once:

```powershell
npm --prefix backend run migrate:emergency-geo
```

The migration is batched and repeatable. Mongoose schemas also declare the indexes for new deployments. Back up MongoDB before production migrations.

## Emergency APIs

- `GET /api/users/me/impact`, `/contributions`, and `/achievements` are authenticated and scoped to the session user.
- `GET /api/emergency/contacts` is public; emergency preference, phone verification, nearby help, alert history, and responses require authentication.
- `/api/admin/emergency-alerts`, `/api/admin/emergency-contacts`, and achievement recalculation require the `ADMIN` role.
- Emergency SMS records distinguish `MOCKED`, provider-accepted `SENT`, and callback-confirmed `DELIVERED`. A successful provider API response alone is not a delivery confirmation.

The API is available at `http://localhost:5000/api` and the frontend at `http://localhost:5173` during development.

## MongoDB Backup and Restore

Create a backup with MongoDB Database Tools:

```bash
mongodump --uri="$MONGODB_URI" --out="./backups/reliefgrid-$(date +%Y%m%d-%H%M%S)"
```

Restore a backup with:

```bash
mongorestore --uri="$MONGODB_URI" ./backups/reliefgrid-YYYYMMDD-HHMMSS
```

On Windows PowerShell, replace the date expression with a fixed backup directory name or use `Get-Date -Format yyyyMMdd-HHmmss`.

## SMTP Setup

Use an SMTP provider that supports authenticated submission on port `587` with STARTTLS, or port `465` with implicit TLS. Set `SMTP_FROM` to a sender permitted by the provider. Test delivery with a local SMTP sink or a controlled test mailbox; never commit credentials or send automated test mail to real users.

## Production Security Notes

- Set `NODE_ENV=production` and use HTTPS.
- Use a long random `JWT_SECRET` and keep `.env` outside source control.
- Configure `CLIENT_URL` and CORS to the exact deployed frontend origin.
- Use secure, HTTP-only cookies and review `SameSite` behavior when frontend and API origins differ.
- Restrict MongoDB network access and create least-privilege database credentials.
- Rotate SMTP, database, and JWT credentials if they are exposed.
- Run `npm --prefix frontend run build` and `npm --prefix frontend run lint` in CI before deployment.
