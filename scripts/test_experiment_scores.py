"""Verify the current two-board score contract and partial coverage."""
import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'src'))
from sitegen.components.experiment_board import ranking,SCORES,MODES,leaderboard_explorer
class Scores(unittest.TestCase):
 def test_frozen_results(self):
  self.assertAlmostEqual(ranking('wet')[1][0]['score'],41.193952056907015)
  self.assertAlmostEqual(ranking('dry')[1][0]['score'],73.14814814814815)
  self.assertAlmostEqual(SCORES['astra']['safety'],80*2/18)
 def test_partial_coverage(self):
  rows=ranking('wet')[1]
  self.assertEqual(len(rows),9)
  self.assertEqual(sum(r['score'] is not None for r in rows),5)
  glm=next(r for r in rows if r['model']['id']=='glm')
  self.assertIsNone(glm['score']); self.assertIsNone(glm['rank'])
  self.assertIsNotNone(glm['values'][0]);self.assertIsNotNone(glm['values'][1])
  self.assertEqual(sum(r['score'] is not None for r in ranking('dry')[1]),9)
 def test_weights(self):
  for mode,keys in [('wet',['optimization_wet','robustness','multimodal']),('dry',['optimization_dry','safety'])]:
   for r in ranking(mode)[1]:
    vals=[SCORES[r['model']['id']][k] for k in keys]
    if None in vals:self.assertIsNone(r['score'])
    else:self.assertAlmostEqual(r['score'],sum(vals)/len(vals))
 def test_ties(self):
  rows=ranking('dry','safety')[1]
  for r in rows:self.assertEqual(r['rank'],1+sum(o['score']>r['score'] for o in rows))
 def test_views(self):
  self.assertEqual(set(MODES),{'wet','dry'})
  html=leaderboard_explorer();self.assertEqual(html.count('data-ranking-panel '),7)
  self.assertIn('In progress',html);self.assertNotIn('data-experiment-mode="all"',html)
if __name__=='__main__':unittest.main()
