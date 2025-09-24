document.addEventListener("DOMContentLoaded", function () {
  // Check if elements exist before trying to access them
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
  const calendarGrid = document.getElementById("calendarGrid");
  const calendarTitle = document.getElementById("calendarTitle");
  const prevMonthBtn = document.getElementById("prevMonth");
  const nextMonthBtn = document.getElementById("nextMonth");
  const todayMonthBtn = document.getElementById("todayMonth");

  // Safe element checking function
  function safeQuery(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`Element not found: ${selector}`);
    }
    return element;
  }

  function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Initialize date field
  if (taskDate) {
    taskDate.value = getLocalDateString();
  }

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

  initApp();

  // Event listeners with safety checks
  if (startBtn) startBtn.addEventListener("click", startApp);
  if (saveProfileBtn) saveProfileBtn.addEventListener("click", saveProfile);
  if (themeSwitcher) themeSwitcher.addEventListener("click", toggleTheme);
  if (resetBtn) resetBtn.addEventListener("click", resetApp);
  if (addTaskBtn) addTaskBtn.addEventListener("click", addTask);
  if (saveEditBtn) saveEditBtn.addEventListener("click", saveEditedTask);
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", closeEditPopup);
  if (enableNotifications)
    enableNotifications.addEventListener(
      "click",
      requestNotificationPermission
    );
  if (dismissNotification)
    dismissNotification.addEventListener(
      "click",
      dismissNotificationPermission
    );

  if (prevMonthBtn)
    prevMonthBtn.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    });

  if (nextMonthBtn)
    nextMonthBtn.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
    });

  if (todayMonthBtn)
    todayMonthBtn.addEventListener("click", () => {
      const today = new Date();
      currentMonth = today.getMonth();
      currentYear = today.getFullYear();
      renderCalendar();
    });

  if (tasksContainer) {
    tasksContainer.addEventListener("click", function (e) {
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
  }

  if (navBtns) {
    navBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        const sectionId = this.getAttribute("data-section");
        navBtns.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        sections.forEach((section) => section.classList.remove("active"));
        const targetSection = document.getElementById(sectionId);
        if (targetSection) targetSection.classList.add("active");

        if (sectionId === "history") {
          updateDaysCompleted();
        }
        if (sectionId === "calendar") {
          renderCalendar();
        }
      });
    });
  }

  function initApp() {
    checkNewDay();
    if (!user) {
      if (welcomePopup) welcomePopup.style.display = "flex";
    } else {
      if (welcomePopup) welcomePopup.style.display = "none";
      if (userLogo) userLogo.textContent = user.name.charAt(0).toUpperCase();
      if (userName) userName.value = user.name;
    }

    const savedTheme = localStorage.getItem("theme") || "system";
    document.documentElement.setAttribute("data-theme", savedTheme);
    currentThemeIndex = themeCycle.indexOf(savedTheme);
    updateThemeIcon(savedTheme);
    checkNotificationPermission();
    renderTasks();
    renderHistory();
    updateDailyProgress();
    scheduleAllNotifications();
  }

  function startApp() {
    if (!userNameInput) return;

    const name = userNameInput.value.trim();
    if (name) {
      user = { name };
      localStorage.setItem("user", JSON.stringify(user));
      if (userLogo) userLogo.textContent = name.charAt(0).toUpperCase();
      if (welcomePopup) welcomePopup.style.display = "none";
      checkNotificationPermission();
    } else {
      alert("Please enter your name to continue");
    }
  }

  function saveProfile() {
    if (!user || !userName) return;

    user.name = userName.value;
    localStorage.setItem("user", JSON.stringify(user));
    if (userLogo) userLogo.textContent = user.name.charAt(0).toUpperCase();
    alert("Profile saved successfully!");
  }

  function toggleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themeCycle.length;
    const newTheme = themeCycle[currentThemeIndex];
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    if (!themeIcon) return;

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

      // Clear all timeouts and intervals
      for (let id in notificationTimeouts) {
        clearTimeout(notificationTimeouts[id]);
      }
      for (let id in notificationIntervals) {
        clearInterval(notificationIntervals[id]);
      }
      notificationTimeouts = {};
      notificationIntervals = {};

      if (userLogo) userLogo.textContent = "U";
      if (welcomePopup) welcomePopup.style.display = "flex";
      renderTasks();
      renderHistory();
      updateDailyProgress();
      updateDaysCompleted();
      if (calendarGrid) renderCalendar();
    }
  }

  function addTask() {
    if (!taskTitle || !taskDate || !taskTime) return;

    const title = taskTitle.value.trim();
    const date = taskDate.value;
    const time = taskTime.value;

    if (title && date && time) {
      const task = { id: Date.now(), title, date, time, completed: false };
      tasks.push(task);
      localStorage.setItem("tasks", JSON.stringify(tasks));

      const existingTemplate = templateTasks.find(
        (t) => t.title === title && t.time === time
      );
      if (!existingTemplate) {
        templateTasks.push({ title, time });
        localStorage.setItem("templateTasks", JSON.stringify(templateTasks));
      }

      if (taskTitle) taskTitle.value = "";
      if (taskTime) taskTime.value = "";

      renderTasks();
      updateDailyProgress();
      scheduleNotification(task);
      renderCalendar();
    } else {
      alert("Please fill all task fields");
    }
  }

  function renderTasks() {
    if (!tasksContainer) return;

    tasksContainer.innerHTML = "";
    const today = getLocalDateString();
    const todayTasks = tasks.filter((task) => task.date === today);
    const uncompletedTasks = todayTasks.filter((task) => !task.completed);

    if (todayTasks.length === 0) {
      tasksContainer.innerHTML = `<div class="empty-state"><i class="fas fa-tasks"></i><p>No tasks for today. Add a task to get started!</p></div>`;
    } else if (uncompletedTasks.length === 0) {
      tasksContainer.innerHTML = `<div class="empty-state"><i class="fas fa-check-circle"></i><p>All tasks completed for today! Great job!</p></div>`;
    } else {
      uncompletedTasks.forEach((task) => {
        const taskElement = document.createElement("div");
        taskElement.className = "task-item";
        taskElement.dataset.id = task.id;
        taskElement.innerHTML = `
                    <div class="task-info">
                        <div class="task-title">${escapeHtml(task.title)}</div>
                        <div class="task-time">${formatDate(task.date)} at ${
          task.time
        }</div>
                    </div>
                    <div class="task-actions">
                        <button class="btn-success complete-btn">Complete</button>
                        <button class="btn-warning edit-btn">Edit</button>
                        <button class="btn-danger delete-btn">Delete</button>
                    </div>`;
        tasksContainer.appendChild(taskElement);
      });
    }
  }

  function openEditPopup(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (
      task &&
      editPopup &&
      editTaskTitle &&
      editTaskDate &&
      editTaskTime &&
      editTaskId
    ) {
      editTaskId.value = task.id;
      editTaskTitle.value = task.title;
      editTaskDate.value = task.date;
      editTaskTime.value = task.time;
      editPopup.style.display = "flex";
    }
  }

  function closeEditPopup() {
    if (editPopup) editPopup.style.display = "none";
  }

  function saveEditedTask() {
    if (!editTaskId || !editTaskTitle || !editTaskDate || !editTaskTime) return;

    const taskId = parseInt(editTaskId.value);
    const title = editTaskTitle.value.trim();
    const date = editTaskDate.value;
    const time = editTaskTime.value;

    if (title && date && time) {
      const taskIndex = tasks.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        // Clear existing notifications
        if (notificationTimeouts[taskId])
          clearTimeout(notificationTimeouts[taskId]);
        if (notificationIntervals[taskId])
          clearInterval(notificationIntervals[taskId]);
        delete notificationTimeouts[taskId];
        delete notificationIntervals[taskId];

        tasks[taskIndex].title = title;
        tasks[taskIndex].date = date;
        tasks[taskIndex].time = time;
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks();
        updateDailyProgress();
        scheduleNotification(tasks[taskIndex]);
        closeEditPopup();
        renderCalendar();
      }
    } else {
      alert("Please fill all task fields");
    }
  }

  function completeTask(taskId) {
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].completed = true;

      // Clear notifications
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
      if (confirm("Are you sure you want to delete this task?")) {
        const deletedTask = tasks[taskIndex];

        // Clear notifications
        if (notificationTimeouts[taskId])
          clearTimeout(notificationTimeouts[taskId]);
        if (notificationIntervals[taskId])
          clearInterval(notificationIntervals[taskId]);
        delete notificationTimeouts[taskId];
        delete notificationIntervals[taskId];

        // Remove task
        tasks.splice(taskIndex, 1);

        // Remove template
        templateTasks = templateTasks.filter(
          (template) =>
            !(
              template.title === deletedTask.title &&
              template.time === deletedTask.time
            )
        );

        localStorage.setItem("tasks", JSON.stringify(tasks));
        localStorage.setItem("templateTasks", JSON.stringify(templateTasks));
        renderTasks();
        updateDailyProgress();
        renderCalendar();
      }
    }
  }

  function renderHistory() {
    if (!historyContainer) return;

    historyContainer.innerHTML = "";
    if (history.length === 0) {
      historyContainer.innerHTML = `<div class="empty-state"><i class="fas fa-history"></i><p>No completed tasks yet.</p></div>`;
      return;
    }

    const historyByDate = {};
    history.forEach((item) => {
      if (!historyByDate[item.date]) {
        historyByDate[item.date] = [];
      }
      historyByDate[item.date].push(item);
    });

    const sortedDates = Object.keys(historyByDate).sort(
      (a, b) => new Date(b) - new Date(a)
    );

    sortedDates.forEach((date) => {
      const dateElement = document.createElement("div");
      dateElement.className = "history-item";
      let dateHTML = `<div class="history-date">${formatDate(date)}</div>`;
      historyByDate[date].forEach((item) => {
        dateHTML += `<div class="history-task"><span>${escapeHtml(
          item.title
        )}</span><span>Completed at ${item.completedTime}</span></div>`;
      });
      dateElement.innerHTML = dateHTML;
      historyContainer.appendChild(dateElement);
    });
  }

  function updateDaysCompleted() {
    if (!daysCompletedContainer) return;

    daysCompletedContainer.innerHTML = "";
    if (history.length === 0) {
      daysCompletedContainer.innerHTML = `<div class="days-completed">Total Days Completed: 0</div>`;
      return;
    }

    const uniqueDays = new Set(history.map((item) => item.date));
    const dates = Array.from(uniqueDays).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    daysCompletedContainer.innerHTML = `
            <div class="days-completed">
                Total Days Completed: ${uniqueDays.size}
                <div class="days-summary">
                    <span>From: ${formatDate(firstDate)}</span>
                    <span>To: ${formatDate(lastDate)}</span>
                </div>
            </div>`;
  }

  function updateDailyProgress() {
    if (!progressBar || !progressText) return;

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

  function checkNewDay() {
    const today = getLocalDateString();
    const lastCheck = localStorage.getItem("lastDayCheck");
    if (lastCheck !== today) {
      templateTasks.forEach((template) => {
        const existingTask = tasks.find(
          (t) =>
            t.title === template.title &&
            t.time === template.time &&
            t.date === today
        );
        if (!existingTask) {
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

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function checkNotificationPermission() {
    if (
      "Notification" in window &&
      Notification.permission === "default" &&
      notificationPermission
    ) {
      notificationPermission.style.display = "block";
    }
  }

  function requestNotificationPermission() {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted" && notificationPermission) {
          notificationPermission.style.display = "none";
          scheduleAllNotifications();
        }
      });
    }
  }

  function dismissNotificationPermission() {
    if (notificationPermission) notificationPermission.style.display = "none";
  }

  function scheduleAllNotifications() {
    if (Notification.permission !== "granted") return;

    // Clear existing notifications
    for (let id in notificationTimeouts) clearTimeout(notificationTimeouts[id]);
    for (let id in notificationIntervals)
      clearInterval(notificationIntervals[id]);
    notificationTimeouts = {};
    notificationIntervals = {};

    const today = getLocalDateString();
    tasks
      .filter((task) => task.date === today && !task.completed)
      .forEach(scheduleNotification);
  }

  function scheduleNotification(task) {
    if (Notification.permission !== "granted") return;

    const [hours, minutes] = task.time.split(":").map(Number);
    const taskDateTime = new Date(task.date);
    taskDateTime.setHours(hours, minutes, 0, 0);
    const notifyTime = new Date(taskDateTime.getTime() - 30 * 60000);

    if (notifyTime < new Date()) return;

    const timeUntilNotification = notifyTime - new Date();
    notificationTimeouts[task.id] = setTimeout(() => {
      const currentTask = tasks.find((t) => t.id === task.id);
      if (
        currentTask &&
        !currentTask.completed &&
        Notification.permission === "granted"
      ) {
        new Notification("Task Reminder", {
          body: `Your task "${task.title}" is due in 30 minutes at ${task.time}`,
        });
      }
    }, timeUntilNotification);
  }

  function renderCalendar() {
    if (!calendarGrid || !calendarTitle) return;

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
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-weekday";
      dayElement.textContent = day;
      calendarGrid.appendChild(dayElement);
    });

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    // Empty days for previous month
    for (let i = 0; i < startDay; i++) {
      const emptyDay = document.createElement("div");
      emptyDay.className = "calendar-day other-month";
      emptyDay.innerHTML = `<div class="day-tracker"></div>`;
      calendarGrid.appendChild(emptyDay);
    }

    const today = new Date();
    const todayFormatted = getLocalDateString(today);

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day";

      const trackerElement = document.createElement("div");
      trackerElement.className = "day-tracker";
      trackerElement.textContent = day;

      if (dateStr === todayFormatted) {
        trackerElement.classList.add("today");
      }

      const dayTasks = tasks.filter((task) => task.date === dateStr);
      if (dayTasks.length > 0) {
        const completedTasksCount = dayTasks.filter(
          (task) => task.completed
        ).length;

        if (completedTasksCount === dayTasks.length) {
          trackerElement.classList.add("completed-all");
        } else if (completedTasksCount > 0) {
          trackerElement.classList.add("completed-some");
        } else {
          trackerElement.classList.add("completed-none");
        }

        const badge = document.createElement("div");
        badge.className = "day-details";
        badge.textContent = completedTasksCount;
        dayElement.appendChild(badge);
      }

      dayElement.appendChild(trackerElement);
      calendarGrid.appendChild(dayElement);
    }
  }

  // Check for new day every minute
  setInterval(checkNewDay, 60000);
});
