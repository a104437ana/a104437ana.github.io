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

function fitScrollGraphs() {
  document.querySelectorAll(".scroll-x").forEach(wrapper => {
    const images = Array.from(wrapper.querySelectorAll("img"));
    if (images.length === 0) return;

    images.forEach(img => {
      img.style.transform = "";
      img.style.transformOrigin = "";
      img.style.marginBottom = "";
    });
    wrapper.style.overflowX = "";
    wrapper.style.overflowY = "";
    wrapper.style.height = "";

    const visibleImg = images.find(img => getComputedStyle(img).display !== "none");
    if (!visibleImg) return;

    const containerWidth = wrapper.clientWidth;
    const naturalWidth = visibleImg.offsetWidth;
    const naturalHeight = visibleImg.offsetHeight;

    if (containerWidth > 0 && naturalWidth > containerWidth) {
      const scale = containerWidth / naturalWidth;
      images.forEach(img => {
        img.style.transform = `scale(${scale})`;
        img.style.transformOrigin = "top left";
      });
      wrapper.style.height = `${naturalHeight * scale}px`;
      wrapper.style.overflowX = "hidden";
      wrapper.style.overflowY = "hidden";
    }
  });
}

function refreshGraphFit() {
  document.querySelectorAll(".scroll-x img").forEach(img => {
    if (!img.dataset.fitListenerAttached) {
      img.dataset.fitListenerAttached = "true";
      img.addEventListener("load", refreshGraphFit);
    }
  });
  fitScrollGraphs();
}

document.addEventListener("DOMContentLoaded", () => {
  const age = calculateAge("2004-01-05");
  document.getElementById("years").textContent = age;

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

  document.getElementById("year").textContent = new Date().getFullYear();

  refreshGraphFit();
  window.addEventListener("resize", refreshGraphFit);

  const imagens = Array.from(document.querySelectorAll("img.important"));
  const promessas = imagens.map(img => {
    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
    return new Promise(resolve => {
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener("error", resolve, { once: true });
    });
  });

  Promise.all(promessas).then(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const loader = document.getElementById("loader");
        loader.style.opacity = 0;
        setTimeout(() => (loader.style.display = "none"), 600);
      });
    });
  });
});
