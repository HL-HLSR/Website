// settings
const settings = {
  updateInterval: 1000 * 60 * 5.2,
  // corsProxy: "https://bold-grass-47ed.widget-cors.workers.dev/?",
  appid: "50",
  goals: {
    low: 620,
    high: 5000,
  },
};

// localisation
const localisation = {
  "#GOAL1": {
    en: "Goal 1:",
    ru: "Цель 1:",
  },
  "#GOAL2": {
    en: "Goal 2:",
    ru: "Цель 2:",
  },
  "#PEAK": {
    en: "Peak: ",
    ru: "Пик: ",
  },
  "#PLAYERS": {
    en: "Players",
    ru: "Игроков",
  },
};

// util methods
const formatNumber = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// main code
(function () {
  window.debug = { enabled: false, online: 741 };

  const lang = window.location.href.includes("#ru") ? "ru" : "en";

  // elements
  const hint = document.querySelector("#hint");
  const count = document.querySelector("#count");
  const circle = document.querySelector("#circle");
  const circleBg = document.querySelector("#background-circle");

  const radius = parseInt(circle.getAttribute("r"));

  if (isNaN(radius)) {
    console.error("NaN radius");
    return;
  }

  const circumference = radius * 2 * Math.PI;
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circleBg.style.strokeDasharray = `${circumference} ${circumference}`;

  const confetti = new ConfettiGenerator({
    target: "canvas-background",
    clock: 15,
  });

  let confettiStarted = false;
  let peakValue = 0;

  let originalColor =
    document.documentElement.style.getPropertyValue("--color");

  function ApplyLocalisation() {
    let toLocalise = document.querySelectorAll("*[data-locale]");

    document.querySelector("#low_goal").innerHTML = formatNumber(
      settings.goals.low
    );
    document.querySelector("#high_goal").innerHTML = formatNumber(
      settings.goals.high
    );

    toLocalise.forEach((elem) => {
      let key = elem.getAttribute("data-locale");

      if (localisation[key]) {
        elem.innerHTML = localisation[key][lang];
      }
    });
  }

  function ToggleGoals() {
    let goals = document.querySelector(".goals");
    let isHidden = goals.classList.contains("hide");

    if (isHidden) goals.classList.toggle("hide");
    else goals.classList.toggle("show");

    // a little hack to restart animation
    goals.offsetWidth = goals.offsetWidth;

    if (isHidden) goals.classList.toggle("show");
    else goals.classList.toggle("hide");
  }

  function SetGoalsTimer() {
    setTimeout(() => {
      ToggleGoals();

      setTimeout(() => {
        ToggleGoals();
        SetGoalsTimer();
      }, 20 * 1000);
    }, 15 * 1000);
  }

  function UpdateActiveGoal(count) {
    let goals = document.querySelectorAll(".goal");

    if (count >= settings.goals.low) {
      goals[0].classList = "goal alt";
      goals[1].classList = "goal main";
    } else {
      goals[0].classList = "goal main";
      goals[1].classList = "goal alt";
    }
  }

  function Update() {
    async function MakeRequest() {
      const res = await fetch(
        `https://api2.hlsr.tk/hlof-stats`
      );

      const resJson = await res.json();

      let playerCount = window.debug.enabled ? window.debug.online : resJson.online;

      if (playerCount >= settings.goals.low) {
        if (!confettiStarted) {
          confetti.render();
          confettiStarted = true;
        }
      }

      if (playerCount >= settings.goals.high && playerCount >= peakValue) {
        document.querySelector("#app").classList.add("glitch");
        document.querySelector("#app").classList.add("shake");
        document.documentElement.style.setProperty("--color", "#00FF2B");
      } else {
        document.querySelector("#app").classList.remove("glitch");
        document.documentElement.style.setProperty("--color", originalColor);
      }

      UpdateActiveGoal(playerCount);
      peakValue = Math.max(peakValue, playerCount);

      hint.removeAttribute("hidden");
      count.innerHTML = formatNumber(playerCount);
      circle.style.transition = `stroke-dashoffset ${settings.updateInterval}ms linear, color 0.2s ease`;
      circle.style.strokeDashoffset = `${circumference * 2}`;
	  circleBg.style.strokeDashoffset = `${circumference * 2}`;
      document.querySelector("#peak-value").innerHTML = formatNumber(peakValue);

      setTimeout(Update, settings.updateInterval + 250);
    }

    circle.style.transition = `0.5s ease`;
    circle.style.strokeDashoffset = `${circumference}`;
	circleBg.style.strokeDashoffset = `${circumference}`;

    // delay before the first request
    setTimeout(MakeRequest, 500);
  }

  // initialize everything
  ApplyLocalisation();
  SetGoalsTimer();
  Update();
})();
