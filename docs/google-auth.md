# Google sign-in

Google sign-in is isolated on `feature/google-auth` and disabled by default. It appears on login and registration when `VITE_GOOGLE_CLIENT_ID` is configured. This public ID must match `GOOGLE_CLIENT_ID` in the API environment. Never configure a client secret in the frontend.

Follow the full setup and release checks in the API repository's `docs/google-auth.md`, including Google Cloud authorized origins and the database index migration. Restart Vite for local environment changes; hosted frontend changes require a new build. Local preview remains port **3001**.

The frontend branch starts from the saved `design/auth-forms` UI preview (`cbed61d`). Google-auth changes are a separate commit; `main` and the custom checkout branch remain untouched. Do not merge the inherited UI preview unintentionally when preparing a release.

The Google button is rendered by Google's official SDK. The layout keeps email/password available, handles retry and explicit account linking, and uses existing account redirects. Automated UI tests simulate the SDK; a real Google client is required to verify the popup and consent screen before release.
