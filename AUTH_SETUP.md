# Real account setup

The login page and registration page use the Express API. Demo login and the
SQLite/demo-database fallback are disabled. MySQL must be configured before the
backend starts. The landing page remains the public introduction to VehicleCare.

## First setup

1. Install dependencies: run `npm install` in both `backend` and `frontend`.
2. Import `database/schema.sql` into MySQL if the database is not already set up.
   Do not reimport it into an existing deployment unless you intend to initialize its schema.
3. Copy `backend/.env.example` to `backend/.env` if it does not exist. Set the
   MySQL credentials and a long random JWT_SECRET. Keep existing environment files.
4. Run `npm run dev` in `backend` and in `frontend`, in separate terminals.
5. Open http://localhost:5173/register and create your customer account. Successful
   registration signs you in. Sign out and use /login to test the same credentials.

The ML service is optional for authentication. Customers start with their own
records; there are no sample records inserted by registration.

## Admin account

Run `npm run create-admin` in `backend`. Enter a name, email, phone and the new
password twice. Password input is hidden. This creates a real admin or resets
an existing admin account's password; it does not convert customer accounts into
admins. Sign in at /admin/login. The command requires database access.

Old demo credentials in README.md and seed.sql are not a reliable login method.
Create your own accounts. Public registration refuses privileged roles.

## Verification

Run `npm run test:auth` in backend, and `npm run build` in frontend.
The auth tests isolate database and crypto boundaries; they do not replace a
live MySQL test. Check registration, duplicate email, wrong password, sign-out,
page reload, and admin login against the running backend.

Passwords use bcrypt and sessions use expiring JWTs. Protected requests check
that the account still exists and is active. Sign-out clears this browser's
session; it does not revoke copies of a JWT on other devices. Password-reset
email delivery remains the pre-existing unfinished feature.

## Garage accounts and approval

For an existing database, apply the garage role migration once using a database
administrator. On a local MariaDB installation with root socket authentication:

```bash
sudo mariadb < database/migrations/001-garage-role.sql
```

Fresh installs get the role through `database/schema.sql`. Choose **Garage**
on the sign-in or registration page to find the garage registration form.
Platform admins sign in at `/admin/login` and approve workshops under
**Service Centers**. Approved workshops appear in the
customer booking form. Sign in as **Garage** to manage that workshop's bookings
and download its invoices. A garage can sign in and check its approval status
while approval is pending.

To prepare the local demo garage, run `node scripts/create-demo-garage.js` from
`backend`. The script prints the generated demo password on creation. It links
the previously provisioned demo workshop and preserves its existing bookings
when that workshop is present.
