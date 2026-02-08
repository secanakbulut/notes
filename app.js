// notes app, localstorage backed.
// first commit: just create / edit / delete and persist.

const STORAGE_KEY = "notes.v1";

let notes = load();
let currentId = notes.length ? notes[0].id : null;

const editor = document.getElementById("editor");
const listEl = document.getElementById("noteList");
const newBtn = document.getElementById("newBtn");
const delBtn = document.getElementById("deleteBtn");
const status = document.getElementById("status");

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

function render() {
  listEl.innerHTML = "";
  for (const n of notes) {
    const li = document.createElement("li");
    if (n.id === currentId) li.classList.add("active");

    const t = document.createElement("span");
    t.className = "title";
    t.textContent = titleOf(n);
    li.appendChild(t);

    li.addEventListener("click", () => {
      currentId = n.id;
      const cur = getCurrent();
      editor.value = cur ? cur.body : "";
      render();
    });

    listEl.appendChild(li);
  }

  const cur = getCurrent();
  editor.value = cur ? cur.body : "";
  status.textContent = notes.length + " notes";
}

newBtn.addEventListener("click", () => {
  const note = { id: uid(), body: "", updated: Date.now() };
  notes.unshift(note);
  currentId = note.id;
  save();
  render();
  editor.focus();
});

delBtn.addEventListener("click", () => {
  if (!currentId) return;
  notes = notes.filter(n => n.id !== currentId);
  currentId = notes.length ? notes[0].id : null;
  save();
  render();
});

editor.addEventListener("input", () => {
  const cur = getCurrent();
  if (!cur) return;
  cur.body = editor.value;
  cur.updated = Date.now();
  save();
  // re-render only the title for this item, simpler to just re-render the list
  render();
  // keep focus + cursor position
  editor.focus();
});

render();
