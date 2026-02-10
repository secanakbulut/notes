// notes app, localstorage backed.

const STORAGE_KEY = "notes.v1";

let notes = load();
let currentId = notes.length ? notes[0].id : null;

const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const listEl = document.getElementById("noteList");
const newBtn = document.getElementById("newBtn");
const delBtn = document.getElementById("deleteBtn");
const status = document.getElementById("status");

// safer-ish render config. marked already escapes by default.
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
    // fallback if cdn fails
    preview.textContent = cur.body || "";
  }
}

function renderList() {
  listEl.innerHTML = "";
  for (const n of notes) {
    const li = document.createElement("li");
    if (n.id === currentId) li.classList.add("active");
    li.textContent = titleOf(n);
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

renderAll();
