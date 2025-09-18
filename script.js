(() => {
  const TZ = "Asia/Kolkata";
  const $ = (sel, el = document) => el.querySelector(sel);
  const API_BASE = "https://adityashetty35.pythonanywhere.com/todos/";

  function escapeHTML(str) {
    return str.replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m])
    );
  }

  function formatISTStamp(isoString) {
    const d = isoString ? new Date(isoString) : new Date();
    const time = new Intl.DateTimeFormat("en-IN", {
      timeZone: TZ,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .format(d)
      .toUpperCase();
    const date = new Intl.DateTimeFormat("en-IN", {
      timeZone: TZ,
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
    return `Added ${time} · ${date} IST`;
  }

  const clockEl = $("#clock");
  const dateEl = $("#dateLine");
  function tick() {
    const parts = new Intl.DateTimeFormat("en-IN", {
      timeZone: TZ,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(new Date());
    const hh = parts.find((p) => p.type === "hour")?.value ?? "";
    const mm = parts.find((p) => p.type === "minute")?.value ?? "";
    const ap = (
      parts.find((p) => p.type === "dayPeriod")?.value ?? ""
    ).toUpperCase();
    clockEl.textContent = `${hh}:${mm} ${ap}`;
    dateEl.textContent = new Intl.DateTimeFormat("en-IN", {
      timeZone: TZ,
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date());
  }
  tick();
  setInterval(tick, 1000);

  // Theme toggle code (same as before)
  const themeBtn = $("#themeBtn");
  function themeIcon(theme) {
    if (theme === "dark") {
      return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.64 13A9 9 0 0 1 11 2.36 9 9 0 1 0 21.64 13z"></path></svg>`;
    }
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>`;
  }
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("clock-ist-theme", theme);
    themeBtn.innerHTML = themeIcon(theme);
    themeBtn.setAttribute("aria-pressed", theme === "dark");
    themeBtn.title = theme === "dark" ? "Switch to light" : "Switch to dark";
  }
  const savedTheme = localStorage.getItem("clock-ist-theme");
  const prefersDark = matchMedia?.("(prefers-color-scheme: dark)").matches;
  setTheme(savedTheme ?? (prefersDark ? "dark" : "light"));
  themeBtn.addEventListener("click", () => {
    const next =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    setTheme(next);
  });

  // Task management
  const listEl = $("#taskList");
  const inputEl = $("#taskInput");
  const addBtn = $("#addBtn");

  let tasks = [];

  async function fetchTasks() {
    try {
      const res = await fetch(API_BASE);
      tasks = await res.json();
      render();
    } catch (e) {
      console.error("Error fetching tasks:", e);
    }
  }

  async function addTask() {
    const text = inputEl.value.trim();
    if (!text) {
      inputEl.focus();
      return;
    }
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text }),
      });
      const todo = await res.json();
      tasks.unshift(todo);
      render();
      inputEl.value = "";
      inputEl.focus();
    } catch (e) {
      console.error("Error adding task:", e);
    }
  }

  async function updateTask(task) {
    try {
      await fetch(`${API_BASE}${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: task.completed }),
      });
      render();
    } catch (e) {
      console.error("Error updating task:", e);
    }
  }

  async function deleteTask(task) {
    try {
      await fetch(`${API_BASE}${task.id}`, { method: "DELETE" });
      tasks = tasks.filter((t) => t.id !== task.id);
      render();
    } catch (e) {
      console.error("Error deleting task:", e);
    }
  }

  function render() {
    listEl.innerHTML = "";
    const active = tasks
      .filter((t) => !t.completed)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const done = tasks
      .filter((t) => t.completed)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const ordered = [...active, ...done];

    ordered.forEach((t) => {
      const li = document.createElement("li");
      li.className = "task" + (t.completed ? " completed" : "");
      li.innerHTML = `
        <input type="checkbox" ${
          t.completed ? "checked" : ""
        } aria-label="Mark complete">
        <div>
          <div class="title">${escapeHTML(t.description)}</div>
          <small>${formatISTStamp(t.created_at)}</small>
        </div>
        <button class="delete-btn" aria-label="Delete task">&times;</button>
      `;
      const box = li.querySelector("input");
      box.addEventListener("change", () => {
        t.completed = box.checked;
        updateTask(t);
      });

      const delBtn = li.querySelector(".delete-btn");
      delBtn.addEventListener("click", () => deleteTask(t));

      listEl.appendChild(li);
    });
  }

  addBtn.addEventListener("click", addTask);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });

  fetchTasks(); // Initial load
})();

// SHA-256 function
async function hashString(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Precomputed hash of "0069"
const PASSWORD_HASH =
  "b9496b78de9917a6b216f92a7d03419d93269dc26280a72173c5a7f93cf0da1b";

const overlay = document.getElementById("passcodeOverlay");
const input = document.getElementById("passcodeInput");
const submit = document.getElementById("passcodeSubmit");
const error = document.getElementById("passcodeError");

async function checkPasscode() {
  const hashed = await hashString(input.value);
  if (hashed === PASSWORD_HASH) {
    overlay.style.display = "none"; // unlock app
  } else {
    error.textContent = "Incorrect passcode!";
    input.value = "";
    input.focus();
  }
}

submit.addEventListener("click", checkPasscode);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkPasscode();
});
