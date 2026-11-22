"""How good is the helper? Trains on most examples, tests on the rest, 5 times over."""
from sklearn.model_selection import StratifiedKFold, cross_val_score
from model import build_type_model, load_examples

texts, labels = load_examples()
scores = cross_val_score(build_type_model(), texts, labels, cv=StratifiedKFold(5, shuffle=True, random_state=1))
print(f"Incident type correct on unseen examples: {scores.mean():.0%} (range {scores.min():.0%} to {scores.max():.0%}, {len(texts)} examples)")
