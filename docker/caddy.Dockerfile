# ============================================================
# Helix Caddy — Reverse Proxy with On-Demand TLS
# ============================================================

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
