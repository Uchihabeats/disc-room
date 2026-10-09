# GitHub and Vercel deployment

This export uses standard Next.js on Vercel and Turso/libSQL for durable multiplayer rooms. The existing Sites publication is independent.

1. Push this directory to your GitHub repository. Keep .env.local, database files and .vercel ignored.
2. Import the repository into Vercel using the Next.js framework preset. vercel.json supplies the build/install commands.
3. Add a Turso database through Vercel Marketplace or use an existing database. Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for production and preview. Tables are created on first room use, so the token must permit schema creation and writes. No game/BIOS files are stored there.
4. Configure TURN_URL, TURN_USERNAME and TURN_CREDENTIAL if a relay is available. Without TURN, restrictive networks may not connect.
5. Deploy and verify creating a room, approving a second browser, reconnecting, and remote video/input. Browser ROM/BIOS files and saves remain local.

Local verification can use TURSO_DATABASE_URL=file:./work/rooms.db. Vercel rejects local-file database URLs so production cannot silently use ephemeral storage.

The hardware image assets have separate CC BY-NC-SA terms in public/images/hardware/ATTRIBUTION.txt and source-license.txt. The application code is GPL-3.0-or-later. No commercial ROM or vendor BIOS is bundled.
