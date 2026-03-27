# Momentum

A lightweight PWA for tracking daily goals, tasks, and check-ins. Built with React + Vite + Firebase.

## Stack

- **React + Vite** — frontend
- **Firebase Auth** — Google sign-in
- **Firestore** — real-time database
- **Firebase Hosting** — deployment
- **vite-plugin-pwa** — installable on mobile

## Project structure

```
momentum/
  src/
    components/
      TaskList.jsx       # Add, complete, delete tasks
      CheckIn.jsx        # Daily mood + notes
      StreakBar.jsx       # 7-day streak visualisation
    pages/
      Login.jsx          # Google sign-in screen
      GoalList.jsx       # List and create goals
      GoalDetail.jsx     # Tasks, check-in, log for a goal
    hooks/
      useAuth.js         # Auth state + login/logout
      useGoal.js         # Firestore listeners for goals, tasks, checkins
    firebase/
      config.js          # Firebase initialisation (uses env vars)
      db.js              # Firestore read/write helpers
    App.jsx
    main.jsx
    index.css
  .env                   # Local only, never committed
  .gitignore
  vite.config.js
  firebase.json
```

## Local setup

1. Clone the repo

```bash
git clone https://github.com/your-username/momentum.git
cd momentum
npm install
```

2. Create a `.env` file in the project root:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Fill in your values from the Firebase console (Project settings → Your apps → Web app).

3. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Firebase setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a project
3. **Authentication** → Sign-in method → enable Google
4. **Firestore Database** → Create database → start in test mode
5. **Project settings** → Your apps → Add web app → copy config into `.env`

## Firestore data model

```
users/{uid}/
  goals/{goalId}
    title: string
    desc: string
    createdAt: timestamp

    tasks/{taskId}
      text: string
      done: boolean
      createdAt: timestamp

    checkins/{checkinId}
      date: string          # YYYY-MM-DD
      mood: number          # 0–4
      moodEmoji: string
      moodLabel: string
      what: string
      blocker: string
      createdAt: timestamp
```

## Deploy

```bash
npm run build
firebase deploy
```

Make sure you have the Firebase CLI installed (`npm install -g firebase-tools`) and have run `firebase login` and `firebase init` first.

## Environment variables in production

When deploying, set your env vars in Firebase Hosting by adding them to your CI/CD pipeline or build step — they are not read from `.env` in production. For a simple deploy, run:

```bash
npm run build
```

Vite bakes the `VITE_*` variables into the build at build time, so as long as your `.env` is present locally when you run `npm run build`, they will be included in the output.

## Roadmap

- [ ] AI-generated weekly plan per goal
- [ ] Auto-adjust plan based on check-in mood and progress
- [ ] Weekly AI review
- [ ] Push notifications for daily reminders
- [ ] Dark mode
