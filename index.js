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
  const daysCompletedContainer = document.getElementById(
    "daysCompletedContainer"
  );
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

  // Confirmation dialog elements
  const confirmationPopup = document.getElementById("confirmationPopup");
  const confirmationTitle = document.getElementById("confirmationTitle");
  const confirmationMessage = document.getElementById("confirmationMessage");
  const confirmationTaskId = document.getElementById("confirmationTaskId");
  const confirmationAction = document.getElementById("confirmationAction");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");

  // Calendar elements
  const calendarGrid = document.getElementById("calendarGrid");
  const calendarTitle = document.getElementById("calendarTitle");
  const prevMonthBtn = document.getElementById("prevMonth");
  const nextMonthBtn = document.getElementById("nextMonth");
  const todayMonthBtn = document.getElementById("todayMonth");

  // State Variables
  let user = JSON.parse(localStorage.getItem("user")) || null;
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let history = JSON.parse(localStorage.getItem("history")) || [];
  let templateTasks = JSON.parse(localStorage.getItem("templateTasks")) || [];
  let notificationTimeouts = {};
  let notificationIntervals = {};
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  const themeCycle = ["system", "light", "dark"];
  let currentThemeIndex = 0;

  // --- Helper Functions ---
  function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDate(dateString) {
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    // Adding 'T00:00:00' ensures the date is parsed in the local timezone
    return new Date(dateString + "T00:00:00").toLocaleDateString(
      undefined,
      options
    );
  }

  // --- Initialization ---
  function initApp() {
    try {
      checkNewDay();

      if (!user) {
        welcomePopup.style.display = "flex";
      } else {
        welcomePopup.style.display = "none";
        userLogo.textContent = user.name.charAt(0).toUpperCase();
        userName.value = user.name;
      }

      const savedTheme = localStorage.getItem("theme") || "system";
      document.documentElement.setAttribute("data-theme", savedTheme);
      currentThemeIndex = themeCycle.indexOf(savedTheme);
      updateThemeIcon(savedTheme);

      checkNotificationPermission();
      scheduleAllNotifications();
    } catch (error) {
      console.error("Error during app initialization:", error);
    }

    renderTasks();
    renderHistory();
    updateDailyProgress();
    renderCalendar();
  }

  // --- Event Listeners ---
  startBtn.addEventListener("click", startApp);
  saveProfileBtn.addEventListener("click", saveProfile);
  themeSwitcher.addEventListener("click", toggleTheme);
  resetBtn.addEventListener("click", () =>
    showConfirmation("reset", null, "all data")
  );
  addTaskBtn.addEventListener("click", addTask);
  saveEditBtn.addEventListener("click", saveEditedTask);
  cancelEditBtn.addEventListener("click", closeEditPopup);
  enableNotifications.addEventListener("click", requestNotificationPermission);
  dismissNotification.addEventListener("click", dismissNotificationPermission);
  confirmYes.addEventListener("click", handleConfirmation);
  confirmNo.addEventListener("click", closeConfirmationPopup);

  prevMonthBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });

  todayMonthBtn.addEventListener("click", () => {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    renderCalendar();
  });

  tasksContainer.addEventListener("click", function (e) {
    const target = e.target.closest("button");
    if (!target) return;

    const taskElement = target.closest(".task-item");
    if (!taskElement) return;

    const taskId = parseInt(taskElement.dataset.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (target.classList.contains("complete-btn")) {
      showConfirmation("complete", taskId, task.title);
    } else if (target.classList.contains("edit-btn")) {
      openEditPopup(taskId);
    } else if (target.classList.contains("delete-btn")) {
      showConfirmation("delete", taskId, task.title);
    }
  });

  navBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const sectionId = this.getAttribute("data-section");
      if (!sectionId) return;

      navBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      sections.forEach((section) => section.classList.remove("active"));
      document.getElementById(sectionId).classList.add("active");

      if (sectionId === "history") updateDaysCompleted();
      if (sectionId === "calendar") renderCalendar();
    });
  });

  // --- Core Application Logic ---
  function startApp() {
    const name = userNameInput.value.trim();
    if (name) {
      user = { name };
      localStorage.setItem("user", JSON.stringify(user));
      userLogo.textContent = name.charAt(0).toUpperCase();
      userName.value = name;
      welcomePopup.style.display = "none";
      checkNotificationPermission();
    } else {
      alert("Please enter your name to continue.");
    }
  }

  function saveProfile() {
    if (user) {
      user.name = userName.value.trim();
      localStorage.setItem("user", JSON.stringify(user));
      userLogo.textContent = user.name.charAt(0).toUpperCase();
      alert("Profile saved successfully!");
    }
  }

  function resetApp() {
    localStorage.clear();
    user = null;
    tasks = [];
    history = [];
    templateTasks = [];

    Object.values(notificationTimeouts).forEach(clearTimeout);
    Object.values(notificationIntervals).forEach(clearInterval);
    notificationTimeouts = {};
    notificationIntervals = {};

    userLogo.textContent = "U";
    userName.value = "";
    welcomePopup.style.display = "flex";
    renderTasks();
    renderHistory();
    updateDailyProgress();
    updateDaysCompleted();
    renderCalendar();
  }

  function addTask() {
    const title = taskTitle.value.trim();
    const date = taskDate.value;
    const time = taskTime.value;

    if (title && date && time) {
      const task = { id: Date.now(), title, date, time, completed: false };
      tasks.push(task);
      localStorage.setItem("tasks", JSON.stringify(tasks));

      const isTemplate = templateTasks.some(
        (t) => t.title === title && t.time === time
      );
      if (!isTemplate) {
        templateTasks.push({ title, time });
        localStorage.setItem("templateTasks", JSON.stringify(templateTasks));
      }

      taskTitle.value = "";
      taskTime.value = "";
      taskDate.value = getLocalDateString(); // Reset to today

      renderTasks();
      updateDailyProgress();
      renderCalendar();
      scheduleNotification(task);
    } else {
      alert("Please fill all task fields.");
    }
  }

  function completeTask(taskId) {
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].completed = true;

      if (notificationTimeouts[taskId])
        clearTimeout(notificationTimeouts[taskId]);
      if (notificationIntervals[taskId])
        clearInterval(notificationIntervals[taskId]);
      delete notificationTimeouts[taskId];
      delete notificationIntervals[taskId];

      history.push({
        title: tasks[taskIndex].title,
        date: tasks[taskIndex].date,
        completedTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      localStorage.setItem("tasks", JSON.stringify(tasks));
      localStorage.setItem("history", JSON.stringify(history));

      renderTasks();
      renderHistory();
      updateDailyProgress();
      updateDaysCompleted();
      renderCalendar();
    }
  }

  function deleteTask(taskId) {
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      const taskToDelete = tasks[taskIndex];

      // Also remove from daily recurring templates if it exists
      templateTasks = templateTasks.filter(
        (t) => !(t.title === taskToDelete.title && t.time === taskToDelete.time)
      );
      localStorage.setItem("templateTasks", JSON.stringify(templateTasks));

      if (notificationTimeouts[taskId])
        clearTimeout(notificationTimeouts[taskId]);
      if (notificationIntervals[taskId])
        clearInterval(notificationIntervals[taskId]);
      delete notificationTimeouts[taskId];
      delete notificationIntervals[taskId];

      tasks = tasks.filter((t) => t.id !== taskId);
      localStorage.setItem("tasks", JSON.stringify(tasks));

      renderTasks();
      updateDailyProgress();
      renderCalendar();
    }
  }

  function saveEditedTask() {
    const taskId = parseInt(editTaskId.value);
    const title = editTaskTitle.value.trim();
    const date = editTaskDate.value;
    const time = editTaskTime.value;

    if (title && date && time) {
      const taskIndex = tasks.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        if (notificationTimeouts[taskId])
          clearTimeout(notificationTimeouts[taskId]);
        if (notificationIntervals[taskId])
          clearInterval(notificationIntervals[taskId]);

        tasks[taskIndex] = { ...tasks[taskIndex], title, date, time };
        localStorage.setItem("tasks", JSON.stringify(tasks));

        scheduleNotification(tasks[taskIndex]);

        renderTasks();
        updateDailyProgress();
        renderCalendar();
        closeEditPopup();
      }
    } else {
      alert("Please fill all task fields.");
    }
  }

  // --- Rendering Functions ---
  function renderTasks() {
    tasksContainer.innerHTML = "";
    const today = getLocalDateString();
    const todayTasks = tasks.filter(
      (task) => task.date === today && !task.completed
    );

    if (todayTasks.length === 0) {
      const allTodayTasksCount = tasks.filter(
        (task) => task.date === today
      ).length;
      const message =
        allTodayTasksCount > 0
          ? `<i class="fas fa-check-circle"></i><p>All tasks completed for today! Great job!</p>`
          : `<i class="fas fa-tasks"></i><p>No tasks for today. Add one to get started!</p>`;
      tasksContainer.innerHTML = `<div class="empty-state">${message}</div>`;
      return;
    }

    todayTasks.sort((a, b) => a.time.localeCompare(b.time)); // Sort by time

    todayTasks.forEach((task) => {
      const taskElement = document.createElement("div");
      taskElement.className = "task-item";
      taskElement.dataset.id = task.id;
      taskElement.innerHTML = `
                    <div class="task-info">
                        <div class="task-title">${task.title}</div>
                        <div class="task-time">Due at ${task.time}</div>
                    </div>
                    <div class="task-actions">
                        <button class="btn-success complete-btn"><i class="fas fa-check"></i></button>
                        <button class="btn-warning edit-btn"><i class="fas fa-edit"></i></button>
                        <button class="btn-danger delete-btn"><i class="fas fa-trash"></i></button>
                    </div>
                `;
      tasksContainer.appendChild(taskElement);
    });
  }

  function renderHistory() {
    historyContainer.innerHTML = "";
    if (history.length === 0) {
      historyContainer.innerHTML = `<div class="empty-state"><i class="fas fa-history"></i><p>No completed tasks yet.</p></div>`;
      return;
    }

    const historyByDate = history.reduce((acc, item) => {
      (acc[item.date] = acc[item.date] || []).push(item);
      return acc;
    }, {});

    Object.keys(historyByDate)
      .sort()
      .reverse()
      .forEach((date) => {
        // Show most recent first
        const dateElement = document.createElement("div");
        dateElement.className = "history-item";
        let dateHTML = `<div class="history-date">${formatDate(date)}</div>`;
        historyByDate[date].forEach((item) => {
          dateHTML += `
                        <div class="history-task">
                            <span>${item.title}</span>
                            <span>Completed at ${item.completedTime}</span>
                        </div>`;
        });
        dateElement.innerHTML = dateHTML;
        historyContainer.appendChild(dateElement);
      });
  }

  function updateDaysCompleted() {
    if (history.length === 0) {
      daysCompletedContainer.innerHTML = `<div class="days-completed">Total Days with Completed Tasks: 0</div>`;
      return;
    }
    const uniqueDays = [...new Set(history.map((item) => item.date))];
    const dates = uniqueDays.sort();
    daysCompletedContainer.innerHTML = `
                <div class="days-completed">
                    Total Days with Completed Tasks: ${uniqueDays.length}
                    <div class="days-summary">
                        <span>From: ${formatDate(dates[0])}</span>
                        <span>To: ${formatDate(dates[dates.length - 1])}</span>
                    </div>
                </div>`;
  }

  function updateDailyProgress() {
    const today = getLocalDateString();
    const totalTasks = tasks.filter((t) => t.date === today).length;
    const completedTasks = tasks.filter(
      (t) => t.completed && t.date === today
    ).length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(
      progress
    )}% completed (${completedTasks}/${totalTasks} tasks)`;
  }

  // --- Popups and Confirmation ---
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

  function showConfirmation(action, taskId, itemTitle) {
    confirmationAction.value = action;
    confirmationTaskId.value = taskId;
    let title = "",
      message = "";

    switch (action) {
      case "complete":
        title = "Complete Task";
        message = `Mark "${itemTitle}" as completed?`;
        break;
      case "delete":
        title = "Delete Task";
        message = `Delete "${itemTitle}"? This cannot be undone.`;
        break;
      case "reset":
        title = "Reset All Data";
        message =
          "Are you sure you want to delete all tasks, history, and user data?";
        break;
    }
    confirmationTitle.textContent = title;
    confirmationMessage.textContent = message;
    confirmationPopup.style.display = "flex";
  }

  function closeConfirmationPopup() {
    confirmationPopup.style.display = "none";
  }

  function handleConfirmation() {
    const action = confirmationAction.value;
    const taskId = parseInt(confirmationTaskId.value);

    if (action === "complete") completeTask(taskId);
    if (action === "delete") deleteTask(taskId);
    if (action === "reset") resetApp();

    closeConfirmationPopup();
  }

  // --- Notifications ---
  function checkNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      notificationPermission.style.display = "block";
    }
  }

  function requestNotificationPermission() {
    notificationPermission.style.display = "none";
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
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
    Object.values(notificationTimeouts).forEach(clearTimeout);
    Object.values(notificationIntervals).forEach(clearInterval);
    notificationTimeouts = {};
    notificationIntervals = {};
    tasks.filter((task) => !task.completed).forEach(scheduleNotification);
  }

  function scheduleNotification(task) {
    if (Notification.permission !== "granted") return;

    const taskDateTime = new Date(`${task.date}T${task.time}`);
    const notifyTime = new Date(taskDateTime.getTime() - 15 * 60000); // 15 mins before
    const timeUntilNotify = notifyTime.getTime() - Date.now();

    if (timeUntilNotify > 0) {
      notificationTimeouts[task.id] = setTimeout(() => {
        const currentTask = tasks.find((t) => t.id === task.id);
        if (currentTask && !currentTask.completed) {
          new Notification("Task Reminder", {
            body: `"${task.title}" is due in 15 minutes at ${task.time}.`,
          });
        }
      }, timeUntilNotify);
    }
  }

  // --- Daily & Theme Logic ---
  function checkNewDay() {
    const today = getLocalDateString();
    const lastCheck = localStorage.getItem("lastDayCheck");

    if (lastCheck !== today) {
      templateTasks.forEach((template) => {
        const taskExists = tasks.some(
          (t) => t.title === template.title && t.date === today
        );
        if (!taskExists) {
          tasks.push({
            id: Date.now() + Math.random(),
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

  function toggleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themeCycle.length;
    const newTheme = themeCycle[currentThemeIndex];
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    if (theme === "system") themeIcon.className = "fas fa-desktop";
    else if (theme === "light") themeIcon.className = "fas fa-sun";
    else themeIcon.className = "fas fa-moon";
  }

  // --- Calendar ---
  function renderCalendar() {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    calendarTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    calendarGrid.innerHTML = "";

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    weekdays.forEach((day) => {
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-weekday";
      dayEl.textContent = day;
      calendarGrid.appendChild(dayEl);
    });

    const firstDay = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startDayIndex = firstDay.getDay();

    for (let i = 0; i < startDayIndex; i++) {
      calendarGrid.insertAdjacentHTML(
        "beforeend",
        `<div class="calendar-day other-month"></div>`
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day";
      dayEl.textContent = day;

      if (dateStr === getLocalDateString()) {
        dayEl.classList.add("today");
      }

      const dayTasks = tasks.filter((task) => task.date === dateStr);
      if (dayTasks.length > 0) {
        const completedCount = dayTasks.filter((task) => task.completed).length;
        if (completedCount === dayTasks.length)
          dayEl.classList.add("completed");
        else if (completedCount > 0) dayEl.classList.add("partial");
        else dayEl.classList.add("has-tasks");

        const badge = document.createElement("div");
        badge.className = "day-details";
        badge.textContent = `${completedCount}/${dayTasks.length}`;
        dayEl.appendChild(badge);
      }

      calendarGrid.appendChild(dayEl);
    }
  }

  // --- Initial Run ---
  taskDate.value = getLocalDateString();
  initApp();
  setInterval(checkNewDay, 60000); // Check for a new day every minute
});
