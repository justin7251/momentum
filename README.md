# Momentum

Mobile-first PWA for daily goal tracking with AI-generated weekly plans.

## Stack
- React + Vite + Vercel (hosting + API)
- Firebase Auth + Firestore
- Groq API (AI, free tier)

## Setup

1. `npm install`
2. Create `.env.local`:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
GROQ_API_KEY=
```
3. `vercel dev`

## Deploy
`vercel --prod`

## Firebase
- Enable Google Auth
- Create Firestore database
- Set rules: users can only read/write their own data

## Pro features
Set `isPro: true` in Firestore for a user to unlock AI plan generation and weekly review.

## Roadmap
- [ ] Stripe subscriptions
- [ ] Onboarding flow
- [ ] Settings page