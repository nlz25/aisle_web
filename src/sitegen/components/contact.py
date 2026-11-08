"""Public collaboration contact."""

from urllib.parse import quote

from ..context import esc


CONTACT_EMAIL = "aisle.science@gmail.com"
CONTACT_MAILTO = esc(f"mailto:{CONTACT_EMAIL}?subject={quote('AISLE Collaboration')}")


def contact():
    return f'''<section class="section join-network" id="join" aria-labelledby="join-title">
      <div class="join-copy">
        <h2 id="join-title">Join the network</h2>
        <p>Contribute experiments, connect your lab, or collaborate on AI evaluation.</p>
      </div>
      <div class="join-actions">
        <a class="join-email-button" href="{CONTACT_MAILTO}">Email us</a>
        <a class="join-email-address" href="{CONTACT_MAILTO}">{CONTACT_EMAIL}</a>
      </div>
    </section>'''
