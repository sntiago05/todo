import "./style.css";

/**
 * @fileoverview Task List Application
 * A simple task manager built with Vanilla JS + Tailwind CSS.
 * Communicates with a local REST API (json-server) at http://localhost:3000/todos.
 * Supports dark/light mode, task filtering, and full CRUD operations.
 */

// ── Inject HTML template 

document.querySelector("#app").innerHTML = `
<div id="appContainer" class="min-h-screen bg-black text-zinc-200 flex flex-col items-center p-10 transition-colors duration-300">
  <div class="w-full max-w-lg flex justify-between items-center mb-8">
    <h1 class="text-5xl font-bold text-red-900">Task List</h1>
    <button id="darkModeToggle" class="px-4 py-2 rounded-xl border border-zinc-700 hover:border-red-900 transition text-sm">
      🌙 Dark
    </button>
  </div>
  <form id="formulario" class="flex gap-4 mb-6 w-full max-w-lg">
    <input
      type="text"
      id="taskInput"
      placeholder="Write a task..."
      class="bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-3 outline-none text-zinc-200 w-full focus:border-red-900 transition"
    >
    <button
      type="submit"
      class="bg-red-900 px-5 py-3 rounded-xl hover:bg-zinc-700 transition text-white"
    >
      Add
    </button>
  </form>

  <div class="flex gap-3 mb-8">
    <button data-filter="all"       class="filter-btn active-filter px-4 py-2 rounded-xl text-sm border border-zinc-700 hover:border-red-900 transition">All</button>
    <button data-filter="pending"   class="filter-btn px-4 py-2 rounded-xl text-sm border border-zinc-700 hover:border-red-900 transition">Pending</button>
    <button data-filter="completed" class="filter-btn px-4 py-2 rounded-xl text-sm border border-zinc-700 hover:border-red-900 transition">Completed</button>
  </div>

  <ul id="list" class="flex flex-col gap-4 w-full max-w-lg"></ul>
</div>
`;

// ── DOM References 

/** @type {HTMLElement} Main wrapper — theme classes are toggled on this element. */
const appContainer = document.getElementById("appContainer");

/** @type {HTMLUListElement} Container where task <li> elements are rendered. */
const list = document.getElementById("list");

/** @type {HTMLFormElement} Form that captures new task submissions. */
const formulario = document.getElementById("formulario");

/** @type {HTMLInputElement} Text field where the user types a new task title. */
const taskInput = document.getElementById("taskInput");

/** @type {HTMLButtonElement} Button that toggles between dark and light mode. */
const darkModeToggle = document.getElementById("darkModeToggle");

/** @type {NodeList} All three filter buttons (All / Pending / Completed). */
const filterButtons = document.querySelectorAll(".filter-btn");

/** @type {Array<{id: number, title: string, completed: boolean}>} In-memory task array, synced from the API on every mutation. */
let tasks = [];

// ── Dark Mode

/**
 * Applies or removes dark mode on the main container and updates the
 * toggle button label. The preference is persisted in localStorage so
 * it survives page reloads.
 *
 * @param {boolean} isDark - Pass `true` to enable dark mode, `false` for light mode.
 */
function applyDarkMode(isDark) {
  if (isDark) {
    appContainer.classList.remove("bg-white", "text-zinc-900");
    appContainer.classList.add("bg-black", "text-zinc-200");
    taskInput.classList.remove("text-black", "bg-white");
    taskInput.classList.add("text-zinc-200", "bg-zinc-900");
    darkModeToggle.textContent = "Light";
  } else {
    appContainer.classList.remove("bg-black", "text-zinc-200");
    appContainer.classList.add("bg-white", "text-zinc-900");
    taskInput.classList.add("text-black", "bg-white");
    taskInput.classList.remove("text-zinc-200", "bg-zinc-900");
    darkModeToggle.textContent = "Dark";
  }
  localStorage.setItem("darkMode", JSON.stringify(isDark));
}

/**
 * Reads the dark-mode preference stored in localStorage and applies it
 * when the app initialises. Defaults to dark mode if no preference exists.
 */
function loadDarkMode() {
  const saved = localStorage.getItem("darkMode");
  const isDark = saved !== null ? JSON.parse(saved) : true;
  applyDarkMode(isDark);
}

// Toggle dark/light mode when the button is clicked.
darkModeToggle.addEventListener("click", () => {
  const isDark = appContainer.classList.contains("bg-black");
  applyDarkMode(!isDark);
});

// ── Filter Logic 

/**
 * Returns the currently active filter stored in sessionStorage.
 * Falls back to `"all"` when nothing has been saved yet.
 *
 * @returns {"all"|"pending"|"completed"} The active filter value.
 */
function getActiveFilter() {
  return sessionStorage.getItem("filter") || "all";
}

/**
 * Persists the selected filter in sessionStorage and visually highlights
 * the corresponding filter button with the `active-filter` CSS class.
 *
 * @param {"all"|"pending"|"completed"} filter - The filter to activate.
 */
function setActiveFilter(filter) {
  sessionStorage.setItem("filter", filter);
  filterButtons.forEach((btn) => {
    if (btn.dataset.filter === filter) {
      btn.classList.add("active-filter");
    } else {
      btn.classList.remove("active-filter");
    }
  });
}

