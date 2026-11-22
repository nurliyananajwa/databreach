# Report helper (AI feature, prototype)

A small machine-learning model that reads a staff member's breach report and **suggests**:

1. the incident type: lost or stolen, sent to the wrong person, someone got in, or something else
2. which data places from the inventory are probably involved

It never decides anything. The Compliance Officer confirms or changes every suggestion, so the
system still makes no legal decisions. It runs on our own server, so no report text is sent to any
outside AI company (no cross-border transfer of personal data).

All training examples in `data/` are fictional.

## Try it

```
pip install -r ai/report_helper/requirements.txt
cd ai/report_helper
python model.py "laptop with patient list kena curi dalam kereta"
python evaluate.py      # how accurate it is on reports it has not seen
python test_model.py    # quick checks
```

## How it works

- **Incident type:** text is turned into numbers (TF-IDF on words and on 3 to 5 letter groups, so typos and
  Malay/English mixes still match), then a logistic regression model picks the most likely type.
  If it is less than 45% sure, it says "Not sure, please choose".
- **Data places:** each inventory place is described in words (name, where it is kept, its fields), and the
  report is compared to each one. The closest two are suggested if they match well enough.

## Accuracy today

About 70% correct on unseen reports, trained on 110 examples. The biggest improvement comes from more examples:
it was 59% with 62 examples. Aim for 40+ per type before relying on it.

## Not done yet

- Connecting it to the app (planned: a small Python API the report page calls, hosted with the app on Vercel
  if the size fits, otherwise on a free Python host)
- Reading the real inventory from Supabase instead of `data/places.json`
- Needs supervisor approval: the approved proposal said "no AI features"
