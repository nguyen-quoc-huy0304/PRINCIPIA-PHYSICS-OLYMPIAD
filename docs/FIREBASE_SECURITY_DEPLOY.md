# PRINCIPIA Firebase Firestore Security

The Firestore policy is maintained in `firestore.rules`. It enforces the single-owner rule on the server, not only in browser JavaScript.

## Policy

- The verified Firebase account `huyquocnguyen03042011@gmail.com` is the only owner.
- Signed-in users can read the leaderboard.
- A signed-in user may create or update only their own leaderboard row, with bounded fields.
- Only the owner may delete leaderboard rows.
- Content, lessons, question-bank and settings documents are readable by signed-in users and writable only by the owner.
- Every other collection is denied by default.

## Deploy

This repository's Cloudflare Pages deployment does not deploy Firebase rules automatically. Deploy the rules separately from a trusted terminal with Firebase CLI access:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project principia-physics-olympiad
```

Verify the deployed rules in Firebase Console → Firestore Database → Rules. Do not treat the policy as active in production until the deployment succeeds.

## Important

Browser-side role checks are for interface gating only. Firestore Rules are the actual data boundary. Never place service-account credentials or Admin SDK secrets in this repository or browser code.
