"""Shared page chrome and metadata."""

import json
from ..context import DATA, esc
from .hand import HAND_ATLAS

DISCORD_URL = "https://discord.gg/zrSabnv58"

GITHUB_URL = "https://github.com/MasterAI-EAM/ai-scientists-last-exam"

CONTRIBUTE_PAGES = {"contribute.html", "contributor.html", "contribute-admin.html"}


def header(page, site_prefix="", version=""):
    items = [
        ("index.html", "Home"),
        ("leaderboard.html", "Leaderboard"),
        ("tasks.html", "Tasks"),
        ("contribute.html", "Contribute"),
        ("#team" if page == "index.html" else "index.html#team", "Team"),
    ]
    nav = "".join(
        f'<a href="{site_prefix}{url}"{chr(32) + "aria-current=page" if url == page else ""}>{label}</a>'
        for url, label in items
    )
    nav += f'''<a class="nav-social" href="{DISCORD_URL}" target="_blank" rel="noopener noreferrer" aria-label="Join AISLE on Discord (opens in a new tab)" title="Discord"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg><span class="nav-social-label">Discord</span></a>'''
    nav += f'''<a class="nav-social" href="{GITHUB_URL}" target="_blank" rel="noopener noreferrer" aria-label="AISLE on GitHub (opens in a new tab)" title="GitHub"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297a12 12 0 0 0-3.793 23.385c.6.111.82-.261.82-.577v-2.234c-3.338.726-4.043-1.416-4.043-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.419-1.305.762-1.605-2.665-.303-5.467-1.334-5.467-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.323 3.301 1.23a11.52 11.52 0 0 1 6.006 0c2.291-1.553 3.297-1.23 3.297-1.23.655 1.652.243 2.873.119 3.176.769.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.625-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.216.694.825.576A12.001 12.001 0 0 0 12 .297Z"/></svg><span class="nav-social-label">GitHub</span></a>'''
    return f'''<a class="skip" href="#main">Skip to content</a>
    <header class="site-header"><div class="wrap header-inner">
      <a class="brand" href="{site_prefix}index.html" aria-label="AISLE home"><img class="brand-logo brand-logo-orbital" src="assets/brand/aisle-orbital.svg?v={version}" alt="AISLE orbital logo" width="1254" height="960"><span class="brand-full-name">AI Scientists' Last Exam</span></a>
      <nav class="nav-links" id="main-navigation" aria-label="Main navigation">{nav}</nav>
      <div class="nav-side">
      <button class="menu-toggle" aria-controls="main-navigation" aria-expanded="false">Menu +</button></div>
    </div></header>'''


def footer(site_prefix=""):
    return f"""<footer class="site-footer"><div class="wrap footer-top">
      <a href="{site_prefix}index.html" class="wordmark">© 2026 AISLE</a>
      <div class="footer-links"><a href="{site_prefix}leaderboard.html">Leaderboard</a><a href="{site_prefix}tasks.html">Tasks</a><a href="{GITHUB_URL}" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="{DISCORD_URL}" target="_blank" rel="noopener noreferrer">Discord ↗</a></div>
    </div></footer>"""


def results_data():
    payload = json.dumps(DATA, ensure_ascii=False).replace("<", "\\u003c")
    return f'<script type="application/json" id="results-data">{payload}</script>'


def shell(page, title, description, body, version, *, site_prefix="", origin="https://aisle.science"):
    url = f"{origin}/{page}"
    portal = page == "index.html"
    contribute_page = page in CONTRIBUTE_PAGES
    workspace = contribute_page and page != "contribute.html"
    site_script = "navigation.js" if workspace else "main.js"
    body_class = ' class="contribute-page"' if contribute_page else (
        ' class="tasks-page"' if page == "tasks.html" else ""
    )
    contribute_style = f'<link rel="stylesheet" href="assets/css/contribute.css?v={version}">' if contribute_page else ""
    workspace_head = (
        '<meta name="robots" content="noindex,nofollow">'
        '<meta name="referrer" content="no-referrer">'
        '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; '
        "script-src 'self'; frame-src 'none'; connect-src 'self'; "
        "style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'; form-action 'none'\">"
        f'<script type="module" src="assets/js/contribute.js?v={version}"></script>'
        if workspace else ""
    )
    portal_style = (
        f'<link rel="stylesheet" href="assets/css/portal.css?v={version}"><link rel="stylesheet" href="assets/css/network.css?v={version}">'
        if portal
        else ""
    )
    preload = '<link rel="preload" href="assets/fonts/source-serif-4-latin-variable.woff2" as="font" type="font/woff2" crossorigin>'
    if portal:
        preload = f'<link rel="preload" href="assets/hand-rig/{HAND_ATLAS}" as="image" type="image/webp" fetchpriority="high">\n  ' + preload
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  {workspace_head}
  <title>{esc(title)} · AISLE</title>
  <meta name="description" content="{esc(description)}">
  <meta name="theme-color" content="#10131a">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{esc(title)} · AISLE">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:url" content="{url}">
  <meta name="twitter:card" content="summary">
  <link rel="icon" type="image/svg+xml" href="assets/brand/aisle-orbital-static.svg?v={version}">
  <link rel="apple-touch-icon" href="apple-touch-icon.png">
  <link rel="canonical" href="{url}">
  {preload}
  <link rel="stylesheet" href="assets/css/site.css?v={version}">
  {portal_style}
  {contribute_style}
  <script type="module" src="assets/js/{site_script}?v={version}"></script>
</head>
<body{body_class}>{header(page, site_prefix, version)}{body}{results_data() if page in {"index.html", "leaderboard.html"} else ""}{footer(site_prefix)}</body>
</html>'''
