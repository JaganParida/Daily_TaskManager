document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const welcomePopup = document.getElementById("welcomePopup");
  const userNameInput = document.getElementById("userNameInput");
  const startBtn = document.getElementById("startBtn");
  const userLogo = document.getElementById("userLogo");
  const userName = document.getElementById("userName");
  const userEmail = document.getElementById("userEmail");
  const challengeDays = document.getElementById("challengeDays");
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
  const challengeText = document.getElementById("challengeText");
  const progressBar = document.getElementById("progressBar");
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

  // Set today's date as default for the date input
  const today = new Date();
  taskDate.value = today.toISOString().split("T")[0];

  // Check if user exists in localStorage
  let user = JSON.parse(localStorage.getItem("user")) || null;
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let history = JSON.parse(localStorage.getItem("history")) || [];
  let challenge = JSON.parse(localStorage.getItem("challenge")) || {
    startDate: new Date().toISOString(),
    currentDay: 1,
    totalDays: 30,
  };

  // Notification timeouts and intervals
  let notificationTimeouts = {};
  let notificationIntervals = {};

  // Theme cycle: system -> light -> dark
  const themeCycle = ["system", "light", "dark"];
  let currentThemeIndex = 0;

  // Check if it's a new day and update challenge day
  checkNewDay();

  // Show welcome popup if no user data
  if (!user) {
    welcomePopup.style.display = "flex";
  } else {
    welcomePopup.style.display = "none";
    userLogo.textContent = user.name.charAt(0).toUpperCase();
    userName.value = user.name;
    userEmail.value = user.email || "";
    challengeDays.value = challenge.totalDays;
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
  updateChallengeProgress();

  // Schedule notifications for existing tasks
  scheduleAllNotifications();

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
    if (e.target.classList.contains("complete-btn")) {
      const taskId = parseInt(e.target.dataset.id);
      completeTask(taskId);
    } else if (e.target.classList.contains("edit-btn")) {
      const taskId = parseInt(e.target.dataset.id);
      openEditPopup(taskId);
    } else if (e.target.classList.contains("delete-btn")) {
      const taskId = parseInt(e.target.dataset.id);
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
  function startApp() {
    const name = userNameInput.value.trim();
    if (name) {
      user = { name, email: "" };
      localStorage.setItem("user", JSON.stringify(user));
      userLogo.textContent = name.charAt(0).toUpperCase();
      welcomePopup.style.display = "none";

      // Set default challenge if not exists
      if (!localStorage.getItem("challenge")) {
        localStorage.setItem("challenge", JSON.stringify(challenge));
      }

      // Check notification permission after user starts
      checkNotificationPermission();
    }
  }

  function saveProfile() {
    if (user) {
      user.name = userName.value;
      user.email = userEmail.value;
      localStorage.setItem("user", JSON.stringify(user));
      userLogo.textContent = user.name.charAt(0).toUpperCase();

      // Update challenge days if changed
      if (
        challengeDays.value &&
        challengeDays.value >= 7 &&
        challengeDays.value <= 365
      ) {
        challenge.totalDays = parseInt(challengeDays.value);
        localStorage.setItem("challenge", JSON.stringify(challenge));
        updateChallengeProgress();
      }

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
      challenge = {
        startDate: new Date().toISOString(),
        currentDay: 1,
        totalDays: 30,
      };

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
      updateChallengeProgress();
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
        isDaily: tasks.length === 0, // First task becomes daily
        dayNumber: challenge.currentDay,
      };

      tasks.push(task);
      localStorage.setItem("tasks", JSON.stringify(tasks));

      taskTitle.value = "";
      taskTime.value = "";

      renderTasks();
      scheduleNotification(task);
    } else {
      alert("Please fill all task fields");
    }
  }

  function renderTasks() {
    tasksContainer.innerHTML = "";

    if (tasks.length === 0) {
      tasksContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-tasks"></i>
                            <p>No tasks for today. Add a task to get started!</p>
                        </div>
                    `;
      return;
    }

    const todayTasks = tasks.filter(
      (task) => !task.completed && task.dayNumber === challenge.currentDay
    );

    if (todayTasks.length === 0) {
      tasksContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-check-circle"></i>
                            <p>All tasks completed for today! Great job!</p>
                        </div>
                    `;
    } else {
      todayTasks.forEach((task) => {
        const taskElement = document.createElement("div");
        taskElement.className = "task-item";
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
      updateChallengeProgress();
    }
  }

  function deleteTask(taskId) {
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

  function updateChallengeProgress() {
    const completedTasks = tasks.filter(
      (t) => t.completed && t.dayNumber === challenge.currentDay
    ).length;
    const totalTasks = tasks.filter(
      (t) => t.dayNumber === challenge.currentDay
    ).length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    progressBar.style.width = `${progress}%`;
    challengeText.textContent = `Day ${challenge.currentDay} of ${challenge.totalDays} Challenge`;
  }

  function checkNewDay() {
    const now = new Date();
    const lastCheck = new Date(localStorage.getItem("lastDayCheck") || 0);

    if (
      now.getDate() !== lastCheck.getDate() ||
      now.getMonth() !== lastCheck.getMonth() ||
      now.getFullYear() !== lastCheck.getFullYear()
    ) {
      // It's a new day
      if (challenge.currentDay < challenge.totalDays) {
        challenge.currentDay++;

        // Add daily recurring tasks
        const dailyTasks = tasks.filter((task) => task.isDaily);
        dailyTasks.forEach((task) => {
          tasks.push({
            id: Date.now() + Math.random(), // Ensure unique ID
            title: task.title,
            date: now.toISOString().split("T")[0],
            time: task.time,
            completed: false,
            isDaily: true,
            dayNumber: challenge.currentDay,
          });
        });

        localStorage.setItem("tasks", JSON.stringify(tasks));
        localStorage.setItem("challenge", JSON.stringify(challenge));
      }

      localStorage.setItem("lastDayCheck", now.toISOString());
    }
  }

  function formatDate(dateString) {
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
    tasks.forEach((task) => {
      if (!task.completed) {
        scheduleNotification(task);
      }
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
        new Notification("Task Reminder", {
          body: `Your task "${task.title}" is due in 30 minutes at ${task.time}`,
        });

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

          new Notification("Task Reminder", {
            body: `Your task "${task.title}" is due soon! Complete it to stop reminders.`,
          });
        }, 2 * 60 * 1000); // Every 2 minutes
      }
    }, timeUntilNotification);
  }

  // Request notification permission on load if not already set
  if ("Notification" in window && Notification.permission === "default") {
    // We'll show our custom notification permission prompt instead
  }
});
