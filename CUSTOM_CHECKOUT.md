# Custom Razorpay checkout — isolated implementation

Branch: `feature/razorpay-custom-checkout`. This worktree preserves a copy of the current MVP working changes. The original `design/landing-page` worktree and backend have not been changed by this implementation. Nothing is merged into `main`.

**Status: disabled by default. Account enablement is unconfirmed. Automated tests use a simulated SDK; no live payment or real Razorpay test transaction has been initiated.**

Design review: run this worktree's Vite server on port **3001**, then open `/checkout-preview.html`. This development-only entry renders the actual checkout component using sample data and a simulated SDK. It makes no Razorpay or LMS payment requests and creates no orders or enrollments. Use dummy values only. This HTML is not a production build entry; the module also refuses to render the preview outside development.

Current local configuration uses `VITE_PAYMENT_CHECKOUT=standard`: normal course purchases use the existing Razorpay checkout. Review the new design separately at `/checkout-preview.html` on port 3001; it never creates real payments. Keep these flows separate until the custom checkout is explicitly activated after the account checks below.

## Existing integration and reuse

`CourseEnrollment` continues to create an order through the authenticated `/api/payments/checkout` endpoint using the persisted account/course idempotency key. The API decides the price and currency. The custom UI receives the same order and public key used by Standard Checkout.

The custom SDK returns only payment ID and signature to the existing verification flow. The backend uses its stored order ID, verifies the HMAC, fetches authoritative payment and order state, and grants enrollment only after capture. Webhook deduplication, refunds/disputes, reconciliation, access checks, interrupted-callback recovery and saved pending orders retain their existing implementations. No backend changes or new payment endpoints were needed.

The default `razorpay-checkout.js` implementation is unchanged. A dispatcher dynamically loads the custom UI only when selected. Disabling the custom UI preserves the saved order and permits recovery through the existing checkout.

## Configuration

Public, non-secret frontend build settings:

```dotenv
VITE_PAYMENT_CHECKOUT=standard
VITE_CUSTOM_CHECKOUT_LIVE_ENABLED=false
VITE_CUSTOM_CHECKOUT_EMBEDDED_QR=false
```

- `standard` keeps the existing interface. `custom` selects the isolated form.
- Live Razorpay keys are rejected by the custom form unless `VITE_CUSTOM_CHECKOUT_LIVE_ENABLED=true`. Keep this false until account requirements and acceptance tests are complete and the release is approved.
- Test keys remain rejected in production bundles, consistent with the existing integration. Use a development build against an isolated test backend for Razorpay test mode; do not disable that backend's production protections.
- `VITE_CUSTOM_CHECKOUT_EMBEDDED_QR=true` uses Razorpay's non-redirect desktop QR API. Enable only after Razorpay confirms that feature is enabled. Otherwise the custom form opens the officially supported Razorpay-hosted QR flow.
- Configuration changes require restarting Vite or rebuilding. No payment keys or secrets belong in these variables. The existing backend continues to supply the public key with the order.

## Verified provider requirements (16 November 2026)

Official sources:

- [Custom Checkout overview and prerequisites](https://razorpay.com/docs/payments/payment-gateway/web-integration/custom/)
- [Build integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/custom/build-integration/)
- [Supported payment methods and desktop QR](https://razorpay.com/docs/payments/payment-gateway/web-integration/custom/payment-methods/)
- [UPI migration requirements](https://razorpay.com/docs/announcements/upi-collect-migration/custom-integration/)
- [Mobile UPI Intent](https://razorpay.com/docs/payments/payment-gateway/web-integration/custom/payment-methods/upi-intent-mweb/)

Use the hosted `https://checkout.razorpay.com/v1/razorpay.js` SDK. Payments must originate from a website registered with Razorpay. Confirm account eligibility, test/live availability, card methods and the intended test/production domains with Razorpay before activation.

UPI Collect was deprecated for general use effective 28 February 2026: there is no VPA field or Collect request. Razorpay lists limited exemptions, including iOS transactions; do not infer account eligibility or add a general UPI ID input without provider confirmation and a separately tested flow. Mobile uses the SDK's supported Intent app list and invokes payment synchronously from the submit event. App availability is not proof an app is installed. Desktop uses QR. Embedded desktop QR is an on-demand feature requiring account-manager enablement and is documented for desktop only. QR creation occurs only after a user action.

The form offers UPI, debit/credit cards, net banking and documented wallets only when reported enabled by Razorpay. Mobile app tiles show the SDK-supported apps (including Google Pay, PhonePe, Paytm and Android's other-app option when returned). Desktop app names describe ways to scan the QR, not desktop app-launch buttons. EMI, subscriptions, international local-payment schemes and saved cards are not implemented by this form.

The chosen flow uses event callbacks and `redirect: false`. It does not support the Customer Fee Bearer model: Razorpay documents different redirect/callback requirements for those card payments and excludes CFB from mobile UPI Intent. Keep Standard Checkout if the account uses CFB, or commission that separately after provider confirmation.

Custom Checkout does not replace the bank's authentication or OTP interface. Those screens remain controlled by Razorpay/the bank. An entirely merchant-branded authentication flow cannot be promised.

## Sensitive data and failure behavior

Card fields are uncontrolled, temporary form inputs. They are passed directly to the SDK and cleared on submission or method change; unmount removes the form. They never enter Redux, local/session storage, URLs, LMS requests, application logs or analytics. No saved-card/tokenization feature was added. Review the applicable PCI-DSS obligations with Razorpay before collecting real card details; this code does not itself establish compliance. Keep session replay, analytics form capture and third-party marketing scripts out of the checkout surface.

The SDK loads only when custom checkout is opened. No private API keys are delivered to the browser. Availability comes from the SDK's account methods. Raw provider errors are not shown or logged. Order IDs and callback shapes are checked locally, but browser success never grants access. Uncertain failures, cancellation, expiry or missing callbacks return to existing server reconciliation before the learner is offered another attempt. Duplicate submits are blocked synchronously.

The QR image is generated locally using the MIT-licensed `qrcode-generator` dependency, without sending its payment URI to an external image service. Only bounded, unexpired `upi://pay` events are rendered. QR values are not persisted. Bank authentication is allowed to take focus outside the custom dialog while payment is in progress.

## Verification

Implementation check results: **34 focused tests passed**, changed-file ESLint passed, and `git diff --check` passed. The custom-enabled production build passed; the standard production bundle checks also passed. The lockfile audit reported **0 vulnerabilities**. Existing large-chunk build warnings remain. These checks do not constitute real-browser, provider-backed or compliance approval.

16 November follow-up: **29 focused tests passed** covering the SDK, UI, local preview routing, and both standard/custom enrollment recovery. Added coverage for visible supported app choices, unsupported-app filtering, no-app submission prevention, and account-enabled wallet filtering/payloads. Changed-file ESLint and a custom-enabled production build passed. The local preview entry is absent from the production output. These are simulated-provider tests, not live transaction evidence.

The existing backend payment suite passed **112 tests** with `TEST_REDIS_URL=redis://127.0.0.1:16379` using isolated local Redis and in-memory MongoDB fixtures. An initial attempt failed because local test Redis was absent; the full suite passed after starting it. No backend source changes were needed, and tests did not use live provider credentials, Redis Cloud or production data.

Automated coverage includes SDK loading/failure, live/test guards, method availability, order/amount binding, card validation, QR expiry/URL checks, synchronous Intent submission, duplicate-click prevention, cancellation, sanitized errors, and disposal. UI tests cover cards, net banking, embedded QR, hosted QR and mobile Intent. Existing enrollment tests run against both interfaces, including callback failure, webhook-first enrollment, return without callback, manual reconciliation and retired test orders. Existing payment API and checkout-session tests remain applicable.

```sh
node --test tests/custom-checkout-*.test.mjs tests/razorpay-*.test.mjs tests/checkout-session.test.mjs tests/payment-api.test.mjs tests/payment-availability.test.mjs
```

Before enabling, complete provider-backed test-mode checks on the registered HTTPS test domain: successful/declined card authentication, OTP cancellation, net-banking success/failure, Android/iOS Intent return, supported-app detection, desktop QR generation/expiry, interrupted networks, tab closure/reload, webhook-before-callback, concurrent tabs and reconciliation. Verify keyboard focus, mobile layouts, zoom, bank-popup interaction and popup-blocked recovery in real browsers. Test-mode support may differ by method; confirm device and live validation procedures with Razorpay. Test accounts must not send real learner purchase emails.

After those checks and explicit approval, activate only the required flags on an isolated release. Roll back by setting `VITE_PAYMENT_CHECKOUT=standard` and rebuilding; retain the existing orders, verification, webhooks and recovery endpoints.

## Account checks and first live payment

A read-only account methods lookup on 16 November returned cards, UPI, 45 banks, and Airtel Money, MobiKwik, Ola Money and PayZapp wallets. This response confirms method availability at that moment, not Custom Checkout or embedded QR approval. Local backend credentials are present and the key is live; no secret values were printed or copied. No order or payment was created by this check.

Ask Razorpay support:

> Please confirm that Web Custom Checkout (razorpay.js) is enabled for our merchant account and registered website. Please enable/confirm desktop UPI QR non-redirect flow (flow: 'qr', payment.upi.qr), and mobile UPI Intent for Google Pay, PhonePe, Paytm and the SDK-supported apps. Confirm our account is not using Customer Fee Bearer (CFB), and the PCI-DSS requirements for collecting card details in our own checkout form.

Before activation, supply/confirm the registered HTTPS frontend URL, public HTTPS backend URL, and the course and exact amount for the live test. Localhost port 3001 remains the development preview; a remote mobile device and Razorpay webhooks cannot reach its loopback API. A public HTTPS test deployment can run this branch without merging main.

Backend-only settings (already present locally; configure securely on the test deployment):

```dotenv
RAZORPAY_KEY_ID=<live key ID>
RAZORPAY_KEY_SECRET=<matching live API secret>
RAZORPAY_WEBHOOK_SECRET=<matching live webhook signing secret>
```

Configure the live dashboard webhook to `https://<public-api-host>/api/payments/webhooks/razorpay`, using the same signing secret and these supported events: `payment.captured`, `order.paid`, `refund.processed`, `payment.dispute.created`. Confirm automatic capture: this integration grants access only after capture and does not manually capture authorized payments. Keep the existing production URL, CORS, cookies and trusted-proxy settings consistent with the test domain. Do not paste secrets into chat or frontend environment variables.

After account confirmation, switch the real application (not `/checkout-preview.html`) to:

```dotenv
VITE_PAYMENT_CHECKOUT=custom
VITE_CUSTOM_CHECKOUT_LIVE_ENABLED=true
# true only after embedded QR enablement is confirmed:
VITE_CUSTOM_CHECKOUT_EMBEDDED_QR=true
```

Restart Vite/rebuild for environment changes. The current local `.env.development.local` uses `standard` with custom live checkout disabled until the account checks are resolved. The standalone preview always uses a simulated SDK, regardless of live settings.

For the first live payment, the owner selects the exact test course/price and completes the payment in their own UPI/bank app. Check the Razorpay payment is captured, the stored intent is paid, precisely one purchase and enrollment exist, and the learner can open the course. Refresh/return without resubmitting, confirm recovery and webhook delivery, then check purchase history. Run separate app/QR/card/wallet checks; one successful payment does not establish coverage of every method. Any refund is a separate deliberate dashboard action, followed by a refund/access reconciliation check.