/**
 * Returns a subset of the `tasks` array based on the currently active filter.
 * - `"all"`       → returns every task
 * - `"completed"` → returns only tasks where `completed === true`
 * - `"pending"`   → returns only tasks where `completed === false`
 *
 * @returns {Array<{id: number, title: string, completed: boolean}>} Filtered task list.
 */
function getFilteredTasks() {
  const filter = getActiveFilter();
  if (filter === "completed") return tasks.filter((t) => t.completed);
  if (filter === "pending") return tasks.filter((t) => !t.completed);
  return tasks;
}

// Attach click handlers to each filter button.
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setActiveFilter(btn.dataset.filter);
    renderTasks();
  });
});

// ── Render

/**
 * Renders the task list in the DOM according to the active filter.
 *
 * For each matching task it creates a `<li>` element containing:
 * - A `<span>` with the task title (struck-through when completed).
 * - A status badge button ("Done" / "Pending") that toggles the task.
 * - A delete button (🗑) that removes the task via the API.
 *
 * Clicking the title span or the status badge calls `toggleTask()`.
 * Clicking the delete button calls `deleteTask()`.
 */
function renderTasks() {
  list.innerHTML = "";
  const filtered = getFilteredTasks();

  filtered.forEach((task) => {
    const li = document.createElement("li");
    li.className =
      "bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-center shadow-lg gap-3";

    // Title — struck-through when the task is completed.
    const span = document.createElement("span");
    span.textContent = task.title;
    span.className = task.completed
      ? "line-through text-zinc-500 flex-1 cursor-pointer"
      : "flex-1 cursor-pointer";
    span.addEventListener("click", () => toggleTask(task));

    // Status badge — shows current state and acts as a toggle.
    const statusBtn = document.createElement("button");
    statusBtn.textContent = task.completed ? "Done" : "Pending";
    statusBtn.className =
      "text-xs px-3 py-1 rounded-lg border transition " +
      (task.completed
        ? "border-green-700 text-green-400 hover:bg-green-900"
        : "border-zinc-600 text-zinc-400 hover:bg-zinc-700");
    statusBtn.addEventListener("click", () => toggleTask(task));

    // Delete button — sends a DELETE request and refreshes the list.
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "🗑";
    deleteButton.className =
      "bg-zinc-700 px-3 py-2 rounded-lg hover:bg-red-900 transition text-white text-sm";
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(span);
    li.appendChild(statusBtn);
    li.appendChild(deleteButton);
    list.appendChild(li);
  });
}

// ── API Calls 

/**
 * Fetches all tasks from the REST API and refreshes the UI.
 *
 * - Sends a GET request to `http://localhost:3000/todos`.
 * - Updates the in-memory `tasks` array.
 * - Caches the result in localStorage under the key `"tasks"`.
 * - Triggers `renderTasks()` to reflect the latest data.
 *
 * @async
 * @returns {Promise<void>}
 */
async function getTasks() {
  try {
    const response = await fetch("http://localhost:3000/todos");
    tasks = await response.json();
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
  } catch (error) {
    console.log(error);
  }
}

/**
 * Creates a new task by posting it to the REST API, then reloads the list.
 *
 * - Reads and trims the value from `taskInput`.
 * - Alerts the user and aborts if the input is empty.
 * - Sends a POST request to `http://localhost:3000/todos` with the new task payload.
 * - Clears the input field and calls `getTasks()` on success.
 *
 * @async
 * @param {SubmitEvent} event - The form's `submit` event (used to call `preventDefault()`).
 * @returns {Promise<void>}
 */
async function addTask(event) {
  event.preventDefault();
  const newTask = taskInput.value.trim();
  if (!newTask) {
    alert("Write a task");
    return;
  }
  try {
    await fetch("http://localhost:3000/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask, completed: false }),
    });
    taskInput.value = "";
    getTasks();
  } catch (error) {
    console.log(error);
  }
}

/**
 * Deletes a task by its ID via a DELETE request and refreshes the list.
 *
 * - Sends a DELETE request to `http://localhost:3000/todos/:id`.
 * - Calls `getTasks()` on success to sync the UI with the server.
 *
 * @async
 * @param {number|string} id - The unique ID of the task to delete.
 * @returns {Promise<void>}
 */
async function deleteTask(id) {
  try {
    await fetch(`http://localhost:3000/todos/${id}`, { method: "DELETE" });
    getTasks();
  } catch (error) {
    console.log(error);
  }
}

/**
 * Toggles the `completed` status of a task via a PUT request and refreshes the list.
 *
 * - Spreads the existing task object and flips its `completed` boolean.
 * - Sends a PUT request to `http://localhost:3000/todos/:id` with the updated payload.
 * - Calls `getTasks()` on success to sync the UI with the server.
 *
 * @async
 * @param {{id: number, title: string, completed: boolean}} task - The task object to toggle.
 * @returns {Promise<void>}
 */
async function toggleTask(task) {
  try {
    await fetch(`http://localhost:3000/todos/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...task, completed: !task.completed }),
    });
    getTasks();
  } catch (error) {
    console.log(error);
  }
}

// ── Initialisation

// Register the form submit handler.
formulario.addEventListener("submit", addTask);

// Apply the stored dark/light preference (or default to dark).
loadDarkMode();

// Highlight the active filter button (or default to "all").
setActiveFilter(getActiveFilter());

// Load tasks from the API and render them.
getTasks();