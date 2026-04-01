# Local Setup Notes

## What was done
- Cloned `https://github.com/iamlukethedev/Claw3D` into this directory.
- Installed npm dependencies with `npm install`.
- Added a local `.env` that keeps Claw3D state inside this repo via `OPENCLAW_STATE_DIR=./.openclaw-state`.
- Verified the dev server can boot with `npm run smoke:dev-server`.

## Run
```bash
npm run dev
```
Then open:
- `http://127.0.0.1:3000`

## Minimal OpenClaw Gateway connection point
Claw3D connects to OpenClaw through Studio settings or env vars.

Current local `.env` defaults:
- `CLAW3D_GATEWAY_URL=ws://127.0.0.1:18789`
- `OPENCLAW_STATE_DIR=./.openclaw-state`

If you want auto-filled connection defaults, set this in `.env`:
```bash
CLAW3D_GATEWAY_TOKEN=<your gateway token>
```

Alternative: leave token unset and paste it in the Claw3D connection UI on first launch.

## Local state path used by this setup
- `./.openclaw-state/claw3d/settings.json`

This avoids writing Claw3D Studio settings to the normal global `~/.openclaw/claw3d/settings.json` path.

## Environment notes found on this machine
- `openclaw gateway status` responded successfully.
- Gateway probe target reported by OpenClaw: `ws://127.0.0.1:18789`
- Gateway auth token can be retrieved locally with:
```bash
openclaw config get gateway.auth.token
```

## Validation results
- `npm run smoke:dev-server` ✅
- `npm run typecheck` ❌ upstream repo currently has test typing errors around `onOpenSettings` in `tests/unit/agentChatPanel-*.test.ts*`
- `npm run lint` ❌ upstream repo currently has at least one lint error in `src/features/retro-office/RetroOffice3D.tsx`
