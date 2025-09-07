# 📌 TaskWave - All-in-One Challenge & Task Manager

A **single-file project** (`index.html`) that combines **HTML, CSS, and JavaScript** into one file.  
TaskWave is a modern, responsive web app for managing tasks, tracking daily challenges, and receiving smart reminders — all saved in **localStorage**.

---

## 🚀 Features

### 👤 Onboarding & Profile

- First-time popup asks for your **name**.
- Logo/avatar shows the **first character** of your name.
- Profile settings page lets you update details.
- Data stored in `localStorage`.

### 📝 Task Management

- Add tasks with **title, date, and completion time**.
- **Auto-fill today’s date**.
- Edit, complete, delete tasks.
- **Day 1 Rule:** First task starts challenge → auto-repeats daily at same time.
- Shows **due date timestamp + time**.

### 📅 Challenge Tracker

- Displays **“Day X of Y Challenge”** with progress bar.
- **Auto day increment at 12 AM**.
- Shows only **today’s tasks**.

### 📜 History Page

- Lists all **completed tasks with dates**.
- Minimalist view (history list + settings bar only).

### 🔄 Reset Challenge

- One-click reset clears all data.

### ⏰ Smart Reminder System

- Browser notifications:
  - **30 minutes before task time**.
  - **Repeats every 2 minutes** until task is completed.

### 🎨 Theme

- **Dark / Light / System theme** with smooth animations.
- Professional UI with responsive cards, buttons, and animations.

### 💾 Persistence

- All user data stored in **localStorage**.

### 📱 Responsive Design

- Works seamlessly across mobile, tablet, and desktop.

---

## 🛠️ Tech Stack

- **HTML5**
- **CSS3** (embedded inside `<style>`)
- **Vanilla JavaScript (ES6+)** (inside `<script>`)
- **LocalStorage API**
- **Browser Notifications API**
