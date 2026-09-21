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
```

`frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Never commit `.env`. SMTP configuration is required for forgot-password requests for existing users. Reset tokens are hashed in MongoDB, expire after 15 minutes, and are invalidated after a successful reset.

## Verification

```bash
npm --prefix frontend run build
npm --prefix frontend run lint
```

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
