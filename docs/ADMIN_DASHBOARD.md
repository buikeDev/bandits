# BAND-IT staff dashboard

The admin dashboard lives at `/admin` in the existing Next.js app. Express serves `/api/admin`; the existing frontend proxy forwards these requests. PostgreSQL stores staff sessions and operational records. No additional hosting service is required.

## Deployment order

1. Back up the database using the existing provider workflow. Review `packages/database/prisma/migrations/20260914000000_admin_operations/migration.sql`: it adds operational tables and does not rewrite enquiry snapshots.
2. Generate the Prisma client during the existing build. Run `pnpm --filter @bandit/database exec prisma migrate deploy` against the intended database before deploying API code that uses the new tables. Do not use `db push` or `migrate reset`.
3. Deploy backend and frontend from the same tested revision. Leave `ADMIN_DASHBOARD_URL` unset until both are ready.
4. Create the first admin in a trusted shell with `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` securely supplied as environment variables. Passwords must have 12–128 characters. Run `pnpm --filter @bandit/backend admin:bootstrap`, or `node apps/backend/dist/admin/bootstrap.js` on a built service. This refuses to run if an active admin exists. Remove bootstrap credentials from the environment afterwards. Never commit or send passwords in chat.
5. Sign in at `/admin/login`. Create additional staff through Staff access. Customer sessions cannot authenticate admin requests.
6. Test guest and customer orders, custom previews, quote acceptance, payment references, stock reservations, cancellation and delivery on the deployed environment.
7. Set backend `ADMIN_DASHBOARD_URL=https://band-it-frontend.onrender.com` and redeploy. New/retried WhatsApp responses include a protected staff order link; original saved messages are preserved. The value must be an HTTP(S) origin with no path, query or credentials.

No production migration or admin credentials are automatically applied by this implementation.

## Verification

- Backend TypeScript build and ESLint passed.
- Production Next.js build, type checking and lint passed, including all admin and customer-detail routes.
- Backend test suite: 30 passed, 4 existing database integration tests skipped. Admin tests cover role boundaries, expired/inactive sessions, ownership filtering, immutable accepted quotes, stale versions, reservations, cancellation, collection, overpayment/refund limits and duplicate references. They use controlled repository fixtures, not live Supabase writes.
- Prisma client generation succeeded in an isolated output directory. The usual local output had a Windows native-engine file lock; restart local API processes before regenerating that output.
- Database migration execution, native-database concurrency checks and browser/mobile visual testing remain deployment verification steps. The browser automation runtime was unavailable during implementation.

## Staff access

- ADMIN: order operations, catalogue, stock and staff access.
- STAFF: overview and order operations, including verified manual payments/refunds.
- Sessions use a separate HttpOnly, Secure-in-production, SameSite=Strict cookie scoped to `/api/admin`, with an eight-hour expiry. Access changes revoke all sessions for the changed staff member. Each request checks the active account and role.
- No public registration. Admin writes require a custom request header; the existing CORS allowlist must contain only the trusted frontend origin.
- Staff can change their own password at `/admin/security`; this revokes other sessions. Password recovery remains a follow-up.
- Login is limited in-process by connection IP (20 attempts per 15 minutes). This is a single-instance baseline; shared rate limiting and trusted-proxy configuration are needed before scaling. Never trust arbitrary forwarded IP headers.
- Protect access to the last administrator. The UI/API forbid changing one's own role or activation.

## Order workflow

Original `OrderEnquiry.snapshot` remains immutable. A separate workflow holds contact/delivery details, quote revisions, payments, reservations and staff activity. Every mutation checks a version and runs transactionally. Conflicts tell staff to refresh; they are not silently overwritten.

New enquiry → Confirmed → In production → Ready → Dispatched → Completed.

Confirmed orders can go straight to Ready. Collection orders complete from Ready; delivery orders must dispatch first. Cancellation is available before dispatch. Dispatched/completed returns require a later returns workflow; do not fake them by cancelling consumed stock.

- Every order needs a final quote, including explicit delivery/printing fees, and recorded customer acceptance before confirmation.
- All original lines must be priced. Revisions remain stored. Accepted quotes are locked; post-acceptance amendments are a later workflow.
- Confirmation requires contact name and phone, plus an address for delivery.
- Payment entries are manually verified receipts, not a payment gateway. References are unique per order. Amounts cannot exceed the accepted total; refunds cannot exceed received funds. Completion requires full payment (or a zero-total quote).
- Payment and order statuses remain separate. A WhatsApp handoff proves neither sending nor payment.
- Listed variants reserve stock on confirmation, including custom printing on listed stock. Requested colours and custom-only designs are not automatically mapped to warehouse variants; staff must confirm material availability manually.
- Cancellation releases reserved units. Dispatch/collection consumes them exactly once. Stock adjustments cannot take on-hand quantities below reservations and require a reason.
- Internal staff notes and activity are excluded from customer order-detail responses.

## Customer tracking

Signed-in customers can open `/account/orders/[reference]` from account history. The API enforces ownership and returns only the saved artwork, public order/payment status, accepted price breakdown and delivery tracking. Guest orders remain staff-accessible; no public guest lookup is introduced.

## Catalogue

Admins can edit existing products, descriptions, base prices, bulk tiers, activation/featured state, and variant colour/material/size/price/activation. Stock adjustments are audited. Existing catalogue provisioning still creates products, variants and inventory records; creating new categories/products and media upload management are follow-up features.

## Follow-up scope

- Third-party fulfilment clients, their stock ownership, intake and shipments.
- Post-acceptance quote amendments, returns and stock restocking.
- New product/category creation and private artwork object storage.
- Staff password recovery/MFA and shared rate limiting for scaled deployment.
- Advanced reports, low-stock thresholds, assignments and notifications.

These are not implied to be complete by the initial operational dashboard.
