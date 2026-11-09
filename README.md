# webserver

Media API and file server for the Kodi `video-browser` addon.

- `APP_PORT` (HTTPS): authenticated API under `/api/v1/` (`Authorization: <ADMIN_KEY>`)
- `PUBLIC_PORT` (HTTPS): static files from `PUBLIC_FOLDER` (videos, thumbnails, subtitles)

Both listeners use the Let's Encrypt certificate for the host in `PUBLIC_URL`
(`/etc/letsencrypt/live/<host>/`) when `NODE_ENV=production`, or `dev-certs/` otherwise.

Redis database 0 is flushed and rebuilt on every start by `routes/file-check.js`, so this
service must not share a database number with the other services.

## Certificate renewal

Handled outside this repo: the `certbot-letsencrypt` service serves the ACME webroot and
`certbot.timer` renews. Its `post_hook` restarts `serverrpi.service` so the new certificate
is loaded.
