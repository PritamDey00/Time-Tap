```markdown
# Minimalist Student Site (Next.js)

A simple, responsive student website prototype with:
- Register / Login (name + password)
- Centered analog clock (minimalist)
- 30-minute countdown timer. When the timer reaches 0, students press "Confirm" to earn:
  - 1 point normally
  - 2 points when maintaining a streak (consecutive confirmations within a small window)
- Dynamic leaderboard showing all students & scores
- Clean, neutral aesthetic; responsive for mobile & desktop

This is a prototype that stores user data in `data/users.json`. For real deployments, replace the file store with a persistent DB.

Quick start (local)
1. Copy the repo files to a folder.
2. Create a `.env.local` file based on `.env.example`.
3. Install and run:
   - npm install
   - npm run dev
4. Open http://localhost:3000

Notes
- Persistence: data/users.json is used. On serverless platforms that don't write to the filesystem, use a DB or external store.
- Security: This is a prototype. For production:
  - Use a proper DB
  - Use HTTPS
  - Use strong JWT secret in environment variables
  - Consider salt rounds & rate limiting

How the confirmation / streak logic works
- Each user has lastConfirm timestamp.
- When a user confirms:
  - If at least 30 minutes elapsed since lastConfirm, they are eligible.
  - If their previous confirmation was within 35 minutes of the one before it (i.e., consistent confirmations), they get 2 points and streak increments.
  - Otherwise they get 1 point and streak resets to 1.
  - lastConfirm is updated to now.
- The client enforces the 30-minute countdown; the server enforces eligibility too.

API endpoints
- POST /api/register {name, password}
- POST /api/login {name, password}
- GET /api/me
- GET /api/users
- POST /api/confirm

Environment
- Copy `.env.example` to `.env.local` and set JWT_SECRET.

Files included
- pages/ (Next.js pages + API)
- components/AnalogClock.jsx, Timer.jsx, Leaderboard.jsx
- lib/users.js - small file-backed user store
- styles/globals.css

Enjoy! If you want I can:
- Swap file persistence for SQLite (Prisma) or Firebase
- Add email/password reset
- Improve visual design or animations
```