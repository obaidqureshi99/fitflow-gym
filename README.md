# FitFlow: gym management SaaS

Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (Postgres + Auth) · Zapier webhooks · Claude API

## Folder structure
```
supabase/
  config.toml            local Supabase settings
  migrations/001_schema.sql   tables, RLS policies, roles, new-user trigger
  seed.sql               plans + 24 demo members with attendance
src/
  middleware.ts          protects every page, redirects to /login
  app/
    login/               sign in
    (app)/               signed-in area (sidebar + topbar layout)
      dashboard/ members/ members/[id]/ members/new/ plans/
      payments/ payments/new/ attendance/ ai/ staff/ activity/
    api/ai/              Claude: retention email, monthly report, promos
    api/cron/reminders/  7-day renewal reminders -> Zapier
  actions/               server actions (all writes live here)
  components/            layout/ ui/ charts/
  lib/                   supabase clients, auth, zapier, claude, insights, format
```

## Run it
1. `npm install`
2. Start Supabase locally (needs Docker): `npx supabase start`, then `npx supabase db reset` (applies the migration and seed).
   Or use a hosted Supabase project: paste `001_schema.sql` and `seed.sql` in the SQL editor.
3. `cp .env.example .env.local` and fill in the URL and keys (`npx supabase status` prints them).
4. Create the first user in Supabase Studio (Authentication > Add user). **The first user becomes admin.** Add more staff from the Staff page.
5. `npm run dev`, open http://localhost:3000.

## Zapier (Emails & WhatsApp Automations)
Create one Zap with a **Catch Hook** trigger and put its URL in `ZAPIER_WEBHOOK_URL` in `.env.local`. Every call posts JSON with an `event` field:
- `payment_remaining`: Triggered when a new member is added with remaining payments (pending or partial) or when a pending payment is logged. Includes:
  - `event`: `'payment_remaining'`
  - `member_name`, `name`: member's full name
  - `email`: member's email address
  - `phone`: member's phone number (in international format for WhatsApp)
  - `member_code`: gym code (e.g. `GF-AB12CD`)
  - `plan_name`: name of the membership plan
  - `amount_paid`: initial amount paid upfront
  - `amount_remaining`: balance still owed
  - `due_date`: payment due date
  - `whatsapp_message`: pre-written WhatsApp message ready to send
  - `email_subject` & `email_body`: pre-written email notification
- `welcome`: Triggered on new member registration (when fully paid or no balance).
- `renewal_reminder`: Triggered by daily cron for members expiring in 7 days.
- `payment_failed`: Triggered when a failed payment is logged.

### WhatsApp & Email Zap Setup:
1. Trigger: **Webhooks by Zapier** -> **Catch Hook**.
2. Action 1 (Filter/Paths): Only continue if `event` equals `payment_remaining`.
3. Action 2 (Email): **Gmail** or **Email by Zapier** -> Send email to `{{email}}` using `{{email_subject}}` and `{{email_body}}`.
4. Action 3 (WhatsApp):
   - **Twilio**: Send WhatsApp Message to `whatsapp:{{phone}}` with `{{whatsapp_message}}`.
   - Or **WhatsApp Notifications by Meta** / **Chat-API** / **Z-API**.
5. Test trigger anytime by opening `http://localhost:3000/api/zapier/test` in your browser!
For renewal reminders, schedule a daily call: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-app/api/cron/reminders`.

## Claude
Set `ANTHROPIC_API_KEY`. Without it, the AI pages return simple template text. At-risk detection is plain SQL-style logic (visits in last 14 days vs the 14 before), and Claude writes the emails, report and promo ideas.

## Roles
- **Admin**: everything, plus plans, staff, activity log.
- **Staff**: members, payments, attendance, AI drafts.
