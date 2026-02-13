// tf-idf search.
//
// tf  = (count of term in note) / (total terms in note)
// idf = log( total notes / number of notes containing term )
// score = sum over query terms of tf * idf
//
// terms not present in any doc just contribute 0 (no divide by zero).
// short tokens get dropped, very common english words are ignored.

const STOP = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","is","are",
  "was","were","be","been","being","it","this","that","with","as","at",
  "by","from","i","you","he","she","we","they","me","my","your","our"
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[`*_>#~\[\]\(\)!]/g, " ")  // strip the obvious markdown bits
    .split(/[^a-z0-9]+/)
    .filter(t => t && t.length > 1 && !STOP.has(t));
}

function termCounts(tokens) {
  const c = Object.create(null);
  for (const t of tokens) c[t] = (c[t] || 0) + 1;
  return c;
}

// build a small index from the live notes array.
function buildIndex(notes) {
  const docs = notes.map(n => {
    const toks = tokenize(n.body || "");
    return { id: n.id, tokens: toks, total: toks.length, counts: termCounts(toks) };
  });

  // df = number of docs containing each term
  const df = Object.create(null);
  for (const d of docs) {
    for (const t of Object.keys(d.counts)) {
      df[t] = (df[t] || 0) + 1;
    }
  }
  return { docs, df, N: docs.length };
}

function idf(term, idx) {
  const n = idx.df[term] || 0;
  if (n === 0) return 0;
  // smooth a tiny bit so a term that is in every doc is not a flat 0
  return Math.log((idx.N + 1) / (n + 1)) + 0.0001;
}

function scoreQuery(query, notes) {
  const qTokens = tokenize(query);
  if (!qTokens.length) return [];
  const idx = buildIndex(notes);

  const out = [];
  for (const d of idx.docs) {
    if (d.total === 0) continue;
    let s = 0;
    for (const qt of qTokens) {
      const tf = (d.counts[qt] || 0) / d.total;
      if (tf === 0) continue;
      s += tf * idf(qt, idx);
    }
    if (s > 0) out.push({ id: d.id, score: s });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

window.tfidfSearch = scoreQuery;
