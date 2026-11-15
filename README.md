# Orion Security Platform

AI-assisted security assessment platform. Orion scans networks and web
applications for vulnerabilities, correlates the findings with AI-driven
analysis, and turns the result into a report your team can act on —
all from a single dashboard that doesn't require a pentest background
to use.

**Proprietary software.** This repository is private; do not share its
contents, clone URL, or any part of this codebase outside the organization.

## What you can do with it

- Run network and web application scans against your own infrastructure.
- Get findings ranked by real-world risk, not just raw tool output.
- Ask the built-in assistant ("Ask Orion") about any finding in plain language.
- Export a client-ready PDF report once a scan completes.
- Track findings across repeated scans to see what's actually been fixed.

## Requirements

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (bundled
  with Docker Desktop, or `docker-compose-plugin` on Linux).
- 4 GB of free RAM minimum, 8 GB recommended.
- An API key for your chosen AI provider (see `.env.example`), or a local
  model runtime if you prefer to keep analysis fully on-premises.

## Getting started

```bash
git clone <this repository's URL>
cd orion.ai
cp .env.example .env
# open .env and fill in your database password, secret key, and AI provider
# credentials — see the comments in .env.example for what each value does
```

Then start everything with one command:

```bash
./scripts/run_platform.sh      # macOS / Linux
scripts\run_platform.bat       # Windows
```

This builds and starts the full platform in the background. Once it's
up, open **http://localhost** in your browser.

To stop it:

```bash
docker compose down
```

## Support

For access requests, bug reports, or questions about deploying Orion
in your environment, contact your team lead or open an issue in this
repository.
