# GitHub and Vercel deployment

This export uses standard Next.js on Vercel and Turso/libSQL for durable multiplayer rooms. The existing Sites publication is independent.

1. Push this directory to your GitHub repository. Keep .env.local, database files and .vercel ignored.
2. Import the repository into Vercel using the Next.js framework preset. vercel.json supplies the build/install commands.
3. Add a Turso database through Vercel Marketplace or use an existing database. Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for production and preview. Tables are created on first room use, so the token must permit schema creation and writes. No game/BIOS files are stored there.
4. For Cloudflare Realtime TURN, create a TURN key in the Cloudflare dashboard, then add CLOUDFLARE_TURN_KEY_ID and CLOUDFLARE_TURN_API_TOKEN to the Vercel project's production environment. Keep the API token Secret; never prefix it with NEXT_PUBLIC_. The server issues four-hour credentials only to approved rooms, and the permanent key is never returned to browsers. Alternatively configure TURN_URL, TURN_USERNAME and TURN_CREDENTIAL for another provider. Without TURN, restrictive networks may not connect.
5. Deploy and verify creating a room, approving a second browser, reconnecting, and remote video/input. Browser ROM/BIOS files and saves remain local.

Local verification can use TURSO_DATABASE_URL=file:./work/rooms.db. Vercel rejects local-file database URLs so production cannot silently use ephemeral storage.

The hardware image assets have separate CC BY-NC-SA terms in public/images/hardware/ATTRIBUTION.txt and source-license.txt. The application code is GPL-3.0-or-later. No commercial ROM or vendor BIOS is bundled.

Remote streaming defaults to Balanced (30 FPS, 1.2 Mbps video ceiling). Either player can select Data saver (24 FPS, 600 kbps) or Sharper picture (30 FPS, 2.4 Mbps). Actual bitrate can be lower as the browser adapts to the connection. The room's connection details show the selected path, video rate, round-trip time, guest packet loss/jitter, and acknowledgements after inputs reach the emulator. If a direct connection fails and TURN is configured, reconnect attempts switch to relay-only; either player can also choose Try relay connection. The host must refresh after this update so both sides use the new input acknowledgement protocol.

Cloudflare setup: https://developers.cloudflare.com/realtime/turn/generate-credentials/
Cloudflare pricing: https://developers.cloudflare.com/realtime/sfu/platform/pricing/
