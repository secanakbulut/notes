// notes app, localstorage backed.

const STORAGE_KEY = "notes.v1";

let notes = load();
let currentId = notes.length ? notes[0].id : null;
let query = "";

const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const listEl = document.getElementById("noteList");
const newBtn = document.getElementById("newBtn");
const delBtn = document.getElementById("deleteBtn");
const status = document.getElementById("status");
const searchBox = document.getElementById("searchBox");
const searchHint = document.getElementById("searchHint");

if (window.marked) {
  marked.setOptions({ breaks: true, gfm: true });
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn("could not parse notes", e);
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getCurrent() {
  return notes.find(n => n.id === currentId) || null;
}

function titleOf(note) {
  if (!note || !note.body) return "untitled";
  const lines = note.body.split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    return t.replace(/^#+\s*/, "").slice(0, 60) || "untitled";
  }
  return "untitled";
}

function renderPreview() {
  const cur = getCurrent();
  if (!cur) {
    preview.innerHTML = "";
    return;
  }
  if (window.marked) {
    preview.innerHTML = marked.parse(cur.body || "");
  } else {
    preview.textContent = cur.body || "";
  }
}

function renderList() {
  listEl.innerHTML = "";

  let view;
  if (query.trim()) {
    const ranked = window.tfidfSearch(query, notes);
    view = ranked.map(r => ({ note: notes.find(n => n.id === r.id), score: r.score }));
    searchHint.textContent = view.length
      ? "showing " + view.length + " of " + notes.length + " by tf-idf score"
      : "no matches";
  } else {
    view = notes.map(n => ({ note: n, score: null }));
    searchHint.textContent = "results ranked by tf-idf";
  }

  for (const { note: n, score } of view) {
    if (!n) continue;
    const li = document.createElement("li");
    if (n.id === currentId) li.classList.add("active");

    const t = document.createElement("span");
    t.className = "title";
    t.textContent = titleOf(n);
    li.appendChild(t);

    if (score !== null) {
      const s = document.createElement("span");
      s.className = "score";
      s.textContent = score.toFixed(3);
      li.appendChild(s);
    }

    li.addEventListener("click", () => {
      currentId = n.id;
      const cur = getCurrent();
      editor.value = cur ? cur.body : "";
      renderList();
      renderPreview();
    });

    listEl.appendChild(li);
  }

  status.textContent = notes.length + " notes";
}

function renderAll() {
  const cur = getCurrent();
  editor.value = cur ? cur.body : "";
  renderList();
  renderPreview();
}

newBtn.addEventListener("click", () => {
  const note = { id: uid(), body: "", updated: Date.now() };
  notes.unshift(note);
  currentId = note.id;
  save();
  renderAll();
  editor.focus();
});

delBtn.addEventListener("click", () => {
  if (!currentId) return;
  notes = notes.filter(n => n.id !== currentId);
  currentId = notes.length ? notes[0].id : null;
  save();
  renderAll();
});

editor.addEventListener("input", () => {
  const cur = getCurrent();
  if (!cur) return;
  cur.body = editor.value;
  cur.updated = Date.now();
  save();
  renderList();
  renderPreview();
});

searchBox.addEventListener("input", (e) => {
  query = e.target.value;
  renderList();
});

// cmd/ctrl + n for a new note
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "n") {
    e.preventDefault();
    newBtn.click();
  }
});

renderAll();
