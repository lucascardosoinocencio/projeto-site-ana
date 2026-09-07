document.addEventListener("DOMContentLoaded", () => {

// menu mobile — mesma lógica do script.js da página principal, sem as
// partes que dependem de elementos que só existem lá (hero, carrosséis).
const siteNav = document.getElementById("siteNav");
const navToggle = document.getElementById("navToggle");
let navScrollLockY = 0;

function closeNav(){
  siteNav.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Abrir menu");
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  const html = document.documentElement;
  const prevBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  window.scrollTo(0, navScrollLockY);
  html.style.scrollBehavior = prevBehavior;
}
function openNav(){
  siteNav.classList.add("open");
  navToggle.setAttribute("aria-expanded", "true");
  navToggle.setAttribute("aria-label", "Fechar menu");
  navScrollLockY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${navScrollLockY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
}
navToggle.addEventListener("click", () => {
  siteNav.classList.contains("open") ? closeNav() : openNav();
});
document.querySelectorAll("#navLinks a").forEach(a => a.addEventListener("click", closeNav));
document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeNav(); });

}); // fim do DOMContentLoaded

// Consentimento de cookies (LGPD) — idêntico ao da página principal, pra
// manter a mesma escolha (aceitar/recusar) salva no localStorage
// funcionando igual em todas as páginas do site.
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
