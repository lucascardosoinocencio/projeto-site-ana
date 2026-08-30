document.addEventListener("DOMContentLoaded", () => {
gsap.registerPlugin(ScrollTrigger);

// as fontes (Fraunces/Manrope) trocam de fallback pra webfont depois que o
// GSAP já mediu o layout inicial — isso desalinha as posições de pin/scrub
// (a seção "Atendimento" pinava no lugar errado). Recalcula assim que
// as fontes terminam de carregar.
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReducedMotion) {

  // linha assinatura: tensão → alívio
  // gera pontos verticais; amplitude do zigzag diminui conforme o scroll avança até a seção "atendimento"
  const threadPath = document.getElementById("threadPath");
  const POINTS = 36;
  const noise = Array.from({length: POINTS}, () => (Math.random() * 2 - 1));
  // suaviza o noise pra não ficar caótico demais (média com vizinhos)
  for(let pass=0; pass<2; pass++){
    for(let i=1;i<POINTS-1;i++){ noise[i] = (noise[i-1]+noise[i]+noise[i+1])/3; }
  }
  function drawThread(amp){
    const h = 1000;
    let d = "";
    for(let i=0;i<POINTS;i++){
      const y = (i/(POINTS-1)) * h;
      const x = 30 + noise[i] * amp;
      d += (i===0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1) + " ";
    }
    threadPath.setAttribute("d", d);
  }
  drawThread(16);
  const threadProxy = { amp: 16 };
  gsap.to(threadProxy, {
    amp: 0,
    ease: "none",
    onUpdate: () => drawThread(threadProxy.amp),
    scrollTrigger: {
      trigger: ".tecnicas",
      start: "top top",
      endTrigger: "footer",
      end: "top center",
      scrub: 0.4
    }
  });

  // floating whatsapp appears after hero
  gsap.to("#floatWhats", {
    opacity: 1, scale: 1, duration: 0.4,
    scrollTrigger: { trigger: ".hero", start: "bottom top", toggleActions: "play reverse play reverse" }
  });

  // intro: foto + texto sobem juntos
  gsap.to("#introPhoto", {
    opacity: 1, y: 0, duration: 1,
    scrollTrigger: { trigger: ".intro", start: "top 75%" }
  });
  gsap.to("#leadText", {
    opacity: 1, y: 0, duration: 1, delay: 0.15,
    scrollTrigger: { trigger: ".intro", start: "top 75%" }
  });

  // técnicas cards staggered reveal
  gsap.to(".card-tec", {
    opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power2.out",
    scrollTrigger: { trigger: ".grid-tec", start: "top 80%" }
  });

  // atendimento pinned scrollytelling
  const steps = gsap.utils.toArray(".atendimento-step");
  const progressFill = document.getElementById("atendimentoProgressFill");
  const progressCount = document.getElementById("atendimentoProgressCount");
  const avImgs = gsap.utils.toArray(".atendimento-visual .av-img");
  const pad2 = (n) => String(n).padStart(2, "0");
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#atendimento",
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      pin: ".atendimento-pin",
      onUpdate: (self) => {
        const stepIndex = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
        progressCount.textContent = `${pad2(stepIndex + 1)} — ${pad2(steps.length)}`;
        progressFill.style.width = `${((stepIndex + 1) / steps.length) * 100}%`;
        avImgs.forEach((pic) => {
          const matches = pic.dataset.steps.split(",").map(Number).includes(stepIndex);
          pic.classList.toggle("is-active", matches);
        });
      }
    }
  });
  steps.forEach((step) => {
    tl.to(step, { opacity: 1, duration: 0.5 })
      .to(step, { opacity: 1, duration: 1 })
      .to(step, { opacity: 0, duration: 0.5 });
  });
  const avImgTargets = document.querySelectorAll(".atendimento-visual img");
  if (avImgTargets.length) {
    tl.fromTo(avImgTargets, { scale: 1.1 }, { scale: 1, ease: "none", duration: tl.duration() }, 0);
  }

  // galeria items reveal
  gsap.to(".g-item", {
    opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: "power2.out",
    scrollTrigger: { trigger: ".galeria-grid", start: "top 80%" }
  });

  // depoimento cards fade in
  gsap.from(".depoimentos .dep-card", {
    opacity: 0, y: 30, duration: 0.8, stagger: 0.1,
    scrollTrigger: { trigger: ".depoimentos", start: "top 75%" }
  });

  // resultados cards fade in
  gsap.from(".resultados .dep-card", {
    opacity: 0, y: 30, duration: 0.8, stagger: 0.1,
    scrollTrigger: { trigger: ".resultados", start: "top 75%" }
  });

  // cabeçalhos de seção (eyebrow + título + parágrafo de cada bloco)
  gsap.utils.toArray(".tecnicas-head, .galeria-head, .faq-head, .depoimentos-head").forEach((head) => {
    gsap.from(head, {
      opacity: 0, y: 24, duration: 0.8, ease: "power2.out",
      scrollTrigger: { trigger: head, start: "top 85%" }
    });
  });

  // depoimentos em vídeo
  gsap.from(".video-dep-card", {
    opacity: 0, y: 24, duration: 0.7, stagger: 0.12, ease: "power2.out",
    scrollTrigger: { trigger: ".video-dep-grid", start: "top 80%" }
  });

  // itens do FAQ
  gsap.from(".faq-item", {
    opacity: 0, y: 20, duration: 0.6, stagger: 0.08, ease: "power2.out",
    scrollTrigger: { trigger: ".faq", start: "top 80%" }
  });

  // bloco de contato
  gsap.from(".contato .eyebrow, .contato h2, .contato .btn-whats", {
    opacity: 0, y: 20, duration: 0.6, stagger: 0.1, ease: "power2.out",
    scrollTrigger: { trigger: ".contato", start: "top 85%" }
  });

} else {
  // sem animação: garante que tudo fica visível de cara
  document.querySelectorAll("#introPhoto, #leadText, .card-tec, .atendimento-step, .g-item, .dep-card").forEach(el => {
    el.style.opacity = 1;
    el.style.transform = "none";
  });
  document.getElementById("floatWhats").style.opacity = 1;
  document.getElementById("floatWhats").style.transform = "scale(1)";
  document.getElementById("threadSvg").style.display = "none";
}

