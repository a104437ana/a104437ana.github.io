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
  refreshGraphFit();
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
    refreshGraphFit();
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

  const CHAT_API_URL = "https://a104437ana-github-io.vercel.app/api/chat";

  const chatButton = document.getElementById("chat-toggle");
  const chatPanel = document.getElementById("chat-panel");
  const chatClose = document.getElementById("chat-close");
  const chatBody = document.getElementById("chat-body");
  const chatInput = document.getElementById("chat-input");
  const chatHistory = [];
  let chatSending = false;

  chatButton.addEventListener("click", () => {
    chatPanel.classList.toggle("open");
  });

  chatClose.addEventListener("click", () => {
    chatPanel.classList.remove("open");
  });

  function addMessage(role, text) {
    const row = document.createElement("div");
    row.className = role === "user" ? "chat-row chat-row--user" : "chat-row chat-row--bot";
    const bubble = document.createElement("div");
    bubble.className = "chat-panel-message";
    bubble.textContent = text;
    row.appendChild(bubble);
    chatBody.appendChild(row);
    chatBody.scrollTop = chatBody.scrollHeight;
    return bubble;
  }

  chatInput.addEventListener("keydown", async e => {
    if (e.key !== "Enter" || chatSending) return;
    const text = chatInput.value.trim();
    if (!text) return;

    chatSending = true;
    chatInput.value = "";
    chatInput.disabled = true;

    addMessage("user", text);
    const typingBubble = addMessage("bot", "...");

    try {
      const response = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: chatHistory })
      });

      if (!response.ok) throw new Error("bad response");

      const data = await response.json();
      typingBubble.textContent = data.reply;

      chatHistory.push({ role: "user", content: text });
      chatHistory.push({ role: "assistant", content: data.reply });
    } catch {
      typingBubble.textContent = "Não consegui responder agora, tenta outra vez daqui a pouco.";
    } finally {
      chatSending = false;
      chatInput.disabled = false;
      chatInput.focus();
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  });
});
