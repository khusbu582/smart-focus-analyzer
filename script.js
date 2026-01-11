let timerInterval;
let seconds = 0;
let lastStateTime = 0;
let currentState = null;
let chart = null;

// TIMER DISPLAY
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    seconds++;
    let h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    let m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    let s = String(seconds % 60).padStart(2, "0");
    document.getElementById("timer").innerText = `${h}:${m}:${s}`;
  }, 1000);
}

// START / FOCUS
function startFocus() {
  if (!currentState) startTimer();
  saveState();
  currentState = "focused";
  lastStateTime = seconds;
}

// DISTRACTED
function markDistracted() {
  saveState();
  currentState = "distracted";
  lastStateTime = seconds;
}

// SAVE STATE
function saveState() {
  if (!currentState) return;

  let duration = seconds - lastStateTime;
  if (duration <= 0) return;

  let data = JSON.parse(localStorage.getItem("focusData")) || [];

  data.push({
    date: new Date().toLocaleDateString(),
    state: currentState,
    duration: duration,
    distraction: document.getElementById("distractionReason").value
  });

  localStorage.setItem("focusData", JSON.stringify(data));
}

// END SESSION
function endSession() {
  saveState();
  clearInterval(timerInterval);
  currentState = null;
  seconds = 0;
  document.getElementById("timer").innerText = "00:00:00";
  generateAnalysis();
}

// ANALYSIS
function generateAnalysis() {
  let data = JSON.parse(localStorage.getItem("focusData")) || [];
  let today = new Date().toLocaleDateString();

  let study = 0, wasted = 0;
  let distractionCount = {};

  data.forEach(d => {
    if (d.date === today) {
      if (d.state === "focused") study += d.duration;
      if (d.state === "distracted") wasted += d.duration;
    }
    if (d.state === "distracted") {
      distractionCount[d.distraction] =
        (distractionCount[d.distraction] || 0) + d.duration;
    }
  });

  document.getElementById("today").innerText =
    `📘 Studied: ${(study/3600).toFixed(2)} hrs | ⛔ Wasted: ${(wasted/3600).toFixed(2)} hrs`;

  let top = Object.keys(distractionCount)
    .sort((a,b)=>distractionCount[b]-distractionCount[a])[0];

  document.getElementById("topDistraction").innerText =
    top ? `⚠️ Top Distraction: ${top}` : "";

  document.getElementById("suggestion").innerText =
    top === "Phone"
      ? "📵 Keep phone away while studying"
      : "💡 Take short active breaks to stay focused";

  renderChart(data);
}

// GRAPH
function renderChart(data) {
  let daily = {};

  data.forEach(d => {
    if (!daily[d.date]) daily[d.date] = { f:0, d:0 };
    if (d.state === "focused") daily[d.date].f += d.duration;
    if (d.state === "distracted") daily[d.date].d += d.duration;
  });

  let labels = Object.keys(daily);
  let study = labels.map(d => (daily[d].f/3600).toFixed(2));
  let wasted = labels.map(d => (daily[d].d/3600).toFixed(2));

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("dailyChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Study (hrs)", data: study, backgroundColor: "#4CAF50" },
        { label: "Wasted (hrs)", data: wasted, backgroundColor: "#F44336" }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}
