function calculateAge(birthDateStr) {
  const birthDate = new Date(birthDateStr);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age--;
  }
  return age;
}

function ajustarAlturaMobile() {
  if (window.innerWidth <= 768) {
    const header = document.getElementById("header");
    const headerHeight = header ? header.offsetHeight : 0;
    const viewportHeight = window.innerHeight;

    const home = document.getElementById("home");
    home.style.minHeight = `${viewportHeight - headerHeight + 3}px`;
  }
}

function bloquearScroll() {
  const scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
  document.body.dataset.scrollY = scrollY;
}

function desbloquearScroll() {
  const scrollY = document.body.dataset.scrollY;
  document.body.style.position = "";
  document.body.style.top = "";
  window.scrollTo(0, parseInt(scrollY || "0"));
}

function copiarTexto(imgElement, texto) {
  navigator.clipboard.writeText(texto).then(() => {
    const originalSrc = "assets/icons/Copy.png";
    const checkSrc = "assets/icons/Check.png";
    if (imgElement.dataset.timeoutId) {
      clearTimeout(imgElement.dataset.timeoutId);
    }
    imgElement.src = checkSrc;
    const timeoutId = setTimeout(() => {
      imgElement.src = originalSrc;
      imgElement.dataset.timeoutId = "";
    }, 2000);
    imgElement.dataset.timeoutId = timeoutId;
  }).catch(err => {
    console.error("Error copying text: ", err);
  });
}

function focusInput(linha) {
  const input = linha.querySelector("input");
  if (input) {
    input.focus();
  }
}

function runTerminalCommand(real_command, output, terminal, commandInput) {
  const command = real_command.trim().toLowerCase();
  const commands = command.split(/\s+/);
  const isPt = document.documentElement.lang === "pt";

  output.innerHTML += `<div>$ ${real_command}</div>`;

  if (commands[0] === "help" && commands.length === 1) {
    output.innerHTML += isPt
      ? `<div>Comandos disponíveis: <br>help, whoami, date, pwd, ls, cat README.md, cat untitled.txt, clear</div>`
      : `<div>Available commands: <br>help, whoami, date, pwd, ls, cat README.md, cat untitled.txt, clear</div>`;
  } else if (command === "whoami" && commands.length === 1) {
    output.innerHTML += isPt ? `<div>um visitante misterioso</div>` : `<div>a mysterious internet stranger</div>`;
  } else if (commands[0] === "date" && commands.length === 1) {
    const now = new Date();
    const dateOptions = {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    };
    const formatted = isPt
      ? now.toLocaleString("pt-BR", dateOptions).replace(/\bde\b|[.,]/gi, "").trim()
      : now.toLocaleString("en-UK", dateOptions).replace(/\bde\b|[.,]/gi, "").trim();
    output.innerHTML += `<div>${formatted}</div>`;
  } else if (command === "pwd" && commands.length === 1) {
    output.innerHTML += `<div>/home/ana</div>`;
  } else if (commands[0] === "ls" && commands.length === 1) {
    output.innerHTML += `<div>README.md&nbsp;&nbsp;&nbsp;untitled.txt</div>`;
  } else if (commands[0] === "cat" && commands[1] === "untitled.txt" && commands.length === 2) {
    output.innerHTML += isPt
      ? `<div>&nbsp;|\\-----/|<br>&nbsp;| o_o | < miau<br>&nbsp;&nbsp;\\_^_/<br></div>`
      : `<div>&nbsp;|\\-----/|<br>&nbsp;| o_o | < meow<br>&nbsp;&nbsp;\\_^_/<br></div>`;
  } else if (commands[0] === "cat" && commands[1] === "readme.md" && commands.length === 2) {
    output.innerHTML += isPt
      ? `<div># Enigma<br>Qual é a coisa, qual é ela, que corre mas não tem pernas, assobia mas não tem boca, ninguém nunca viu e tem muita força?</div>`
      : `<div># Riddle<br>What is something that runs but has no legs, whistles but has no mouth, no one has ever seen it, and it has great power?</div>`;
  } else if (commands[0] === "clear" && commands.length === 1) {
    output.innerHTML = "";
  } else if ((commands[0] === "vento" || commands[0] === "wind") && commands.length === 1) {
    window.open("/assets/video/video.mp4", "_blank");
    output.innerHTML += isPt
      ? `<div>༄༄༄༄༄༄<br>Olha só o que o vento trouxe! Acabaste de levar um rickroll! hahaha</div>`
      : `<div>༄༄༄༄༄༄<br>Look what the wind blew in! You just got rickrolled! hahaha</div>`;
  } else if ((commands[0] === "miau" || commands[0] === "meow") && commands.length === 1) {
    window.open("/assets/video/video2.mp4", "_blank");
    output.innerHTML += `<div>^_^</div>`;
  } else {
    output.innerHTML += isPt ? `<div>${real_command}: comando não encontrado</div>` : `<div>${real_command}: command not found</div>`;
  }

  commandInput.value = "";
  terminal.scrollTop = terminal.scrollHeight;
}

