- Using this app, users can integrate their supabase accounts and check the PITR status of their projects, RLS status of tables and MFA status of users. They can also collect the timestamped evidence for these checks.
- This is built using Next.js for UI and express.js for the backend.
- Tailwind is used for styling.
- Supabase is used for auth and database.

- A live demo is hosted at https://delve.goyatg.com

### How to run

- Before running this project, it needs the following environment variables

```
SERVER_PORT=<port for express server. eg: 3001>
NEXT_PUBLIC_API_URL=<eg: https://localhost:3001/api>

NEXT_PUBLIC_SUPABASE_URL=<needed for auth on client side as well for db operations on express server>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<needed for auth on client side>
SUPABASE_SERVICE_ROLE_KEY=<needed for db operations on express server>

ENCRYPTION_KEY=<needed for encrypting and decrypting the customer's supabase access token>
```

- To start in dev mode, run `npm run dev:all`. It will run both the next js server as well as express server.

- To start in production mode, first build the static site using `npm run build` and then run the server using `npm run server`.
