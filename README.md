# Task List App

A minimal task manager built with **Vanilla JavaScript**, **Vite**, and **Tailwind CSS v4**. It communicates with a local REST API powered by **json-server** and supports dark/light mode, task filtering, and full CRUD operations.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Bundler | [Vite](https://vitejs.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Mock API | [json-server](https://github.com/typicode/json-server) |
| Language | Vanilla JavaScript (ES Modules) |

---

## Project Structure

```
├── index.html          # Entry point — mounts the #app div
├── src/
│   ├── main.js         # All application logic (see below)
│   └── style.css       # Tailwind import + .active-filter custom class
├── db.json             # json-server database (auto-created on first run)
└── package.json
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the mock API

```bash
npm run server
```

This serves a REST API at `http://localhost:3000/todos`. Create a `db.json` file if it does not exist yet:

```json
{
  "todos": []
}
```

### 3. Start the dev server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Features

- **Add tasks** — type in the input and press *Add* or hit Enter.
- **Toggle status** — click the task title or the status badge to switch between *Pending* and *Done*.
- **Delete tasks** — click the 🗑 button to permanently remove a task.
- **Filter tasks** — use the *All / Pending / Completed* buttons to narrow the list. The active filter persists across page navigations (sessionStorage).
- **Dark / Light mode** — click the toggle button in the top-right corner. The preference persists across browser sessions (localStorage).

---

## Code Overview (`src/main.js`)

### State

| Variable | Type | Purpose |
|---|---|---|
| `tasks` | `Array` | In-memory copy of all tasks, synced from the API after every mutation. |

---

### Dark Mode

#### `applyDarkMode(isDark)`
Swaps Tailwind colour classes on `#appContainer` and `#taskInput` to switch the palette. Updates the toggle button label and saves the preference to `localStorage`.

#### `loadDarkMode()`
Called once at startup. Reads `localStorage` and calls `applyDarkMode()` with the saved value. Defaults to dark mode when no preference exists.

---

### Filter System

The filter state lives in `sessionStorage` (key: `"filter"`), so it resets when the browser tab is closed but survives page reloads within the same session.

#### `getActiveFilter()`
Returns the current filter string (`"all"`, `"pending"`, or `"completed"`). Falls back to `"all"`.

#### `setActiveFilter(filter)`
Saves the chosen filter to `sessionStorage` and updates the button styles so only the active button is highlighted.

#### `getFilteredTasks()`
Returns a subset of the `tasks` array matching the active filter. Used by `renderTasks()` before building the DOM list.

---

### Rendering

#### `renderTasks()`
Clears `#list` and rebuilds it from the filtered task array. Each `<li>` contains:

- **Title span** — struck-through when `completed === true`. Clicking it calls `toggleTask()`.
- **Status badge button** — shows `"Done"` or `"Pending"` with matching colours. Clicking it also calls `toggleTask()`.
- **Delete button (🗑)** — calls `deleteTask(id)` to remove the task.

---

### API Calls

All API functions are `async` and communicate with `http://localhost:3000/todos`.

#### `getTasks()`
`GET /todos` — Fetches the full task list, stores it in `tasks` and in `localStorage`, then calls `renderTasks()`.

#### `addTask(event)`
`POST /todos` — Reads and validates the input field, sends the new task to the API, clears the input, and calls `getTasks()` to refresh the list.

#### `deleteTask(id)`
`DELETE /todos/:id` — Sends a DELETE request for the given task ID, then calls `getTasks()`.

#### `toggleTask(task)`
`PUT /todos/:id` — Sends the full task object back with `completed` flipped to its opposite value, then calls `getTasks()`.

---

### Initialisation (bottom of file)

```js
formulario.addEventListener("submit", addTask); // Wire up the form
loadDarkMode();                                  // Apply stored theme
setActiveFilter(getActiveFilter());              // Highlight active filter button
getTasks();                                      // Load data from API
```

These four lines run once when the module is first imported by Vite.

---

## localStorage vs sessionStorage

| Storage | Key | Value | Lifetime |
|---|---|---|---|
| `localStorage` | `"darkMode"` | `true` / `false` | Persists until manually cleared |
| `localStorage` | `"tasks"` | JSON array | Cache — overwritten on every `getTasks()` call |
| `sessionStorage` | `"filter"` | `"all"` / `"pending"` / `"completed"` | Lives for the browser tab session |

---

## Custom CSS (`src/style.css`)

```css
@import "tailwindcss";

.active-filter {
  border-color: #7f1d1d;   /* red-900 border */
  color: #fca5a5;           /* red-300 text   */
  background-color: #1c0a0a;
}
```

The `.active-filter` class is toggled by `setActiveFilter()` to highlight the currently selected filter button.
