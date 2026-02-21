# Ahed Abu Shahen — Portfolio

A production-ready portfolio site + admin panel built with React, TypeScript, Vite, Firebase, and EmailJS.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage (project images)
- **Email**: EmailJS (contact form auto-reply + admin notification)
- **Hosting**: Firebase Hosting

---

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Environment Variables

Copy `.env` and fill in your values:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_THANKYOU=
VITE_EMAILJS_TEMPLATE_ADMIN=
VITE_EMAILJS_PUBLIC_KEY=
```

---

## Firebase Setup (One-time)

### 1. Create Admin Account

1. Go to [Firebase Console](https://console.firebase.google.com) → your project
2. Authentication → Users → Add user (set email + password)
3. Copy the **UID** from the Users table

### 2. Register Admin UID in Firestore

1. Firestore → Create collection `admins`
2. Document ID = your Firebase Auth **UID** (e.g. `abc123xyz`)
3. Add any field, e.g. `role: "admin"` (existence is what matters)

### 3. Enable Firebase Storage

Firebase Console → Storage → Get Started → choose a region.

---

## Seed CV Data (Admin Panel)

After setting up auth and logging in:

1. Go to `/admin/content` → **About** tab:
   - Name, title, summary, location, email, GitHub/LinkedIn usernames, resume URL
2. **Skills** tab: add your tech stack chips
3. **Experience** tab: add BMC Software entry with bullets
4. **Education** tab: add Tel-Hai University entry

Then go to `/admin/certifications` and add:
- IBM — Introduction to DevOps (Jan 2026)
- Nvidia — AI Infrastructure and Operations Fundamentals (Feb 2026)

Then go to `/admin/projects` and add your projects with descriptions and images.

---

## Deploy to Firebase Hosting

### Install Firebase CLI (once)

```bash
npm install -g firebase-tools
firebase login
```

### Deploy

```bash
npm run build
firebase deploy
```

This deploys hosting + Firestore rules + Storage rules in one command.

### Deploy only hosting

```bash
firebase deploy --only hosting
```

### Deploy only rules

```bash
firebase deploy --only firestore:rules,storage
```

---

## Project Structure

```
src/
  components/
    navbar/         # Fixed nav with dark/light toggle
    hero/           # Hero section (reads from Firestore)
    about/          # About + skills (reads from Firestore)
    experience/     # Experience timeline (reads from Firestore)
    projects-section/  # Projects grid (reads from Firestore)
    certifications-section/  # Certifications (reads from Firestore)
    contact/        # Contact form → Firestore + EmailJS
    toast/          # Toast notification UI
    protected-route/  # Auth + admin guard
  admin/
    login/          # Firebase Auth login
    layout/         # Sidebar admin shell
    dashboard/      # Stats overview
    content/        # Tabbed editor: About/Skills/Experience/Education
    projects/       # Projects CRUD + image upload
    certifications/ # Certifications CRUD
    messages/       # Messages inbox
    message-detail/ # Message view + reply
    not-authorized/ # Shown when authed but not admin
  services/
    firestoreService.ts   # All Firestore operations
    storageService.ts     # Firebase Storage uploads
    emailService.ts       # EmailJS sending
  hooks/
    useToast.tsx    # Toast context + hook
  contexts/
    AuthContext.tsx # Auth state + isAdmin check
  types/
    index.ts        # All TypeScript interfaces
  config/
    email.ts        # EmailJS config constants
  pages/
    Portfolio.tsx   # Public one-page site
firestore.rules     # Firestore security rules
storage.rules       # Storage security rules
firebase.json       # Firebase hosting + rules config
.firebaserc         # Firebase project alias
```

---

## Admin Routes

| URL | Page |
|---|---|
| `/admin` | Login |
| `/admin/dashboard` | Stats overview |
| `/admin/content` | Edit site content (About/Skills/Experience/Education) |
| `/admin/projects` | Projects CRUD + image upload |
| `/admin/certifications` | Certifications CRUD |
| `/admin/messages` | Messages inbox |
| `/admin/messages/:id` | Message detail + reply |
