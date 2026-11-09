# AISLE — AI Scientists' Last Exam

[aisle.science](https://aisle.science/) presents the experimental evaluation of AI scientists. The site is English only, with an interactive research network, experimental films, fixed-cohort leaderboards and task protocols.

## Develop

Requires Python **3.12+**. Node 22+ is used for JavaScript syntax checks. The website has no client framework; its optional entrance globe uses a locally bundled Globe.gl / Three.js runtime.

```sh
make check     # build, validate links/data/media, check JavaScript
make serve     # serve dist/ at http://127.0.0.1:4173
```

If your default Python is older, use `make check PYTHON=/path/to/python3.12` (and the same for `make serve`).

`make serve` connects the optional entrance counter to a separate local Worker. See [Portal click counter](docs/counter.md) for startup instructions. Local preview clicks do not affect the production total.

The checked-in globe bundle needs no npm install for ordinary builds or deployment.
To regenerate it after changing dependencies:

```sh
cd scripts/globe-vendor
npm ci --ignore-scripts
npm run build
```

Commit the lockfile, generated `public/assets/vendor/globe.gl.js` and dependency
licenses together. See [architecture and performance](docs/architecture.md) for
the entrance's loading and rendering budgets.

## Project structure

```text
src/
  sitegen/
    pages/          # home, leaderboard, tasks and Contribute workspaces
    components/     # layout, portal, map, result tables, institutions
    context.py      # build paths, study data and HTML escaping
  styles/           # base components, dark theme, entrance, research network
  scripts/          # navigation, view loading, portal, globe, research, map
public/             # files copied into the deployed website
  assets/           # optimized artwork, fonts, logos, map, films
  CNAME             # aisle.science
  favicon.png
  apple-touch-icon.png
data/               # study scores and research-network metadata
scripts/            # build, validation and optional asset tools
services/           # Cloudflare Workers for the counter and Contribute API
design/             # originals, authoring previews/intermediates and archives
docs/               # architecture, content and media provenance
.github/workflows/  # validation, Pages deployment and Contribute Worker deployment
dist/               # generated output; ignored by Git
```

Edit `src/`, `public/` and `data/`. Never edit `dist/`. Every build starts from a clean output directory; only that output is deployed. Original media and design experiments are excluded from publication.

Keep only current browser assets in `public/`. Optional asset tools use explicit
recipes in `scripts/optimize_assets.py`; archived originals are not regenerated
into the website. Map intermediates and standalone hand-part SVG previews live
in `design/generated/`. See [editing content](docs/content-guide.md) for regeneration.

## Contribute

The public [Contribute page](https://aisle.science/contribute.html) runs on GitHub
Pages and links to the contributor workspace (`/contributor.html`). The
Contribute Worker serves that workspace and the administrator workspace
(`/contribute-admin.html`).

| Component | Responsibility |
| --- | --- |
| Site generator and browser UI | Python renders the public page and both workspaces. Vanilla JavaScript calls the API and displays tasks, ZIPs, and comments. See [page templates](src/sitegen/pages/contribute.py), [browser code](src/scripts/contribute.js), and [styles](src/styles/contribute.css). |
| Cloudflare Worker | Serves the workspaces and the `/api/contribute` API. Checks identity, task ownership, reviewer permissions, uploads, and quotas. See [Worker code](services/contribute/worker.js). |
| Cloudflare D1 | Stores contributor profiles, sessions, task records, comments, review history, and quota usage. See [database migrations](services/contribute/migrations/). |
| Supabase Auth | Handles GitHub sign-in and authenticator app verification. Administrator access requires an approved Supabase user ID and recent MFA verification. |
| Supabase Storage | Holds Wet Lab archives in the private `aisle-contribute-private` bucket. The Worker controls upload and download access. |

Contributors sign in with GitHub, complete their profile, and create a task
draft. The workspace tracks review status and lets contributors discard their
own unsubmitted drafts after confirmation.

- **Dry Lab.** The draft provides a copyable Markdown PR description with the
  full AISLE Task ID, title, and experiment description. Contributors open a
  GitHub PR with their task files, save its URL in the workspace, and submit
  for review.
- **Wet Lab.** Contributors attach one ZIP of up to 25 MiB. **Manage ZIP**
  groups replacement, removal, and file comments. Contributors can update lab
  availability and notices per task. ZIP comments identify the version they
  refer to, even after a replacement.
- **Review.** Contributors and reviewers share a task discussion. Verified
  administrators can switch between cards and a compact list, edit submitted
  task details, change review status, lock or unlock ZIP changes, and delete
  tasks after confirmation.
- **Submission limits.** Each account can submit up to five tasks for review
  and attempt up to ten Wet Lab uploads totaling 100 MiB in a rolling 24-hour
  window. ZIP replacements count toward upload usage, and deleting a task or
  file does not restore quota. The workspace shows when a contributor can retry
  if they reach a limit.

Run the Contribute integration tests with local D1 and simulated Supabase
services from the repository root.

```sh
npm ci --prefix services/contribute
npm test --prefix services/contribute
```

See the [Contribute service and deployment guide](docs/contribute.md) for
configuration, reviewer setup, and production checks.

## Publication

A push or merge to `main` runs [Build and deploy AISLE](.github/workflows/pages.yml)
to build, validate, and publish the public site to GitHub Pages at
`aisle.science`. Pull requests run the build and validation checks.

To publish Contribute workspace or API changes, run
[Deploy Contribute API](.github/workflows/contribute.yml) manually from `main`
after merging. It builds the workspace assets for the standalone Worker,
applies D1 migrations, and deploys the Worker.

## Documentation

- [Architecture and performance](docs/architecture.md)
- [Editing content](docs/content-guide.md)
- [Score provenance](docs/data-provenance.md)
- [Research films](docs/network-media.md)
- [Entrance artwork](docs/portal-art.md)
- [Portal click counter](docs/counter.md)
- [Contribute service and deployment](docs/contribute.md)
- [Roadmap](docs/roadmap.md)

Scores describe an evaluated research cohort, not a live ranking of current models. The research network's four regions and supplied films do not describe coverage of the scored benchmark. Original logos and laboratory footage retain their respective owners' rights.
