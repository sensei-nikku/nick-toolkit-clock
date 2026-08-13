"use strict";

import { formatLap, splitStopwatchTime } from "./time.js";

(() => {
  const getRequiredElement = (id) => {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Required element missing: ${id}`);
    }
    return element;
  };

  const clockMain = getRequiredElement("clockMain");
  const clockSeconds = getRequiredElement("clockSeconds");
  const clockPeriod = getRequiredElement("clockPeriod");
  const dateText = getRequiredElement("dateText");

  const stopwatchMain = getRequiredElement("stopwatchMain");
  const stopwatchFraction = getRequiredElement("stopwatchFraction");
  const startPauseBtn = getRequiredElement("startPauseBtn");
  const lapBtn = getRequiredElement("lapBtn");
  const resetBtn = getRequiredElement("resetBtn");
  const lapsEl = getRequiredElement("laps");

  const hourFormat = getRequiredElement("hourFormat");
  const showSeconds = getRequiredElement("showSeconds");

  const STORAGE_KEYS = Object.freeze({
    hourFormat: "clock-hour-format",
    showSeconds: "clock-show-seconds"
  });

  const ALLOWED_HOUR_FORMATS = new Set(["12", "24"]);
  const ALLOWED_SECONDS_VALUES = new Set(["yes", "no"]);

  const safeStorageGet = (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const safeStorageSet = (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Some hardened/private browser modes intentionally disable storage.
    }
  };

  const savedHourFormat = safeStorageGet(STORAGE_KEYS.hourFormat);
  const savedShowSeconds = safeStorageGet(STORAGE_KEYS.showSeconds);

  if (ALLOWED_HOUR_FORMATS.has(savedHourFormat)) {
    hourFormat.value = savedHourFormat;
  }

  if (ALLOWED_SECONDS_VALUES.has(savedShowSeconds)) {
    showSeconds.value = savedShowSeconds;
  }

  const updateClock = () => {
    const now = new Date();
    const use12Hour = hourFormat.value === "12";
    const includeSeconds = showSeconds.value === "yes";

    let hours = now.getHours();
    let period = "";

    if (use12Hour) {
      period = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
    }

    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const hourText = use12Hour
      ? String(hours)
      : String(hours).padStart(2, "0");

    clockMain.textContent = `${hourText}:${minutes}`;
    clockSeconds.textContent = includeSeconds ? `:${seconds}` : "";
    clockPeriod.textContent = use12Hour ? period : "";

    dateText.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(now);
  };

  hourFormat.addEventListener("change", () => {
    if (!ALLOWED_HOUR_FORMATS.has(hourFormat.value)) {
      hourFormat.value = "12";
    }

    safeStorageSet(STORAGE_KEYS.hourFormat, hourFormat.value);
    updateClock();
  });

  showSeconds.addEventListener("change", () => {
    if (!ALLOWED_SECONDS_VALUES.has(showSeconds.value)) {
      showSeconds.value = "yes";
    }

    safeStorageSet(STORAGE_KEYS.showSeconds, showSeconds.value);
    updateClock();
  });

  updateClock();
  window.setInterval(updateClock, 250);

  let running = false;
  let startedAt = 0;
  let accumulated = 0;
  let frameId = null;
  let lapCount = 0;
  let previousLapTotal = 0;

  const currentElapsed = () =>
    accumulated + (running ? performance.now() - startedAt : 0);

  const renderStopwatchValue = (elapsed) => {
    const { main, fraction } = splitStopwatchTime(elapsed);
    stopwatchMain.textContent = main;
    stopwatchFraction.textContent = fraction;
  };

  const renderStopwatch = () => {
    renderStopwatchValue(currentElapsed());

    if (running) {
      frameId = window.requestAnimationFrame(renderStopwatch);
    }
  };

  const setButtonState = () => {
    const elapsed = currentElapsed();

    startPauseBtn.textContent = running
      ? "Pause"
      : elapsed > 0
        ? "Resume"
        : "Start";

    lapBtn.disabled = !running;
    resetBtn.disabled = elapsed <= 0;
  };

  const toggleStartPause = () => {
    if (!running) {
      startedAt = performance.now();
      running = true;
      frameId = window.requestAnimationFrame(renderStopwatch);
    } else {
      accumulated += performance.now() - startedAt;
      running = false;

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }

      renderStopwatchValue(accumulated);
    }

    setButtonState();
  };

  const addLap = () => {
    if (!running) {
      return;
    }

    const total = currentElapsed();
    const split = total - previousLapTotal;

    previousLapTotal = total;
    lapCount += 1;

    document.getElementById("emptyLaps")?.remove();

    const row = document.createElement("div");
    row.className = "lap";

    const numberCell = document.createElement("div");
    numberCell.className = "lap-number";
    numberCell.textContent = `Lap ${lapCount}`;

    const splitCell = document.createElement("div");
    splitCell.className = "lap-split";
    splitCell.textContent = `+${formatLap(split)}`;

    const totalCell = document.createElement("div");
    totalCell.className = "lap-total";
    totalCell.textContent = formatLap(total);

    row.append(numberCell, splitCell, totalCell);
    lapsEl.prepend(row);
  };

  const resetStopwatch = () => {
    running = false;

    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }

    startedAt = 0;
    accumulated = 0;
    lapCount = 0;
    previousLapTotal = 0;

    renderStopwatchValue(0);
    lapsEl.replaceChildren();

    const empty = document.createElement("div");
    empty.className = "empty-laps";
    empty.id = "emptyLaps";
    empty.textContent = "Lap times will appear here.";
    lapsEl.append(empty);

    setButtonState();
  };

  startPauseBtn.addEventListener("click", toggleStartPause);
  lapBtn.addEventListener("click", addLap);
  resetBtn.addEventListener("click", resetStopwatch);

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const editing =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable);

    if (editing) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      toggleStartPause();
      return;
    }

    const key = event.key.toLowerCase();

    if (key === "l") {
      addLap();
    } else if (key === "r") {
      resetStopwatch();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      updateClock();
      renderStopwatchValue(currentElapsed());
      setButtonState();
    }
  });

  renderStopwatchValue(0);
  setButtonState();
})();
