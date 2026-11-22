"""Run with:  python -m pytest ai/report_helper   (or: python test_model.py)"""
from model import ReportHelper

helper = ReportHelper()

def test_clear_cases():
    assert helper.suggest("laptop with patient list was stolen from my car").type == "lost_stolen"
    assert helper.suggest("sent the payroll file to the wrong email").type == "wrong_recipient"
    assert helper.suggest("hackers got into our online store database").type == "unauthorised_access"

def test_malay_english_mix():
    assert helper.suggest("phone hilang, ada gambar customer").type == "lost_stolen"

def test_suggests_data_places():
    places = [p["place"] for p in helper.suggest("our online shop got hacked and card numbers leaked").places]
    assert "Online orders" in places

def test_not_sure_when_vague():
    s = helper.suggest("hmm something weird")
    assert s.type is None and "choose" in s.type_label

def test_too_short():
    assert helper.suggest("hi").confidence == 0.0

def test_always_only_a_suggestion():
    assert "confirm" in helper.suggest("lost a laptop").note.lower()

if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn(); print("pass", name)
