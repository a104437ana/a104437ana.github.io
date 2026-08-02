let currentLang = localStorage.getItem("lang") || navigator.language.slice(0, 2) || "en";

function setLanguage(lang) {
  document.querySelectorAll("[data-pt]").forEach(el => {
    if (el.id === "output") {
      el.innerHTML = "";
    } else if (el.tagName.toLowerCase() === "input" || el.tagName.toLowerCase() === "textarea") {
      if (!el.dataset.en) el.dataset.en = el.placeholder;
      el.placeholder = lang === "pt" ? el.dataset.pt : el.dataset.en;
    } else {
      if (!el.dataset.en) el.dataset.en = el.innerHTML;
      el.innerHTML = lang === "pt" ? el.dataset.pt : el.dataset.en;
    }
    el.style.visibility = "visible";
  });
  document.documentElement.lang = lang;
  currentLang = lang;
  localStorage.setItem("lang", lang);
}

document.addEventListener("DOMContentLoaded", () => {
  setLanguage(currentLang);
});

const slowImage = new Image();
slowImage.src = "/assets/icons/flag-ukus.png";
const slowImage2 = new Image();
slowImage2.src = "/assets/icons/flag-pt.png";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;

  const themeButton = document.getElementById("theme-toggle");

  themeButton.addEventListener("click", () => {
    const darkModeActive = root.classList.toggle("dark-mode");
    themeButton.textContent = darkModeActive ? "☀️" : "🌙";
    localStorage.setItem("theme", darkModeActive ? "dark" : "light");
  });

  const langButton = document.getElementById("lang-toggle");
  const langIcon = document.getElementById("lang-icon");
  const langIcons = { en: "/assets/icons/flag-pt.png", pt: "/assets/icons/flag-ukus.png" };

  function updateLangButton(lang) {
    langIcon.src = langIcons[lang];
    langIcon.alt = lang === "en" ? "English" : "Portuguese";
  }

  updateLangButton(currentLang);

  langButton.addEventListener("click", () => {
    const newLang = currentLang === "en" ? "pt" : "en";
    setLanguage(newLang);
    updateLangButton(newLang);
  });
});
