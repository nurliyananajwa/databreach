"""Report helper: a small, local machine-learning model.

It reads what a staff member typed and SUGGESTS
  1. the incident type (lost or stolen, sent to the wrong person, someone got in, other)
  2. which data places from the inventory are probably involved.

It never decides anything. The Compliance Officer confirms or changes every suggestion.
It runs on our own server: no text is sent to any outside AI company.
All training examples are fictional.
"""

from __future__ import annotations

import csv
import json
from dataclasses import dataclass, field
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.pipeline import FeatureUnion, Pipeline

DATA = Path(__file__).parent / "data"

TYPE_LABELS = {
    "lost_stolen": "Lost or stolen",
    "wrong_recipient": "Sent to the wrong person",
    "unauthorised_access": "Someone got in without permission",
    "other": "Something else",
}

# Below this, the helper says it is not sure and asks the person to choose.
CONFIDENT = 0.45


def _features() -> FeatureUnion:
    # Words (so "laptop" + "stolen" count) and letter groups (so typos and
    # Malay/English mixes like "kena curi", "tersalah hantar" still match).
    return FeatureUnion([
        ("words", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)),
        ("chars", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True)),
    ])


def load_examples() -> tuple[list[str], list[str]]:
    with open(DATA / "examples.csv", newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    return [r["text"] for r in rows], [r["type"] for r in rows]


def load_places() -> list[dict]:
    return json.loads((DATA / "places.json").read_text(encoding="utf-8"))


def build_type_model() -> Pipeline:
    return Pipeline([
        ("features", _features()),
        ("classify", LogisticRegression(max_iter=2000, C=6, class_weight="balanced")),
    ])


@dataclass
class Suggestion:
    type: str | None                 # e.g. "lost_stolen", or None when not sure
    type_label: str                  # text shown to the user
    confidence: float                # 0..1
    places: list[dict] = field(default_factory=list)  # [{place, fields, score}]
    note: str = "Suggestion only. Please confirm or change."


class ReportHelper:
    def __init__(self, places: list[dict] | None = None):
        texts, labels = load_examples()
        self.type_model = build_type_model().fit(texts, labels)
        self.places = places if places is not None else load_places()
        # Describe each place in words, then compare a report against them.
        self._place_text = [
            f"{p['place']} {p['kept_in']} {' '.join(p['fields'])} {p.get('words', '')}".lower()
            for p in self.places
        ]
        self._place_vec = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5)).fit(
            self._place_text + [t.lower() for t in texts]
        )
        self._place_matrix = self._place_vec.transform(self._place_text)

    def suggest(self, report: str, max_places: int = 2) -> Suggestion:
        report = (report or "").strip()
        if len(report) < 8:
            return Suggestion(None, "Tell us a little more first", 0.0, note="Too short to suggest anything.")

        probs = self.type_model.predict_proba([report])[0]
        classes = list(self.type_model.classes_)
        best = int(probs.argmax())
        confidence = float(probs[best])
        kind = classes[best] if confidence >= CONFIDENT else None
        label = TYPE_LABELS[kind] if kind else "Not sure, please choose"

        scores = cosine_similarity(self._place_vec.transform([report.lower()]), self._place_matrix)[0]
        ranked = sorted(zip(scores, self.places), key=lambda x: x[0], reverse=True)
        places = [
            {"place": p["place"], "kept_in": p["kept_in"], "fields": p["fields"], "score": round(float(s), 2)}
            for s, p in ranked[:max_places]
            if s >= 0.12  # weak matches are not shown
        ]
        return Suggestion(kind, label, round(confidence, 2), places)


if __name__ == "__main__":
    import sys

    helper = ReportHelper()
    text = " ".join(sys.argv[1:]) or "laptop with the appointment list was taken from my car"
    s = helper.suggest(text)
    print(f"Report:     {text}")
    print(f"Type:       {s.type_label}  (confidence {s.confidence:.0%})")
    for p in s.places:
        print(f"Data place: {p['place']} ({p['kept_in']}) · {', '.join(p['fields'])}  [match {p['score']}]")
    print(s.note)
