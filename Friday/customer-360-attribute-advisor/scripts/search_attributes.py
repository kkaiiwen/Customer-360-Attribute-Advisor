#!/usr/bin/env python3
"""Search the bundled Customer 360 Attribute Dictionary without external data."""

import argparse
import csv
import difflib
import json
import re
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "references" / "customer_360_attributes.csv"


def normalize(value: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", value.lower().replace("_", " ")))


def load_rows():
    with DATA.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def score(row, query):
    q = normalize(query)
    attribute = normalize(row["Attribute"])
    description = normalize(row["Description"])
    domain_category = normalize(row["Domain"] + " " + row["Category"])
    haystack = f"{attribute} {description} {domain_category}"
    if not q:
        return 0.0
    exact_bonus = 8.0 if q == attribute else 0.0
    phrase_bonus = 4.0 if q in haystack else 0.0
    terms = q.split()
    coverage = sum(term in haystack for term in terms) / len(terms)
    attr_ratio = difflib.SequenceMatcher(None, q, attribute).ratio()
    desc_ratio = difflib.SequenceMatcher(None, q, description[: max(len(q) * 4, 120)]).ratio()
    return exact_bonus + phrase_bonus + coverage * 3.0 + attr_ratio * 2.0 + desc_ratio


def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--query", help="English field name or business concept")
    group.add_argument("--attribute", help="Exact Attribute name")
    parser.add_argument("--limit", type=int, default=8)
    args = parser.parse_args()
    rows = load_rows()
    if args.attribute:
        matches = [r for r in rows if r["Attribute"].casefold() == args.attribute.casefold()]
    else:
        ranked = sorted(((score(r, args.query), r) for r in rows), key=lambda x: x[0], reverse=True)
        matches = [dict(r, _score=round(s, 3)) for s, r in ranked[: max(args.limit, 1)] if s > 0]
    print(json.dumps(matches, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
