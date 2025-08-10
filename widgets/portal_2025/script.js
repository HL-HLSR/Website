// settings
const settings = {
  // updateInterval: 1000 * 60 * 5.2,
  updateInterval: 1000 * 5,
  // corsProxy: "https://bold-grass-47ed.widget-cors.workers.dev/?",
  appid: "400",
  goals: {
    low: 3370,
    high: 10000,
    ultrahigh: 20672
  },
};

// localisation
const localisation = {
  "#GOAL1": {
    en: "Goal 1:",
    ru: "Цель 1:",
    es: "Objetivo 1:",
  },
  "#GOAL2": {
    en: "Goal 2:",
    ru: "Цель 2:",
    es: "Objetivo 2:",
  },
  "#GOAL3": {
    en: "Goal 3:",
    ru: "Цель 3:",
     es: "Objetivo 3:",
  },
  "#PEAK": {
    en: "Peak: ",
    ru: "Пик: ",
    es: "Máximo: ",
  },
  "#PLAYERS": {
    en: "Players",
    ru: "Игроков",
    es: "Jugadores"
  },
};

// util methods
const formatNumber = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// main code
(function () {
  window.debug = { enabled: false, online: 10152, peak: 921 };

  const lang = window.location.href.includes("#ru") ? "ru" : window.location.href.includes("#es") ? "es" : "en";

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
    document.querySelector("#high_goal").innerHTML = formatNumber(
      settings.goals.high
    );
    document.querySelector("#ultrahigh_goal").innerHTML = formatNumber(
      settings.goals.ultrahigh
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

    if (count < settings.goals.low) {
      goals[0].classList = "goal main";
      goals[1].classList = "goal alt";
      goals[2].classList = "goal alt";
    } else if (count >= settings.goals.low && count < settings.goals.ultrahigh) {
      goals[0].classList = "goal alt";
      goals[1].classList = "goal main";
      goals[2].classList = "goal alt";
    } else if (count >= settings.goals.ultrahigh) {
      goals[0].classList = "goal alt";
      goals[1].classList = "goal alt";
      goals[2].classList = "goal main";
    }
  }

  function interpolate(color1, color2, percent, alpha = 1.0) {
    // Convert the hex colors to RGB values
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);
  
    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    percent = Math.min(Math.max(percent, 0.0), 1.0);
  
    // Interpolate the RGB values
    const c1 = new Color("P3", [r1 / 255, g1 / 255, b1 / 255]);
    const c2 = new Color("P3", [r2 / 255, g2 / 255, b2 / 255]);

    const final = c1.mix(c2, percent, {space: "lch", outputSpace: "a98rgb"});
    final.a = alpha;

    return final;
    // Convert the interpolated RGB values back to a hex color
    // return "#" + ((1 << 24) + (Math.round(final.r * 255) << 16) + (Math.round(final.g * 255) << 8) + Math.round(final.b * 255)).toString(16).slice(1);
  }

  let firstUpdate = true;

  function Update() {
    async function MakeRequest() {
      // try {
      //   const res = await fetch(
      //     `https://api2.hlsr.tk:2024/online`
      //   );
  
      //   const resJson = await res.json();
  
      //   if (window.debug && window.debug.enabled) {
      //     currentOnline = window.debug.online;
      //     peakValue = window.debug.peak;
      //   } else {
      //     currentOnline = resJson.online;
      //     peakValue = resJson.peak;
      //   }
      // } catch(ex) {
      //   console.error(ex);
      // }

      currentOnline = 3847;
      peakValue = Math.max(peakValue, currentOnline);

      const appElement = document.querySelector("#app");

      if (true || (peakValue >= settings.goals.low) && !appElement.classList.contains("shake")) {
        appElement.classList.add("shake");
      }

      if ((true || peakValue >= settings.goals.high) && !confettiStarted) {
        confetti.render();
        confettiStarted = true;
      }

      if (true || (peakValue >= settings.goals.ultrahigh) && !appElement.classList.contains("glitch")) {
        appElement.classList.add("glitch");
      }
      
      // Update color of the circle and text
      let goal1Coeff = Math.max(Math.min(currentOnline / settings.goals.low, 1.0), 0.0);
      let goal2Coeff = Math.max(Math.min(currentOnline / settings.goals.high, 1.0), 0.0);
      let goal3Coeff = Math.max(Math.min(currentOnline / settings.goals.ultrahigh, 1.0), 0.0);

      goal1Coeff = 1.0;
      goal2Coeff = 1.0;
      goal3Coeff = 1.0;

      let glitchColor1 = interpolate("#afbfc5", "#ff700a", goal3Coeff).toString();
      let glitchColor2 = interpolate("#838383", "#d77e3e", goal3Coeff).toString();
      document.documentElement.style.setProperty("--glitch-color-1", glitchColor1);
      document.documentElement.style.setProperty("--glitch-color-2", glitchColor2);

      let globalColor = null;
      if (goal2Coeff < 1.0) {
        globalColor = interpolate("#ffffff", "#27beff", goal2Coeff);
      } else {
        // globalColor = interpolate("#27beff", "#ffb500", (currentOnline - settings.goals.high) / (settings.goals.ultrahigh - settings.goals.high));
        globalColor = interpolate("#27beff", "#ffb500", 1);
      }

      const globalColorStr = `${Math.floor(globalColor.r * 255)}, ${Math.floor(globalColor.g * 255)}, ${Math.floor(globalColor.b * 255)}`;
      document.documentElement.style.setProperty("--color", `rgb(${globalColorStr})`);
      
      globalColor.a = goal3Coeff;
      document.documentElement.style.setProperty("--glow-color", `rgba(${globalColorStr}, ${Math.round(globalColor.a * 255)})`);

      // Uncomment this when the event is over
      // appElement.classList.add("shake");

      UpdateActiveGoal(currentOnline);
      peakValue = Math.max(peakValue, currentOnline);

      hint.removeAttribute("hidden");
      count.innerHTML = formatNumber(currentOnline);
      circle.style.transition = `stroke-dashoffset 400ms linear, color 0.2s ease`;

      let progress = Math.min(Math.max((goal3Coeff), 0.0), 1.0);
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

  // if ( !window.location.href.includes("nogoalshide") )
  //  SetGoalsTimer();
  
  Update();
})();
