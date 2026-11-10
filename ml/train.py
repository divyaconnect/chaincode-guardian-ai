"""
Sentinel.sol vulnerability model — training pipeline.

Dataset : mwritescode/slither-audited-smart-contracts (Hugging Face, MIT), "all-multilabel"
          config. Real Etherscan-verified contracts labeled with Slither detector results.
Model   : TF-IDF (unigram + bigram code tokens, sublinear tf, L2) -> one-vs-rest logistic
          regression, one binary classifier per vulnerability category.
Output  : model.json consumed by src/lib/model/classifier.ts (tokenizer must stay identical).

Usage   : python ml/train.py <parquet_dir> <out_dir>
"""
import glob, json, re, hashlib, sys, time
from multiprocessing import Pool
import numpy as np
import pyarrow.parquet as pq
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_recall_fscore_support, f1_score

T0 = time.time()
# Category -> Slither detector label indices in the dataset's ClassLabel list.
CATS = {
    "reentrancy": [7, 13],                              # reentrancy-no-eth, reentrancy-eth
    "access-control": [11, 15, 21, 22, 23, 29, 35],     # arbitrary-send, controlled-delegatecall, tx-origin, unprotected-upgrade, suicidal, delegatecall-loop, backdoor
    "arithmetic": [3, 4, 19],                           # incorrect-shift, divide-before-multiply, tautology
    "unchecked-calls": [5, 8, 16, 25],                  # unused-return, unchecked-lowlevel, unchecked-transfer, unchecked-send
    "bad-randomness": [10],                             # weak-prng
    "locked-ether": [2],                                # locked-ether
    "strict-equality": [9],                             # incorrect-equality
    "uninitialized-storage": [0, 12, 32],               # uninitialized-state/local/storage
}
NAMES = list(CATS)

BLOCK = re.compile(r"/\*[\s\S]*?\*/")
LINE = re.compile(r"//[^\n]*")
STR = re.compile(r"\"(?:[^\"\\\n]|\\.)*\"|'(?:[^'\\\n]|\\.)*'")
NUM = re.compile(r"\b(?:0x[0-9a-fA-F]+|\d[\d_]*(?:\.\d+)?(?:e\d+)?)\b")
TOK = re.compile(r"[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*|==|!=|<=|>=|&&|\|\||\+\+|--|\+=|-=|\*=|/=|=>|[-+*/%<>=!&|^~?:;,(){}\[\]]")
CALL_SUFFIXES = (".call", ".call.value", ".send", ".transfer", ".delegatecall")


def augment(toks):
    """Append structural tokens (order-aware signals a bag-of-ngrams cannot see)."""
    extra = []
    depth, fn_depth, saw_call = 0, None, False
    n = len(toks)
    for i, t in enumerate(toks):
        if t == "function":
            fn_depth, saw_call = depth, False
        elif t == "{":
            depth += 1
        elif t == "}":
            depth -= 1
            if fn_depth is not None and depth <= fn_depth:
                fn_depth, saw_call = None, False
        if t.endswith(CALL_SUFFIXES):
            if t.endswith(".call.value") or (
                t.endswith(".call") and i + 2 < n and toks[i + 1] == "{" and toks[i + 2] == "value"
            ):
                extra.append("__VALUE_CALL__")
            if fn_depth is not None:
                saw_call = True
        elif saw_call and fn_depth is not None:
            if t in ("=", "+=", "-=") and i > 0 and toks[i - 1] == "]":
                extra.append("__WRITE_AFTER_CALL__")
            elif t in ("+=", "-=") or t == "delete":
                extra.append("__WRITE_AFTER_CALL__")
    return toks + extra


def tokenize(src):
    s = BLOCK.sub(" ", src)
    s = STR.sub(" STR ", s)
    s = LINE.sub(" ", s)
    s = NUM.sub(" NUM ", s)
    return augment(TOK.findall(s))


def prep(row):
    src, labels = row
    toks = tokenize(src)
    doc = " ".join(toks)
    h = hashlib.md5(doc.encode()).hexdigest()
    y = [int(any(l in idx for l in labels)) for idx in CATS.values()]
    return doc, h, y


