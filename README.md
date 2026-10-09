# Disc Room
A bring-your-own-game browser player with 39 systems, 46 available emulator cores, local firmware loading and one remote controller.

## Use
Choose a system with the scroll wheel at /emulators, then launch its /play/{system} room. Select a game image or ZIP. For BIN/CUE discs, select the CUE and all referenced tracks together. Formats and firmware requirements are shown per system. Add firmware when needed, choose an emulator core, then start. Files stay in the browser and are never uploaded to the room service. Archives and game images are limited to 1.5 GB; firmware to 64 MB.

Create a room, copy its invite and approve the guest. The host runs the game and streams video/audio over WebRTC. The guest sends controller input. Games with local multiplayer use player two. Handheld systems share player one for taking turns; link-cable, PSP wireless and native handheld network multiplayer are not implemented. Computer keyboard/mouse and DS/3DS touchscreen input remain on the host; guests use controller input. Game compatibility depends on the core and firmware. A capable desktop with WebGL 2 and shared memory is required for PSP and 3DS.

Systems: PlayStation 1, NES / Famicom, Super Nintendo, Nintendo 64, Game Boy, Game Boy Color, Game Boy Advance, Nintendo DS, Nintendo 3DS, Virtual Boy, PlayStation Portable, Mega Drive / Genesis, Master System, Game Gear, Sega CD, Sega 32X, Sega Saturn, Atari 2600, Atari 5200, Atari 7800, Atari Jaguar, Atari Lynx, ColecoVision, Intellivision, PC Engine / TurboGrafx, PC-FX, Neo Geo Pocket, WonderSwan, 3DO, Arcade / FinalBurn, Arcade / MAME, Philips CD-i, Commodore Amiga, Commodore 64, Commodore 128, Commodore PET, Commodore Plus/4, Commodore VIC-20, DOS.

Dreamcast has no available EmulatorJS core and is omitted from the console picker. PS2, GameCube and Wii are not provided by this engine. Experimental cores (bsnes, genesis_plus_gx_wide, azahar, freeintv, same_cdi) use the upstream nightly runtime and are marked accordingly; their availability and behavior can change. The current bsnes build cannot serialize save states, so state import/export is disabled for that core; use snes9x for state backups. Stable cores use EmulatorJS 4.2.3. Cores download on demand through a same-origin allowlist of emulator assets. ROM and firmware data never pass through that endpoint.

## Controls and saves
Arrows: D-pad. X/Z: B/A (PS1 Cross/Circle). A/S: Y/X (PS1 Square/Triangle). Q/E: L/R. 1/3: L2/R2. Enter/Shift: Start/Select. F/H/T/G: left stick left/right/up/down. J/L/I/K: right stick. Standard gamepads support buttons and both sticks. Mapping can be adjusted in the emulator menu. Physical controller testing is still required.

Browser saves are kept in per-system folders; the original PS1 folder is preserved. Export/import save states in Controls & saves. Use the same game, core and version when importing. The host manages saves during a remote session. Changing the game closes the current room. Old root-path PS1 invites still work; new invites identify their system. Invite links take priority over any copied or stale host session. A returning guest keeps their approval and requests fresh signaling instead of replaying old offers. A returning host must reload their local game.

## Network and access
Room tokens are cryptographically random and hashed server-side. A host approves each guest. D1 stores names, signals and token hashes only. Rooms expire after four hours or an absent heartbeat. The host must approve each invited guest. This Vercel version does not depend on Sites sign-in or its sharing policy. Keep database and TURN credentials server-only.

STUN is configured. A TURN relay is needed when networks block direct WebRTC. Set TURN_URL, TURN_USERNAME and TURN_CREDENTIAL as hosted secrets; TURN_URL accepts comma-separated endpoints. This app does not provision a relay account automatically.

## Development
Node 22.13+ and npm. Run npm ci, copy .env.example to .env.local and set the Turso database URL/token, then npm run dev. The standard Next.js build runs with npm run build. Vercel configuration is in vercel.json. The database creates its tables idempotently on first room use. Emulator HTML is embedded from app/engine.html via Webpack asset/source. Isolation headers support threaded emulator cores. See DEPLOYMENT.md.

## Validation
All 46 core reports and primary core binaries returned successfully from the upstream CDN. All 39 session routes render. Original homebrew fixtures boot on PS1, NES, Game Boy, DOS (threaded) and experimental SNES. PS1 and Game Boy pass two-browser host approval, remote video/audio, controller press/release, pause, state export and invalid-token checks. Experimental SNES also passes remote video/audio, analog keyboard/gamepad input and cross-system invite routing, with its broken upstream state export safely blocked. Required firmware gating, BIOS ZIP upload, CUE dependencies, unavailable routes, five responsive widths and mouse/keyboard/touch wheel navigation are checked. Commercial game compatibility, remaining platform boot behavior, physical gamepads, restrictive NAT/TURN and cross-network latency require real-device testing. Inline iframe boot, BIOS uploads, repeated game loading and threaded DOS shared memory have also been checked. Room recovery checks cover host-session copies in new tabs, pending/approved guest reloads, stale tokens and explicit invites overriding old rooms. No commercial ROM or vendor BIOS is bundled.

## Licenses and upstream source
The app is GPL-3.0-or-later. Stable frontend assets are unmodified EmulatorJS 4.2.3; public/emulator/LICENSE contains its license. Corresponding source: https://github.com/EmulatorJS/EmulatorJS/tree/v4.2.3 . Experimental frontend source: https://github.com/EmulatorJS/EmulatorJS . Core build recipes and corresponding upstream repositories are maintained in https://github.com/EmulatorJS/EmulatorJS/tree/main/data/cores and https://github.com/EmulatorJS/RetroArch . Each emulator retains its own license and notices. The upstream CDN supplies the original core packages unchanged. No firmware or commercial game is included.

Archivo and Archivo Black are self-hosted under the SIL Open Font License; see public/fonts/Archivo-OFL.txt and public/fonts/ArchivoBlack-OFL.txt.

Console picker hardware images are included for all 39 entries. The 38 additional photographic cutouts come from the Carbon theme by Rookervik, based on simple by Nils Bonenberger, distributed by fabricecaruso/es-theme-carbon. These image assets retain their separate CC BY-NC-SA terms; see public/images/hardware/ATTRIBUTION.txt and source-license.txt for source links and notices. PlayStation retains its original generated artwork.
