// settings
const settings = {
  // updateInterval: 1000 * 60 * 5.2,
  updateInterval: 1000 * 5,
  // corsProxy: "https://bold-grass-47ed.widget-cors.workers.dev/?",
  appid: "130",
  goals: {
    low: 95
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
  "#GOAL3": {
    en: "Goal 3:",
    ru: "Цель 3:",
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
  window.debug = { enabled: false, online: 10152, peak: 921 };

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
  let currentOnline = 0;
  let peakValue = 0;

  let originalColor =
    document.documentElement.style.getPropertyValue("--color");

  function ApplyLocalisation() {
    let toLocalise = document.querySelectorAll("*[data-locale]");

    document.querySelector("#low_goal").innerHTML = formatNumber(
      settings.goals.low
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

    goals[0].classList = "goal main";
  }

  // https://stackoverflow.com/questions/66123016/interpolate-between-two-colours-based-on-a-percentage-value
  function interpolate(color1, color2, percent) {
    // Convert the hex colors to RGB values
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);
  
    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    percent = Math.min(Math.max(percent, 0.0), 1.0);
  
    // Interpolate the RGB values
    const r = Math.round(r1 + (r2 - r1) * percent);
    const g = Math.round(g1 + (g2 - g1) * percent);
    const b = Math.round(b1 + (b2 - b1) * percent);
  
    // Convert the interpolated RGB values back to a hex color
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  let firstUpdate = true;

  function Update() {
    async function MakeRequest() {
      try {
        const res = await fetch(
          `https://api2.hlsr.tk:2024/online`
        );
  
        const resJson = await res.json();
  
        if (window.debug && window.debug.enabled) {
          currentOnline = window.debug.online;
          peakValue = window.debug.peak;
        } else {
          currentOnline = resJson.online;
          peakValue = resJson.peak;
        }
      } catch(ex) {
        console.error(ex);
      }

      peakValue = Math.max(peakValue, currentOnline);

      const appElement = document.querySelector("#app");

      if ((peakValue >= settings.goals.low || true) && !appElement.classList.contains("shake")) {
        appElement.classList.add("shake");
        appElement.classList.add("glitch");
        confetti.render();
        confettiStarted = true;
      }

      // Update color of the circle and text
      let goalCoeff = Math.max(Math.min(currentOnline / settings.goals.low, 1.0), 0.0);

      goalCoeff = 1.0;

      let glitchColor1 = interpolate("#afbfc5", "#339fcb", goalCoeff);
      let glitchColor2 = interpolate("#838383", "#0677b9", goalCoeff);
      document.documentElement.style.setProperty("--glitch-color-1", glitchColor1);
      document.documentElement.style.setProperty("--glitch-color-2", glitchColor2);

      let glowColor = "#003aff" + (Math.round(goalCoeff * 255)).toString(16).padStart(2, "0");
      document.documentElement.style.setProperty("--glow-color", glowColor);

      let globalColor = interpolate("#ffffff", "#00b4ff", goalCoeff);
      document.documentElement.style.setProperty("--color", globalColor);

      // Uncomment this when the event is over
      // appElement.classList.add("shake");

      UpdateActiveGoal(currentOnline);
      peakValue = Math.max(peakValue, currentOnline);

      hint.removeAttribute("hidden");
      count.innerHTML = formatNumber(currentOnline);
      circle.style.transition = `stroke-dashoffset 400ms linear, color 0.2s ease`;

      let progress = Math.min(Math.max((goalCoeff), 0.0), 1.0);
      circle.style.strokeDashoffset = `${circumference + circumference * progress}`;
      // circleBg.style.strokeDashoffset = `${circumference * 2}`;
      document.querySelector("#peak-value").innerHTML = formatNumber(peakValue);

      setTimeout(Update, settings.updateInterval + 250);
    }

    if (firstUpdate) {
      circle.style.transition = `0.5s ease`;
      circle.style.strokeDashoffset = `${circumference}`;
      firstUpdate = false;
    }
    // circleBg.style.strokeDashoffset = `${circumference}`;

    // delay before the first request
    setTimeout(MakeRequest, 500);
  }

  // initialize everything
  ApplyLocalisation();

  //if ( !window.location.href.includes("nogoalshide") )
  //  SetGoalsTimer();
  
  Update();
})();
