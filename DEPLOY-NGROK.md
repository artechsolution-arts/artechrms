# Expose Artech HRMS publicly with ngrok (free)

Make the on-prem HRMS reachable from anywhere over a free HTTPS URL — no domain, no
port-forwarding. ngrok runs as a container next to the app and routes a public URL to it.

```
On-prem server (Docker: app + postgres + minio + ngrok)
                    │  ngrok agent → outbound 443
                    ▼
   https://<random>.ngrok-free.app  ──►  staff anywhere (browser / mobile)
```

---

## 1. Get a free ngrok authtoken (one-time, ~2 min)

1. Sign up free at <https://dashboard.ngrok.com/signup>.
2. Open **Your Authtoken**: <https://dashboard.ngrok.com/get-started/your-authtoken>.
3. Copy the token (a long string like `2abc...XYZ`).

## 2. Add the token on the server

In the project folder (next to `docker-compose.yml`):

```bash
echo 'NGROK_AUTHTOKEN=2abc...paste-your-token...' > .env
```

## 3. Start it

```bash
docker compose up -d            # starts app + db + minio + ngrok
# or just the tunnel if the app is already running:
docker compose up -d ngrok
```

## 4. Get your public URL

```bash
docker logs artechrms_ngrok --tail 20 | grep -o 'https://[a-z0-9-]*\.ngrok-free\.app'
# or open the local inspector:  http://localhost:4040
```

Open that `https://….ngrok-free.app` URL from any network. Done.

> **Free-tier note:** the first time someone opens the link they see an ngrok
> **"You are about to visit …"** warning page — they click **Visit Site** once and it
> goes to the HRMS. The URL is **random and changes** each time the ngrok container
> restarts. For a fixed URL that never changes, ngrok's paid plan offers a **static domain**
> (or switch to Tailscale Funnel, which gives a stable free URL).

---

## Important before sharing the link

- ✅ **Change the test passwords** (`test123` / `hr123`) — reset every account before exposing.
- ✅ **Tighten CORS** — set `ALLOWED_ORIGINS` in `docker-compose.yml` to your ngrok URL
  (or leave `*` only while testing), then `docker compose up -d`.
- ✅ **Biometric stays local** — the auto-sync keeps talking to the device on the LAN; only the
  web UI is exposed.
- 🔒 The authtoken is a **secret** — it's kept in `.env` (gitignored), never commit it.

---

## Useful commands

```bash
docker compose up -d ngrok          # start the tunnel
docker logs artechrms_ngrok -f      # follow logs (and see the URL)
docker compose restart ngrok        # new URL / reconnect
docker compose stop ngrok           # take it offline
```

Inspector dashboard (live requests + the current public URL): **http://localhost:4040**
