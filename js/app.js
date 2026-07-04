// AETHOS app shell — spatial view routing (hash deep-linking), contact-form
// validation, and the live HUD coordinate readout. No framework, no build.

(function initApp() {
  "use strict";

  const VIEWS = ["index", "work", "capabilities", "studio", "contact"];
  const MIN_BRIEF_LENGTH = 12;
  const stage = document.getElementById("stage");
  const navButtons = Array.from(document.querySelectorAll(".orbital button[data-view]"));
  const coordReadout = document.querySelector("[data-coords]");

  const viewFromHash = function viewFromHash() {
    const requested = (location.hash || "#index").replace("#", "");
    return VIEWS.includes(requested) ? requested : "index";
  };

  const activateView = function activateView(name, focusHeading) {
    stage.querySelectorAll(".view").forEach(function togglePanel(panel) {
      const isActive = panel.dataset.view === name;
      panel.classList.toggle("is-active", isActive);
      panel.toggleAttribute("hidden", !isActive);
    });
    navButtons.forEach(function markCurrent(button) {
      button.setAttribute("aria-current", String(button.dataset.view === name));
    });
    if (coordReadout) {
      const ordinal = String(VIEWS.indexOf(name) + 1).padStart(2, "0");
      coordReadout.textContent = `${ordinal} / ${String(VIEWS.length).padStart(2, "0")} · ${name}`;
    }
    if (focusHeading) {
      const heading = stage.querySelector(`.view[data-view="${name}"] [tabindex="-1"]`);
      if (heading) heading.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const goTo = function goTo(name) {
    if (location.hash.replace("#", "") === name) {
      activateView(name, true);
      return;
    }
    location.hash = name; // triggers hashchange → activateView
  };

  navButtons.forEach(function wireNavButton(button) {
    button.addEventListener("click", function onNavClick() {
      goTo(button.dataset.view);
    });
  });
  document.querySelectorAll("[data-goto]").forEach(function wireGoto(link) {
    link.addEventListener("click", function onGotoClick(event) {
      event.preventDefault();
      goTo(link.getAttribute("data-goto"));
    });
  });

  window.addEventListener("hashchange", function onHashChange() {
    activateView(viewFromHash(), true);
  });
  activateView(viewFromHash(), false);

  // ---- Contact form: client-side validation only (no backend in the demo) ----
  const form = document.querySelector("form.signal-form");
  if (!form) return;
  const statusEl = form.querySelector(".form-status");

  const setFieldError = function setFieldError(input, message) {
    const errorEl = form.querySelector(`[data-err-for="${input.name}"]`);
    if (errorEl) errorEl.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
  };

  form.addEventListener("submit", function onSubmit(event) {
    event.preventDefault();
    const nameInput = form.elements.namedItem("name");
    const emailInput = form.elements.namedItem("email");
    const briefInput = form.elements.namedItem("brief");
    let firstInvalid = null;

    const nameError = nameInput.value.trim() ? "" : "Tell us who you are.";
    setFieldError(nameInput, nameError);
    if (nameError && !firstInvalid) firstInvalid = nameInput;

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
    const emailError = emailValid ? "" : "A working email so we can reach you.";
    setFieldError(emailInput, emailError);
    if (emailError && !firstInvalid) firstInvalid = emailInput;

    const briefError = briefInput.value.trim().length >= MIN_BRIEF_LENGTH ? "" : "A sentence or two about the brief.";
    setFieldError(briefInput, briefError);
    if (briefError && !firstInvalid) firstInvalid = briefInput;

    if (firstInvalid) {
      firstInvalid.focus();
      statusEl.dataset.state = "err";
      statusEl.textContent = "Check the highlighted fields.";
      return;
    }

    statusEl.dataset.state = "ok";
    statusEl.textContent = "Signal received. This is a portfolio demo, so nothing is sent.";
    form.reset();
  });
})();
