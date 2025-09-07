document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const welcomePopup = document.getElementById("welcomePopup");
  const userNameInput = document.getElementById("userNameInput");
  const startBtn = document.getElementById("startBtn");
  const userLogo = document.getElementById("userLogo");
  const userName = document.getElementById("userName");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const themeSwitcher = document.getElementById("themeSwitcher");
  const themeIcon = document.getElementById("themeIcon");
  const navBtns = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");
  const resetBtn = document.getElementById("resetBtn");
  const taskTitle = document.getElementById("taskTitle");
  const taskDate = document.getElementById("taskDate");
  const taskTime = document.getElementById("taskTime");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const tasksContainer = document.getElementById("tasksContainer");
  const historyContainer = document.getElementById("historyContainer");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const editPopup = document.getElementById("editPopup");
  const editTaskTitle = document.getElementById("editTaskTitle");
  const editTaskDate = document.getElementById("editTaskDate");
  const editTaskTime = document.getElementById("editTaskTime");
  const editTaskId = document.getElementById("editTaskId");
  const saveEditBtn = document.getElementById("saveEditBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const notificationPermission = document.getElementById(
    "notificationPermission"
  );
  const enableNotifications = document.getElementById("enableNotifications");
  const dismissNotification = document.getElementById("dismissNotification");

  // Helper function to get local date string in YYYY-MM-DD format
  function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Set today's date as default for the date input
  taskDate.value = getLocalDateString();

  // Check if user exists in localStorage
  let user = JSON.parse(localStorage.getItem("user")) || null;
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let history = JSON.parse(localStorage.getItem("history")) || [];

  // Template tasks for daily recurrence
  let templateTasks = JSON.parse(localStorage.getItem("templateTasks")) || [];

  // Notification timeouts and intervals
  let notificationTimeouts = {};
  let notificationIntervals = {};

  // Theme cycle: system -> light -> dark
  const themeCycle = ["system", "light", "dark"];
  let currentThemeIndex = 0;

  // Initialize the app
  initApp();

  // Event Listeners
  startBtn.addEventListener("click", startApp);
  saveProfileBtn.addEventListener("click", saveProfile);
  themeSwitcher.addEventListener("click", toggleTheme);
  resetBtn.addEventListener("click", resetApp);
  addTaskBtn.addEventListener("click", addTask);
  saveEditBtn.addEventListener("click", saveEditedTask);
  cancelEditBtn.addEventListener("click", closeEditPopup);
  enableNotifications.addEventListener("click", requestNotificationPermission);
  dismissNotification.addEventListener("click", dismissNotificationPermission);

  // Add event delegation for task actions
  tasksContainer.addEventListener("click", function (e) {
    // Use event delegation to handle dynamically created buttons
    const target = e.target;
    const taskElement = target.closest(".task-item");

    if (!taskElement) return;

    const taskId = parseInt(taskElement.dataset.id);

    if (target.classList.contains("complete-btn")) {
      completeTask(taskId);
    } else if (target.classList.contains("edit-btn")) {
      openEditPopup(taskId);
    } else if (target.classList.contains("delete-btn")) {
      deleteTask(taskId);
    }
  });

  navBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const sectionId = this.getAttribute("data-section");

      // Update active button
      navBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      // Show active section
      sections.forEach((section) => section.classList.remove("active"));
      document.getElementById(sectionId).classList.add("active");
    });
  });

  // Functions
  function initApp() {
    // Check if it's a new day and update tasks
    checkNewDay();

    // Show welcome popup if no user data
    if (!user) {
      welcomePopup.style.display = "flex";
    } else {
      welcomePopup.style.display = "none";
      userLogo.textContent = user.name.charAt(0).toUpperCase();
      userName.value = user.name;
    }

    // Initialize theme
    const savedTheme = localStorage.getItem("theme") || "system";
    document.documentElement.setAttribute("data-theme", savedTheme);
    currentThemeIndex = themeCycle.indexOf(savedTheme);
    updateThemeIcon(savedTheme);

    // Check notification permission
    checkNotificationPermission();

    // Load tasks and history
    renderTasks();
    renderHistory();
    updateDailyProgress();

    // Schedule notifications for existing tasks
    scheduleAllNotifications();
  }

  function startApp() {
    const name = userNameInput.value.trim();
    if (name) {
      user = { name };
      localStorage.setItem("user", JSON.stringify(user));
      userLogo.textContent = name.charAt(0).toUpperCase();
      welcomePopup.style.display = "none";

      // Check notification permission after user starts
      checkNotificationPermission();
    } else {
      alert("Please enter your name to continue");
    }
  }

  function saveProfile() {
    if (user) {
      user.name = userName.value;
      localStorage.setItem("user", JSON.stringify(user));
      userLogo.textContent = user.name.charAt(0).toUpperCase();
      alert("Profile saved successfully!");
    }
  }

  function toggleTheme() {
    // Cycle through themes
    currentThemeIndex = (currentThemeIndex + 1) % themeCycle.length;
    const newTheme = themeCycle[currentThemeIndex];

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    if (theme === "system") {
      themeIcon.className = "fas fa-desktop";
    } else if (theme === "light") {
      themeIcon.className = "fas fa-sun";
    } else {
      themeIcon.className = "fas fa-moon";
    }
  }

  function resetApp() {
    if (
      confirm("Are you sure you want to reset all data? This cannot be undone.")
    ) {
      localStorage.clear();
      user = null;
      tasks = [];
      history = [];
      templateTasks = [];

      // Clear all notifications
      for (let id in notificationTimeouts) {
        clearTimeout(notificationTimeouts[id]);
      }
      for (let id in notificationIntervals) {
        clearInterval(notificationIntervals[id]);
      }
      notificationTimeouts = {};
      notificationIntervals = {};

      userLogo.textContent = "U";
      welcomePopup.style.display = "flex";
      renderTasks();
      renderHistory();
      updateDailyProgress();
    }
  }

  function addTask() {
    const title = taskTitle.value.trim();
    const date = taskDate.value;
    const time = taskTime.value;

    if (title && date && time) {
      const task = {
        id: Date.now(),
        title,
        date,
        time,
        completed: false,
      };

      tasks.push(task);
      localStorage.setItem("tasks", JSON.stringify(tasks));

      // Check if template already exists for this task
      const existingTemplate = templateTasks.find(
        (t) => t.title === title && t.time === time
      );

      if (!existingTemplate) {
        templateTasks.push({
          title,
          time,
        });
        localStorage.setItem("templateTasks", JSON.stringify(templateTasks));
      }

      taskTitle.value = "";
      taskTime.value = "";

      renderTasks();
      updateDailyProgress();
      scheduleNotification(task);
    } else {
      alert("Please fill all task fields");
    }
  }

  function renderTasks() {
    tasksContainer.innerHTML = "";

    // Get today's date in YYYY-MM-DD format
    const today = getLocalDateString();

    // Filter tasks for today
    const todayTasks = tasks.filter((task) => task.date === today);
    const uncompletedTasks = todayTasks.filter((task) => !task.completed);

    if (todayTasks.length === 0) {
      // No tasks at all for today
      tasksContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-tasks"></i>
                            <p>No tasks for today. Add a task to get started!</p>
                        </div>
                    `;
    } else if (uncompletedTasks.length === 0) {
      // All tasks completed for today
      tasksContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-check-circle"></i>
                            <p>All tasks completed for today! Great job!</p>
                        </div>
                    `;
    } else {
      // Show uncompleted tasks
      uncompletedTasks.forEach((task) => {
        const taskElement = document.createElement("div");
        taskElement.className = "task-item";
        taskElement.dataset.id = task.id;
        taskElement.innerHTML = `
                            <div class="task-info">
                                <div class="task-title">${task.title}</div>
                                <div class="task-time">${formatDate(
                                  task.date
                                )} at ${task.time}</div>
                            </div>
                            <div class="task-actions">
                                <button class="btn-success complete-btn" data-id="${
                                  task.id
                                }">Complete</button>
                                <button class="btn-warning edit-btn" data-id="${
                                  task.id
                                }">Edit</button>
                                <button class="btn-danger delete-btn" data-id="${
                                  task.id
                                }">Delete</button>
                            </div>
                        `;
        tasksContainer.appendChild(taskElement);
      });
    }
  }

  function openEditPopup(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      editTaskId.value = task.id;
      editTaskTitle.value = task.title;
      editTaskDate.value = task.date;
      editTaskTime.value = task.time;
      editPopup.style.display = "flex";
    }
  }

  function closeEditPopup() {
    editPopup.style.display = "none";
  }

  function saveEditedTask() {
    const taskId = parseInt(editTaskId.value);
    const title = editTaskTitle.value.trim();
    const date = editTaskDate.value;
    const time = editTaskTime.value;

    if (title && date && time) {
      const taskIndex = tasks.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        // Clear existing notifications for this task
        if (notificationTimeouts[taskId]) {
          clearTimeout(notificationTimeouts[taskId]);
          delete notificationTimeouts[taskId];
        }
        if (notificationIntervals[taskId]) {
          clearInterval(notificationIntervals[taskId]);
          delete notificationIntervals[taskId];
        }

        tasks[taskIndex].title = title;
        tasks[taskIndex].date = date;
        tasks[taskIndex].time = time;

        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks();
        updateDailyProgress();

        // Schedule new notifications for the updated task
        scheduleNotification(tasks[taskIndex]);

        closeEditPopup();
      }
    } else {
      alert("Please fill all task fields");
    }
  }

  function completeTask(taskId) {
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].completed = true;

      // Clear notifications for this task
      if (notificationTimeouts[taskId]) {
        clearTimeout(notificationTimeouts[taskId]);
        delete notificationTimeouts[taskId];
      }
      if (notificationIntervals[taskId]) {
        clearInterval(notificationIntervals[taskId]);
        delete notificationIntervals[taskId];
      }

      // Add to history
      const now = new Date();
      history.push({
        title: tasks[taskIndex].title,
        date: tasks[taskIndex].date,
        completedTime: now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      localStorage.setItem("tasks", JSON.stringify(tasks));
      localStorage.setItem("history", JSON.stringify(history));

      renderTasks();
      renderHistory();
      updateDailyProgress();
    }
  }

  function deleteTask(taskId) {
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      const task = tasks[taskIndex];

      // Remove from template tasks
      templateTasks = templateTasks.filter(
        (t) => !(t.title === task.title && t.time === task.time)
      );
      localStorage.setItem("templateTasks", JSON.stringify(templateTasks));

      // Clear notifications for this task
      if (notificationTimeouts[taskId]) {
        clearTimeout(notificationTimeouts[taskId]);
        delete notificationTimeouts[taskId];
      }
      if (notificationIntervals[taskId]) {
        clearInterval(notificationIntervals[taskId]);
        delete notificationIntervals[taskId];
      }

      tasks = tasks.filter((t) => t.id !== taskId);
      localStorage.setItem("tasks", JSON.stringify(tasks));
      renderTasks();
      updateDailyProgress();
    }
  }

  function renderHistory() {
    historyContainer.innerHTML = "";

    if (history.length === 0) {
      historyContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-history"></i>
                            <p>No completed tasks yet.</p>
                        </div>
                    `;
      return;
    }

    // Group history by date
    const historyByDate = {};
    history.forEach((item) => {
      if (!historyByDate[item.date]) {
        historyByDate[item.date] = [];
      }
      historyByDate[item.date].push(item);
    });

    // Display history
    for (const date in historyByDate) {
      const dateElement = document.createElement("div");
      dateElement.className = "history-item";

      let dateHTML = `<div class="history-date">${formatDate(date)}</div>`;

      historyByDate[date].forEach((item) => {
        dateHTML += `
                            <div class="history-task">
                                <span>${item.title}</span>
                                <span>Completed at ${item.completedTime}</span>
                            </div>
                        `;
      });

      dateElement.innerHTML = dateHTML;
      historyContainer.appendChild(dateElement);
    }
  }

  function updateDailyProgress() {
    // Get today's date in YYYY-MM-DD format
    const today = getLocalDateString();

    const completedTasks = tasks.filter(
      (t) => t.completed && t.date === today
    ).length;
    const totalTasks = tasks.filter((t) => t.date === today).length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(
      progress
    )}% completed (${completedTasks}/${totalTasks} tasks)`;
  }

  function checkNewDay() {
    const now = new Date();
    const today = getLocalDateString(now);
    const lastCheck = localStorage.getItem("lastDayCheck");

    if (lastCheck !== today) {
      // It's a new day - add recurring tasks from template
      templateTasks.forEach((template) => {
        // Check if this task already exists for today
        const existingTask = tasks.find(
          (t) =>
            t.title === template.title &&
            t.time === template.time &&
            t.date === today
        );

        if (!existingTask) {
          tasks.push({
            id: Date.now() + Math.floor(Math.random() * 1000), // Ensure unique ID
            title: template.title,
            date: today,
            time: template.time,
            completed: false,
          });
        }
      });

      localStorage.setItem("tasks", JSON.stringify(tasks));
      localStorage.setItem("lastDayCheck", today);
    }
  }

  function formatDate(dateString) {
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString + "T00:00:00").toLocaleDateString(
      undefined,
      options
    );
  }

  function checkNotificationPermission() {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        notificationPermission.style.display = "block";
      }
    }
  }

  function requestNotificationPermission() {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          notificationPermission.style.display = "none";
          // Schedule notifications for existing tasks
          scheduleAllNotifications();
        }
      });
    }
  }

  function dismissNotificationPermission() {
    notificationPermission.style.display = "none";
  }

  function scheduleAllNotifications() {
    if (Notification.permission !== "granted") return;

    // Clear all existing notifications
    for (let id in notificationTimeouts) {
      clearTimeout(notificationTimeouts[id]);
    }
    for (let id in notificationIntervals) {
      clearInterval(notificationIntervals[id]);
    }
    notificationTimeouts = {};
    notificationIntervals = {};

    // Schedule notifications for all uncompleted tasks
    const today = getLocalDateString();
    const todayTasks = tasks.filter(
      (task) => task.date === today && !task.completed
    );

    todayTasks.forEach((task) => {
      scheduleNotification(task);
    });
  }

  function scheduleNotification(task) {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    // Calculate notification time (30 minutes before task time)
    const [hours, minutes] = task.time.split(":").map(Number);
    const taskDateTime = new Date(task.date);
    taskDateTime.setHours(hours, minutes, 0, 0);

    const notifyTime = new Date(taskDateTime.getTime() - 30 * 60000);

    // Don't schedule if the notification time has already passed
    if (notifyTime < new Date()) {
      return;
    }

    const timeUntilNotification = notifyTime - new Date();

    // Schedule the notification
    notificationTimeouts[task.id] = setTimeout(() => {
      // Check if task is not completed
      const currentTask = tasks.find((t) => t.id === task.id);
      if (currentTask && !currentTask.completed) {
        // Show notification
        if (Notification.permission === "granted") {
          new Notification("Task Reminder", {
            body: `Your task "${task.title}" is due in 30 minutes at ${task.time}`,
          });
        }

        // Schedule additional reminders every 2 minutes
        notificationIntervals[task.id] = setInterval(() => {
          const updatedTask = tasks.find((t) => t.id === task.id);
          if (!updatedTask || updatedTask.completed) {
            clearInterval(notificationIntervals[task.id]);
            delete notificationIntervals[task.id];
            return;
          }

          // Check if task time has passed
          const taskTime = new Date(updatedTask.date);
          const [h, m] = updatedTask.time.split(":").map(Number);
          taskTime.setHours(h, m, 0, 0);

          if (taskTime < new Date()) {
            clearInterval(notificationIntervals[task.id]);
            delete notificationIntervals[task.id];
            return;
          }

          if (Notification.permission === "granted") {
            new Notification("Task Reminder", {
              body: `Your task "${task.title}" is due soon! Complete it to stop reminders.`,
            });
          }
        }, 2 * 60 * 1000); // Every 2 minutes
      }
    }, timeUntilNotification);
  }

  // Check for new day every minute
  setInterval(checkNewDay, 60000);
});