// typing effect on hero word
const typingTarget = document.getElementById("typingWord");
const typingWords = ["reiniciar", "respirar", "se cuidar"];
let twIndex = 0, twChar = 0, deleting = false;
function typeLoop(){
  const word = typingWords[twIndex];
  if(!deleting){
    twChar++;
    typingTarget.textContent = word.slice(0, twChar);
    if(twChar === word.length){ deleting = true; setTimeout(typeLoop, 1600); return; }
  } else {
    twChar--;
    typingTarget.textContent = word.slice(0, twChar);
    if(twChar === 0){ deleting = false; twIndex = (twIndex+1) % typingWords.length; }
  }
  setTimeout(typeLoop, deleting ? 45 : 85);
}
if (!prefersReducedMotion) typeLoop(); else typingTarget.textContent = typingWords[0];

// carrossel genérico (usado em depoimentos e resultados)
function createCarousel(trackId, navId, ariaLabelPrefix){
  const track = document.getElementById(trackId);
  const nav = document.getElementById(navId);
  const cards = Array.from(track.querySelectorAll(".dep-card"));
  let index = 0;

  cards.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = "dep-dot" + (i === 0 ? " active" : "");
    dot.setAttribute("role", "button");
    dot.setAttribute("aria-label", ariaLabelPrefix + " " + (i + 1));
    dot.addEventListener("click", () => { goTo(i); resetAutoplay(); });
    nav.appendChild(dot);
  });

  function goTo(i){
    index = i;
    const cardWidth = cards[0].getBoundingClientRect().width + 32;
    // em telas largas cabem vários cards por vez — não deixa deslizar além do
    // ponto em que o último card encosta na borda direita (senão sobra vazio)
    const maxOffset = Math.max(0, track.scrollWidth - track.clientWidth);
    const offset = Math.min(i * cardWidth, maxOffset);
    track.style.transform = `translateX(-${offset}px)`;
    nav.querySelectorAll(".dep-dot").forEach((d, di) => d.classList.toggle("active", di === i));
  }

  let autoplay;
  function startAutoplay(){
    autoplay = setInterval(() => goTo((index + 1) % cards.length), 5000);
  }
  function resetAutoplay(){
    clearInterval(autoplay);
    startAutoplay();
  }
  startAutoplay();
}
createCarousel("depTrack", "depNav", "Ir para depoimento");
createCarousel("resTrack", "resNav", "Ir para resultado");

