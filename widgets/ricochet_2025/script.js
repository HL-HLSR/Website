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
    en: "Goal:",
    ru: "Цель:",
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
  const circleBackground = document.querySelector("#circle-background");

  const radius = parseInt(circle.getAttribute("r"));

  if (isNaN(radius)) {
    console.error("NaN radius");
    return;
  }

  const circumference = radius * 2 * Math.PI;
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circleBackground.style.strokeDasharray = `${circumference} ${circumference}`;

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

  // https://gist.github.com/espetro/bd7555f4363af4f5a81bb324eae76912
  // Converts a #ffffff hex string into an [r,g,b] array
  var h2r = function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  };

  // Inverse of the above
  var r2h = function (rgb) {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
  };

  // Interpolates two [r,g,b] colors and returns an [r,g,b] of the result
  // Taken from the awesome ROT.js roguelike dev library at
  // https://github.com/ondras/rot.js
  var _interpolateColor = function (color1, color2, factor) {
    if (arguments.length < 3) { factor = 0.5; }
    var result = color1.slice();
    for (var i = 0; i < 3; i++) {
      result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
  };

  var rgb2hsl = function (color) {
    var r = color[0] / 255;
    var g = color[1] / 255;
    var b = color[2] / 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = (l > 0.5 ? d / (2 - max - min) : d / (max + min));
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h, s, l];
  };

  var hsl2rgb = function (color) {
    var l = color[2];

    if (color[1] == 0) {
      l = Math.round(l * 255);
      return [l, l, l];
    } else {
      function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      }

      var s = color[1];
      var q = (l < 0.5 ? l * (1 + s) : l + s - l * s);
      var p = 2 * l - q;
      var r = hue2rgb(p, q, color[0] + 1 / 3);
      var g = hue2rgb(p, q, color[0]);
      var b = hue2rgb(p, q, color[0] - 1 / 3);
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
  };

  var _interpolateHSL = function (color1, color2, factor) {
    if (arguments.length < 3) { factor = 0.5; }
    var hsl1 = rgb2hsl(color1);
    var hsl2 = rgb2hsl(color2);
    for (var i = 0; i < 3; i++) {
      hsl1[i] += factor * (hsl2[i] - hsl1[i]);
    }
    return hsl2rgb(hsl1);
  };

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
      } catch (ex) {
        console.error(ex);
      }

      peakValue = Math.max(peakValue, currentOnline);

      const appElement = document.querySelector("#app");

      if ((peakValue >= settings.goals.low) && !appElement.classList.contains("shake")) {
        appElement.classList.add("shake");
        appElement.classList.add("glitch");
        confetti.render();
        confettiStarted = true;

        document.querySelector("#disk").style.filter = "hue-rotate(208deg)"
      }

      // Update color of the circle and text
      let goalCoeff = Math.max(Math.min(currentOnline / settings.goals.low, 1.0), 0.0);

      // goalCoeff = 1.0;

      // let glitchColor1 = interpolate("#ECC1BF", "#E4312B", goalCoeff);
      // let glitchColor2 = interpolate("#838383", "#D7120B", goalCoeff);
      document.documentElement.style.setProperty("--glitch-color-1", "#FFF818");
      document.documentElement.style.setProperty("--glitch-color-2", "#DED959");

      let glowColor = "#FF5500" + (Math.round(goalCoeff * 255)).toString(16).padStart(2, "0");
      document.documentElement.style.setProperty("--glow-color", glowColor);

      globalColor = (goalCoeff >= 1.0) ? "#FFFA48" : "#008CFF";
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
      document.querySelector("#peak-value").innerHTML = formatNumber(peakValue);

      setTimeout(Update, settings.updateInterval + 250);
    }

    if (firstUpdate) {
      circle.style.transition = `0.5s ease`;
      circle.style.strokeDashoffset = `${circumference}`;
      circleBackground.style.strokeDasharray = `${circumference}`;
      firstUpdate = false;
    }

    // delay before the first request
    setTimeout(MakeRequest, 500);
  }

  // initialize everything
  ApplyLocalisation();

  //if ( !window.location.href.includes("nogoalshide") )
  //  SetGoalsTimer();

  Update();
})();
