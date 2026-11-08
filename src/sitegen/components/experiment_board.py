"""One leaderboard, with explicit environment and comparable coverage views."""
import json
from ..context import ROOT, MODELS, esc
from .results import CATEGORY_COLORS, category_names, logo

SCORES = json.loads((ROOT / 'data/experiment-scores.json').read_text())['models']
MODES = {'wet': 'Wet experiments', 'dry': 'Dry experiments'}
CATEGORIES = {'all': ['optimization', 'safety', 'robustness', 'multimodal'],
              'wet': ['optimization', 'robustness', 'multimodal'],
              'dry': ['optimization', 'safety']}
LABELS = {**category_names(), 'suzhou4d': 'Platform A 4D', 'singapore4d': 'Platform B 4D',
          'real8d': 'Platform A 8D', 'optimization_dry': 'Sim-4D',
          'drift': 'Hidden drift', 'resin': 'Resin transfer', 'pka': 'pKa', 'spectrum': 'Spectrum matching'}


def category_score(model_id, mode, category):
    key = f'optimization_{mode}' if category == 'optimization' else category
    return SCORES[model_id][key]


def ranking(mode, category='overall', coverage='full'):
    keys = CATEGORIES[mode] if category == 'overall' else [category]
    if category == 'overall' and coverage == 'shared':
        keys = [key for key in keys if key != 'multimodal']
    rows = []
    for model in MODELS:
        values = [category_score(model['id'], mode, key) for key in keys]
        score = None if any(value is None for value in values) else sum(values) / len(values)
        rows.append({'model': model, 'values': values, 'score': score})
    rows.sort(key=lambda row: -(row['score'] if row['score'] is not None else -1))
    for row in rows:
        row['rank'] = None if row['score'] is None else 1 + sum(other['score'] is not None and other['score'] > row['score'] for other in rows)
    return keys, rows


def breakdown(mode, category):
    if category == 'optimization':
        return (['suzhou4d', 'singapore4d', 'real8d'] if mode != 'dry' else []) + (['optimization_dry'] if mode != 'wet' else [])
    return {'robustness': ['drift', 'resin'], 'multimodal': ['pka', 'spectrum']}.get(category, [])


def panel(mode, category, coverage):
    keys, rows = ranking(mode, category, coverage)
    overall = category == 'overall'
    details = keys if overall else breakdown(mode, category)
    label = 'Overall' if overall else LABELS[category]
    body = ''
    for row in rows:
        model, score = row['model'], row['score']
        segments = ''.join(f'<span tabindex="0" data-module-score="{esc(LABELS[key])}: {value:.2f} / 100" data-module-label="{esc(LABELS[key])}" data-module-value="{value:.2f}" aria-label="{esc(LABELS[key])}: {value:.2f} out of 100" style="width:{value / len(keys):.8f}%;background:{CATEGORY_COLORS[key]}"></span>' for key, value in zip(keys, row['values']) if value is not None)
        fmt = lambda value: 'In progress' if value is None else f'{value:.2f}'
        cells = ''.join(f'<td>{fmt(category_score(model["id"], mode, key) if overall else SCORES[model["id"]][key])}</td>' for key in details)
        body += f'<tr data-ranked-model="{model["id"]}" data-score="{score}"><td>{row["rank"] if row["rank"] is not None else "—"}</td><th scope="row"><span class="experiment-model">{logo(model)}<span>{esc(model["name"])}<small>{esc(model["organization"])}</small></span></span></th><td><strong>{fmt(score)}</strong></td><td class="experiment-bar-cell"><span class="experiment-bar" aria-label="{esc(label)}: {fmt(score) + " out of 100" if score is not None else "In progress"}">{segments}</span></td>{cells}</tr>'
    heads = ''.join(f'<th scope="col">{esc(LABELS[key])}</th>' for key in details)
    note = '' if overall else {
        'optimization': {'all': 'Four conditions, equal weights.', 'wet': 'Three physical conditions, equal weights.', 'dry': 'Sim-4D, 0-shot; few-shot controls excluded.'}[mode],
        'safety': 'Target attainment with at most one unsafe touch: 80% · All-three-repeat success: 20%.',
        'robustness': 'Real drift 50% · Resin transfer 50%. Simulated drift is excluded.',
        'multimodal': 'pKa 50% · Spectrum matching 50%.'}[category]
    note_html = f'<p class="experiment-note">{note}</p>' if note else ''
    bar_head = f'<th scope="col">{"Contributions" if overall else "Score / 100"}</th>'
    ident = f'experiment-{mode}-{category}-{coverage}'
    visible = mode == 'wet' and overall and coverage == 'full'
    return f'''<section id="{ident}" data-ranking-panel data-mode="{mode}" data-category="{category}" data-coverage="{coverage}" aria-label="{MODES[mode]} · {label}" {'' if visible else 'hidden'}>
    <div class="table-scroll experiment-table-scroll" role="region" tabindex="0" aria-label="{MODES[mode]} {label} scores"><table class="results-table experiment-table"><caption class="sr-only">{MODES[mode]} · {label}. Scores 0–100; equal scores share a rank.</caption><thead><tr><th scope="col">Rank</th><th scope="col">Model</th><th scope="col">Score</th>{bar_head}{heads}</tr></thead><tbody>{body}</tbody></table></div>{note_html}</section>'''


def leaderboard_explorer():
    modes = ''.join(f'<button type="button" class="tab" data-experiment-mode="{key}" aria-pressed="{str(key == "wet").lower()}">{label}</button>' for key, label in MODES.items())
    categories = ''.join(f'<button type="button" data-experiment-category="{key}" aria-pressed="{str(key == "overall").lower()}">{label}</button>' for key, label in {'overall': 'Overall', **category_names()}.items())
    panels = ''
    for mode in MODES:
        for category in ['overall'] + CATEGORIES[mode]:
            coverages = ['full']
            for coverage in coverages:
                panels += panel(mode, category, coverage)
    return f'''<div class="experiment-explorer" data-experiment-explorer><div class="tabs" role="group" aria-label="Experiment type">{modes}</div><div class="experiment-toolbar"><div class="stack-legend" role="group" aria-label="Task category">{categories}</div><label class="experiment-coverage" hidden>Coverage <select data-experiment-coverage aria-label="Comparable evaluation coverage"><option value="full">Complete categories required</option></select></label></div><p class="sr-only" role="status" data-ranking-status></p>{panels}<noscript><style>[data-ranking-panel][hidden]{{display:block!important}}</style><p>All score tables are shown. Enable JavaScript to filter.</p></noscript></div>'''
