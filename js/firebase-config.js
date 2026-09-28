/* ==========================================================================
   FIREBASE CONFIGURATION  —  the ONLY file you must edit to switch the cloud on.

   1. Firebase console → Project settings → General → "Your apps" → Web app (</>)
   2. Copy the values it shows into the block below.
   3. Leave the "PASTE_…" placeholders as they are to keep running in local
      (browser-only) mode.

   These values are NOT secrets — Firebase web keys are meant to be public.
   What protects your data is firestore.rules (deployed with `firebase deploy`).
   ========================================================================== */
window.AC_FIREBASE_CONFIG = {
  apiKey            : "AIzaSyBlbcjI6e5amhng0nygZzkL4iCkUxnPfvI",
  projectId         : "ashirvad-connect",
  authDomain        : "ashirvad-connect.firebaseapp.com",
  storageBucket     : "ashirvad-connect.firebasestorage.app",
  messagingSenderId : "196625778498",
  appId             : "1:196625778498:web:c76231139dc3bd0633eadb"
};

/* Optional tweaks (normally leave as is).
   Dealers log in with their phone number and admins with a username; Firebase Auth needs an
   e-mail-shaped id, so the app builds one behind the scenes:
       dealer  9876543210  ->  9876543210@dealer.ashirvadconnect.app
       admin   admin       ->  admin@admin.ashirvadconnect.app
   No real e-mail is ever sent. If you change these domains, change them in firestore.rules
   and in setup/setup.js too.                                                              */
window.AC_CLOUD_OPTIONS = {
  dealerEmailDomain: "dealer.ashirvadconnect.app",
  adminEmailDomain:  "admin.ashirvadconnect.app",
  sdkVersion:        "10.12.2"
};