document.addEventListener("DOMContentLoaded", () => {
  const age = calculateAge("2004-01-05");
  document.getElementById("years").textContent = age;

  const aboutContent = document.querySelector(".about-content");
  const aboutLaptop = document.querySelector(".about-laptop");
  if (aboutContent && aboutLaptop) {
    const mobileQuery = window.matchMedia("(max-width: 700px)");
    const repositionLaptop = e => {
      if (e.matches) {
        aboutContent.appendChild(aboutLaptop);
      } else {
        aboutContent.insertBefore(aboutLaptop, aboutContent.firstChild);
      }
    };
    repositionLaptop(mobileQuery);
    mobileQuery.addEventListener("change", repositionLaptop);
  }

  const indicator = document.getElementById("scroll-indicator");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      indicator.style.opacity = "0";
      indicator.style.pointerEvents = "none";
    } else {
      indicator.style.opacity = "0.8";
      indicator.style.pointerEvents = "auto";
    }
  });

  const meuForm = document.getElementById("meuForm");
  meuForm.addEventListener("submit", function(event) {
    event.preventDefault();
    let valido = true;

    const nome = document.getElementById("nome");
    const erroNome = document.getElementById("erro-nome");
    if (!nome.value.trim()) {
      erroNome.style.display = "inline";
      valido = false;
    } else {
      erroNome.style.display = "none";
    }

    const email = document.getElementById("email");
    const erroEmail = document.getElementById("erro-email");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!email.value.trim()) {
      erroEmail.style.display = "inline";
      valido = false;
    } else if (!emailRegex.test(email.value.trim())) {
      erroEmail.style.display = "inline";
      valido = false;
    } else {
      erroEmail.style.display = "none";
    }

    const mensagem = document.getElementById("mensagem");
    const erroMensagem = document.getElementById("erro-mensagem");
    if (!mensagem.value.trim()) {
      erroMensagem.style.display = "inline";
      valido = false;
    } else {
      erroMensagem.style.display = "none";
    }

    if (!valido) {
      return;
    }

    const sendingText = document.getElementById("sending");
    sendingText.style.display = "inline";
    const form = event.target;
    const formData = new FormData(form);

    const popup1 = document.getElementById("popup1");
    const popup2 = document.getElementById("popup2");
    const popup3 = document.getElementById("popup3");

    fetch(form.action, {
      method: form.method,
      body: formData,
      headers: { Accept: "application/json" }
    })
      .then(response => {
        if (response.ok) {
          popup1.style.display = "flex";
          form.reset();
          bloquearScroll();
        } else {
          popup2.style.display = "flex";
          bloquearScroll();
        }
      })
      .catch(() => {
        popup3.style.display = "flex";
        bloquearScroll();
      });
  });

  const commandInput = document.getElementById("command");
  const output = document.getElementById("output");
  const terminal = document.getElementById("terminal");

  commandInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      const real_command = commandInput.value.trim();
      if (real_command) {
        runTerminalCommand(real_command, output, terminal, commandInput);
      }
    }
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  window.addEventListener("load", () => {
    ajustarAlturaMobile();

    const imagens = Array.from(document.querySelectorAll("img.important"));
    const promessas = imagens.map(img => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise(resolve => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    });

    const timeoutGlobal = new Promise(resolve => setTimeout(resolve, 6000));

    Promise.race([Promise.all(promessas), timeoutGlobal]).then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const loader = document.getElementById("loader");
            loader.style.opacity = 0;
            setTimeout(() => (loader.style.display = "none"), 600);
          }, 100);
        });
      });
    });
  });
});