def main(data_dir, out_dir):
    seen, docs, Y = set(), [], []
    files = sorted(glob.glob(f"{data_dir}/*.parquet"))
    with Pool(8) as p:
        for f in files:
            t = pq.read_table(f, columns=["source_code", "slither"]).to_pydict()
            rows = list(zip(t["source_code"], [list(x) for x in t["slither"]]))
            del t
            for d, h, y in p.imap(prep, rows, chunksize=100):
                if d and h not in seen:
                    seen.add(h)
                    docs.append(d)
                    Y.append(y)
            del rows
            print("loaded", f, len(docs), round(time.time() - T0), flush=True)
    Y = np.array(Y)
    print("unique", len(docs), "label rates", dict(zip(NAMES, Y.mean(0).round(3))), flush=True)

    rng = np.random.default_rng(42)
    idx = rng.permutation(len(docs))
    n = len(idx)
    tr, va, te = idx[: int(n * 0.7)], idx[int(n * 0.7) : int(n * 0.85)], idx[int(n * 0.85) :]

    vec = TfidfVectorizer(
        tokenizer=str.split, token_pattern=None, lowercase=False, ngram_range=(1, 2),
        max_features=8000, min_df=5, sublinear_tf=True, dtype=np.float32,
    )
    Xtr = vec.fit_transform([docs[i] for i in tr])
    Xva = vec.transform([docs[i] for i in va])
    Xte = vec.transform([docs[i] for i in te])
    del docs
    print("vectorized", Xtr.shape, round(time.time() - T0), flush=True)

    model = {"labels": NAMES, "classes": {}}
    metrics = {}
    preds = []
    for j, name in enumerate(NAMES):
        clf = LogisticRegression(C=4.0, max_iter=2000, class_weight="balanced", solver="liblinear")
        clf.fit(Xtr, Y[tr, j])
        pva = clf.predict_proba(Xva)[:, 1]
        best_t, best_f = 0.5, -1.0
        for t in np.arange(0.2, 0.95, 0.025):
            f = f1_score(Y[va, j], pva >= t, zero_division=0)
            if f > best_f:
                best_t, best_f = float(t), f
        pte = clf.predict_proba(Xte)[:, 1] >= best_t
        preds.append(pte)
        pr, rc, f1, _ = precision_recall_fscore_support(Y[te, j], pte, average="binary", zero_division=0)
        metrics[name] = {
            "precision": round(float(pr), 3), "recall": round(float(rc), 3), "f1": round(float(f1), 3),
            "accuracy": round(float((pte == Y[te, j]).mean()), 3), "support": int(Y[te, j].sum()),
        }
        model["classes"][name] = {
            "bias": round(float(clf.intercept_[0]), 5), "threshold": round(best_t, 3),
            "weights": [round(float(w), 4) for w in clf.coef_[0]],
        }
        print(name, metrics[name], "t=", round(best_t, 3), round(time.time() - T0), flush=True)

    P = np.column_stack(preds)
    metrics["_overall"] = {
        "microF1": round(float(f1_score(Y[te], P, average="micro", zero_division=0)), 3),
        "vulnerableVsCleanAccuracy": round(float(((Y[te].sum(1) == 0) == (P.sum(1) == 0)).mean()), 3),
        "trainSize": int(len(tr)), "valSize": int(len(va)), "testSize": int(len(te)),
    }
    print("overall", metrics["_overall"], flush=True)

    vocab = [None] * len(vec.vocabulary_)
    for term, i in vec.vocabulary_.items():
        vocab[i] = term
    model.update({
        "version": "sentinel-tfidf-lr-1.1",
        "dataset": f"mwritescode/slither-audited-smart-contracts (all-multilabel, {len(files)} shards, deduplicated)",
        "vocab": vocab,
        "idf": [round(float(x), 4) for x in vec.idf_],
        "metrics": metrics,
    })
    json.dump(model, open(f"{out_dir}/model.json", "w"), separators=(",", ":"))
    print("done", round(time.time() - T0), flush=True)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
