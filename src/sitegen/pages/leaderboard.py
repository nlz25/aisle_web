"""The same experiment explorer used on the homepage."""
from ..components.experiment_board import leaderboard_explorer


def leaderboard():
    return f'''<main id="main" class="wrap"><section class="page-hero"><h1>Leaderboard</h1></section><section class="section" style="padding-top:22px">{leaderboard_explorer()}<p class="leaderboard-update-note">More models will be evaluated and more experimental tasks will be added in future updates.</p></section></main>'''
