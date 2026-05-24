import "./style.css";

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

//Referencias al DOM
const appContainer = document.getElementById("appContainer");
const list = document.getElementById("list");
const formulario = document.getElementById("formulario");
const taskInput = document.getElementById("taskInput");
const darkModeToggle = document.getElementById("darkModeToggle");
const filterButtons = document.querySelectorAll(".filter-btn");

let tasks = [];

//Dark Mode

/**
 * Aplica o remueve el modo oscuro en el contenedor principal y actualiza
 * el texto del botón toggle. Persiste la preferencia en localStorage.
 * @param {boolean} isDark - true para activar dark mode, false para light mode.
 */
function applyDarkMode(isDark) {
  if (isDark) {
    appContainer.classList.remove("bg-white", "text-zinc-900");
    appContainer.classList.add("bg-black", "text-zinc-200");
    taskInput.classList.remove("text-black", "bg-white")
    taskInput.classList.add("text-zinc-200", "bg-zinc-900")
    darkModeToggle.textContent = "Light";
  } else {
    appContainer.classList.remove("bg-black", "text-zinc-200");
    appContainer.classList.add("bg-white", "text-zinc-900");
    taskInput.classList.add("text-black", "bg-white")
    taskInput.classList.remove("text-zinc-200", "bg-zinc-900")
    darkModeToggle.textContent = "Dark";
  }
  localStorage.setItem("darkMode", JSON.stringify(isDark));
}

/**
 * Lee la preferencia de dark mode guardada en localStorage y la aplica
 * al iniciar la aplicación. Si no existe preferencia previa, aplica dark mode.
 */
function loadDarkMode() {
  const saved = localStorage.getItem("darkMode");
  const isDark = saved !== null ? JSON.parse(saved) : true;
  applyDarkMode(isDark);
}

darkModeToggle.addEventListener("click", () => {
  const isDark = appContainer.classList.contains("bg-black");
  applyDarkMode(!isDark);
});



/**
 * Devuelve el filtro activo guardado en sessionStorage.
 * Si no hay ninguno almacenado, retorna "all" como valor por defecto.
 * @returns {"all"|"pending"|"completed"} El filtro activo.
 */
function getActiveFilter() {
  return sessionStorage.getItem("filter") || "all";
}

/**
 * Guarda el filtro seleccionado en sessionStorage y actualiza visualmente
 * cuál botón de filtro está activo (resaltado).
 * @param {"all"|"pending"|"completed"} filter - El filtro a activar.
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
 * Filtra el array de tareas según el filtro activo en sessionStorage.
 * @returns {Array} Subconjunto de tareas que coinciden con el filtro activo.
 */
function getFilteredTasks() {
  const filter = getActiveFilter();
  if (filter === "completed") return tasks.filter((t) => t.completed);
  if (filter === "pending") return tasks.filter((t) => !t.completed);
  return tasks;
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setActiveFilter(btn.dataset.filter);
    renderTasks();
  });
});

// Render

/**
 * Renderiza en el DOM la lista de tareas aplicando el filtro activo.
 * Cada ítem muestra el título, un botón para cambiar su estado y otro para eliminarlo.
 */
function renderTasks() {
  list.innerHTML = "";
  const filtered = getFilteredTasks();

  filtered.forEach((task) => {
    const li = document.createElement("li");
    li.className =
      "bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-center shadow-lg gap-3";

    // Título con tachado si está completada
    const span = document.createElement("span");
    span.textContent = task.title;
    span.className = task.completed
      ? "line-through text-zinc-500 flex-1 cursor-pointer"
      : "flex-1 cursor-pointer";
    span.addEventListener("click", () => toggleTask(task));

    // Badge de estado clicable
    const statusBtn = document.createElement("button");
    statusBtn.textContent = task.completed ? "Done" : "Pending";
    statusBtn.className =
      "text-xs px-3 py-1 rounded-lg border transition " +
      (task.completed
        ? "border-green-700 text-green-400 hover:bg-green-900"
        : "border-zinc-600 text-zinc-400 hover:bg-zinc-700");
    statusBtn.addEventListener("click", () => toggleTask(task));

    // Botón eliminar
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

// ── API calls ───────────────────────────────────────────────────────────────

/**
 * Obtiene todas las tareas desde la API REST, las guarda en localStorage
 * y dispara el renderizado con el filtro activo.
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
 * Crea una nueva tarea enviándola a la API y recarga la lista.
 * Valida que el campo de texto no esté vacío antes de hacer la petición.
 * @param {Event} event - El evento submit del formulario.
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
 * Elimina una tarea por su ID haciendo una petición DELETE a la API
 * y recarga la lista.
 * @param {number|string} id - El ID de la tarea a eliminar.
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
 * Alterna el estado completed/pending de una tarea haciendo un PUT a la API
 * con el estado invertido y recarga la lista.
 * @param {Object} task - El objeto tarea cuyo estado se quiere cambiar.
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


formulario.addEventListener("submit", addTask);
loadDarkMode();
setActiveFilter(getActiveFilter());
getTasks();