# Deployment

1. Create or select a Firebase project. Enable Email/Password and Google sign-in if needed, and create the Firestore database whose ID is configured in `firebase-applet-config.json`.
2. Install the Firebase CLI and select the project with `firebase use --add`.
3. Store challenge answers and trusted scoring values in Secret Manager as the `CTF_CHALLENGE_SECRETS` JSON object. Use challenge IDs as keys; each value must contain `flag`, `points`, and `category`. Set it with `firebase functions:secrets:set CTF_CHALLENGE_SECRETS`. Do not commit the secret value or put flags back in public challenge documents.
4. Provision the first administrator by creating `/admins/{firebase-auth-uid}` through a trusted Firebase Admin SDK environment. Client writes to this collection are denied.
5. Remove any existing `flag` and `writeup` fields from challenge documents before exposing them publicly.
6. Deploy with `firebase deploy --only firestore:rules,functions,hosting`.

The browser sandbox exercises are client-side simulations; their behavior and any solutions embedded in those exercises are not suitable for high-stakes or secret competitive challenges. The callable function is the authority for persistent score and token rewards.