// menu mobile
const siteNav = document.getElementById("siteNav");
const navToggle = document.getElementById("navToggle");
function closeNav(){
  siteNav.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Abrir menu");
}
function openNav(){
  siteNav.classList.add("open");
  navToggle.setAttribute("aria-expanded", "true");
  navToggle.setAttribute("aria-label", "Fechar menu");
}
navToggle.addEventListener("click", () => {
  siteNav.classList.contains("open") ? closeNav() : openNav();
});
document.querySelectorAll("#navLinks a").forEach(a => a.addEventListener("click", closeNav));
document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeNav(); });

// nav sólida fora do hero — evita que o título de qualquer seção "vaze"
// visualmente por trás da logo (mix-blend-mode só faz sentido sobre a foto)
const heroSection = document.querySelector(".hero");
if (heroSection && "IntersectionObserver" in window) {
  const heroObserver = new IntersectionObserver(
    (entries) => entries.forEach(entry => siteNav.classList.toggle("nav-solid", !entry.isIntersecting)),
    { threshold: 0 }
  );
  heroObserver.observe(heroSection);
} else {
  siteNav.classList.add("nav-solid");
}

// cards de depoimento/resultado (foto em object-fit:contain) — preenche o
// espaço vazio ao redor da foto com a própria imagem borrada, em vez de
// deixar fundo liso sobrando quando a proporção da foto não bate com o card
document.querySelectorAll(".dep-img-wrap").forEach(wrap => {
  const img = wrap.querySelector("img");
  if (!img) return;
  const bg = document.createElement("img");
  bg.className = "dep-img-bg";
  bg.src = img.currentSrc || img.src;
  bg.alt = "";
  bg.setAttribute("aria-hidden", "true");
  wrap.insertBefore(bg, wrap.firstChild);
});

// depoimentos em vídeo — play customizado no lugar dos controles nativos
document.querySelectorAll(".video-dep-frame").forEach(frame => {
  const video = frame.querySelector("video");
  const playBtn = frame.querySelector(".video-play-btn");
  playBtn.addEventListener("click", () => {
    frame.classList.add("is-playing");
    video.setAttribute("controls", "");
    video.play();
  });
  video.addEventListener("ended", () => {
    frame.classList.remove("is-playing");
    video.removeAttribute("controls");
  });
});

// FAQ accordion
document.querySelectorAll(".faq-item").forEach(item => {
  item.querySelector(".faq-q").addEventListener("click", () => {
    const isOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("open"));
    if(!isOpen) item.classList.add("open");
  });
});

}); // fim do DOMContentLoaded

// Consentimento de cookies (LGPD) — Google Analytics só carrega depois do
// aceite explícito. Troque GA_MEASUREMENT_ID pelo ID real (formato
// G-XXXXXXXXXX) assim que a conta do Google Analytics 4 for criada.
(function(){
  const GA_MEASUREMENT_ID = "G-7RM1QKJE3P";
  const CONSENT_KEY = "cookieConsent";

  function loadGoogleAnalytics(){
    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.indexOf("XXXX") !== -1) return;
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const banner = document.getElementById("cookieBanner");
    const acceptBtn = document.getElementById("cookieAccept");
    const rejectBtn = document.getElementById("cookieReject");
    const manageBtn = document.getElementById("cookieManage");

    function showBanner(){
      banner.hidden = false;
      requestAnimationFrame(() => banner.classList.add("is-visible"));
    }
    function hideBanner(){
      banner.classList.remove("is-visible");
      setTimeout(() => { banner.hidden = true; }, 400);
      manageBtn.hidden = false;
    }

    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent === "accepted") {
      loadGoogleAnalytics();
      manageBtn.hidden = false;
    } else if (consent === "rejected") {
      manageBtn.hidden = false;
    } else {
      showBanner();
    }

    acceptBtn.addEventListener("click", () => {
      localStorage.setItem(CONSENT_KEY, "accepted");
      loadGoogleAnalytics();
      hideBanner();
    });
    rejectBtn.addEventListener("click", () => {
      localStorage.setItem(CONSENT_KEY, "rejected");
      hideBanner();
    });
    manageBtn.addEventListener("click", showBanner);
  });
})();
