/**
 * Taichi Okada — Portfolio v3
 * Lightweight interaction layer for bilingual content, motion, navigation,
 * progressive scroll effects, and the contact form.
 */

(function () {
  "use strict";

  const LANG_KEY = "lang";
  const DEFAULT_LANG = "ja";
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const PAGE_META = {
    home: {
      ja: {
        title: "岡田泰地 | Profile & Selected Work",
        description: "岡田泰地のプロフィール・経歴・実績。業務改善・自動化の実装パートナーOneddyの運営者として、現場理解と使い続けられる仕組みを大切にしています。",
      },
      en: {
        title: "Taichi Okada | Profile & Selected Work",
        description: "The profile, selected work and approach of Taichi Okada, who runs Oneddy, an implementation partner for workflow improvement and automation.",
      },
    },
    works: {
      ja: {
        title: "実績 / Works | Taichi Okada",
        description: "岡田泰地の実績紹介。Web制作、AI学習コンテンツ、管理・請求業務ツールについて、取り組んだ課題と担当範囲を紹介します。",
      },
      en: {
        title: "Selected Work | Taichi Okada",
        description: "Selected work by Taichi Okada, with the context and scope of each project across websites, AI learning content and internal workflow tools.",
      },
    },
    about: {
      ja: {
        title: "About | Taichi Okada",
        description: "岡田泰地の経験と仕事の考え方。顧客対応・業務運用を起点に、業務改善、自動化、AIを業務に適用する取り組みを紹介します。",
      },
      en: {
        title: "About | Taichi Okada",
        description: "Taichi Okada’s background and approach, from customer-facing operations to workflow improvement, automation and applying AI to everyday work.",
      },
    },
    contact: {
      ja: {
        title: "お問い合わせ | Oneddy・岡田泰地",
        description: "Oneddyの初回相談は無料30分。フォーム受付後に日程を調整します。業務改善・自動化・AI活用、協業・紹介の共通窓口です。",
      },
      en: {
        title: "Contact | Oneddy / Taichi Okada",
        description: "Contact Oneddy / Taichi Okada. The initial Oneddy consultation is free for 30 minutes; scheduling follows receipt of your form.",
      },
    },
  };

  const FORM_MESSAGES = {
    ja: {
      required: "この項目は必須です",
      email: "有効なメールアドレスを入力してください",
      select: "選択してください",
    },
    en: {
      required: "This field is required",
      email: "Please enter a valid email address",
      select: "Please select an option",
    },
  };

  function prefersReducedMotion() {
    return reduceMotionQuery.matches;
  }

  function getLang() {
    try {
      return localStorage.getItem(LANG_KEY) || DEFAULT_LANG;
    } catch (_error) {
      return DEFAULT_LANG;
    }
  }

  function saveLang(lang) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (_error) {
      // Local storage can be unavailable in hardened browser contexts.
    }
  }

  function replaceDirectText(element, value) {
    const heroInner = element.querySelector(":scope > .hl-inner");
    if (heroInner) {
      heroInner.textContent = value;
      return;
    }

    if (!element.children.length) {
      element.textContent = value;
      return;
    }

    const localizedChild = element.querySelector(":scope > [data-ja]");
    if (localizedChild) return;

    const directText = Array.from(element.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
    );

    if (directText) {
      directText.textContent = value + " ";
      return;
    }

    element.insertBefore(document.createTextNode(value + " "), element.firstChild);
  }

  function applyLang(lang) {
    const safeLang = lang === "en" ? "en" : "ja";
    const isEnglish = safeLang === "en";
    document.documentElement.lang = safeLang;

    document.querySelectorAll("[data-ja]").forEach((element) => {
      const value = element.getAttribute(isEnglish ? "data-en" : "data-ja");
      if (value === null) return;

      if (element.tagName === "OPTION") {
        element.textContent = value;
        return;
      }

      replaceDirectText(element, value);
    });

    document.querySelectorAll("[data-aria-ja]").forEach((element) => {
      const value = element.getAttribute(isEnglish ? "data-aria-en" : "data-aria-ja");
      if (value) element.setAttribute("aria-label", value);
    });

    document.querySelectorAll("[data-alt-ja]").forEach((element) => {
      const value = element.getAttribute(isEnglish ? "data-alt-en" : "data-alt-ja");
      if (value !== null) element.setAttribute("alt", value);
    });

    document.querySelectorAll("[data-placeholder-ja]").forEach((element) => {
      const value = element.getAttribute(isEnglish ? "data-placeholder-en" : "data-placeholder-ja");
      if (value !== null) element.setAttribute("placeholder", value);
    });

    const pageName = document.body.dataset.page || "home";
    const pageMeta = PAGE_META[pageName]?.[safeLang] || PAGE_META.home[safeLang];
    document.title = pageMeta.title;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.content = pageMeta.description;

    document.querySelectorAll(".lang-opt").forEach((option) => {
      option.classList.toggle("is-active", option.dataset.lang === safeLang);
    });

    const languageToggle = document.getElementById("langToggle");
    if (languageToggle) {
      languageToggle.setAttribute(
        "aria-label",
        isEnglish ? "日本語に切り替える" : "Switch to English"
      );
    }

    const brand = document.querySelector(".brand");
    if (brand) {
      brand.setAttribute(
        "aria-label",
        isEnglish ? "Taichi Okada — Home" : "Taichi Okada — トップ"
      );
    }

    const mobileNav = document.getElementById("mobileNav");
    if (mobileNav) {
      mobileNav.setAttribute(
        "aria-label",
        isEnglish ? "Mobile navigation" : "モバイルナビゲーション"
      );
    }

    const heroTags = document.querySelector(".hero-tags");
    if (heroTags) {
      heroTags.setAttribute("aria-label", isEnglish ? "Experience and approach" : "経験と仕事の軸");
    }

    updateMenuLabel();
  }

  function initLanguageToggle() {
    applyLang(getLang());

    const button = document.getElementById("langToggle");
    if (!button) return;

    button.addEventListener("click", () => {
      const nextLang = getLang() === "ja" ? "en" : "ja";
      const update = () => {
        saveLang(nextLang);
        applyLang(nextLang);
      };

      if (!prefersReducedMotion() && document.startViewTransition) {
        document.startViewTransition(update);
      } else {
        update();
      }
    });
  }

  function initHeroReveal() {
    const lines = Array.from(document.querySelectorAll(".hero-headline .hl"));
    if (!lines.length) return;

    lines.forEach((line) => {
      if (line.querySelector(".hl-inner")) return;
      const inner = document.createElement("span");
      inner.className = "hl-inner";
      inner.textContent = line.textContent;
      line.textContent = "";
      line.appendChild(inner);
    });

    if (prefersReducedMotion()) {
      lines.forEach((line) => line.classList.add("is-visible"));
      return;
    }

    lines.forEach((line, index) => {
      window.setTimeout(
        () => line.classList.add("is-visible"),
        150 + index * 140
      );
    });
  }

  function updateMenuLabel() {
    const button = document.getElementById("menuToggle");
    if (!button) return;

    const expanded = button.getAttribute("aria-expanded") === "true";
    const english = getLang() === "en";
    button.setAttribute(
      "aria-label",
      expanded
        ? english
          ? "Close menu"
          : "メニューを閉じる"
        : english
          ? "Open menu"
          : "メニューを開く"
    );
  }

  function setNavInteractive(nav, interactive) {
    if ("inert" in nav) nav.inert = !interactive;
    nav.querySelectorAll("a").forEach((link) => {
      if (interactive) link.removeAttribute("tabindex");
      else link.setAttribute("tabindex", "-1");
    });
  }

  function initMobileNav() {
    const button = document.getElementById("menuToggle");
    const nav = document.getElementById("mobileNav");
    if (!button || !nav) return;

    setNavInteractive(nav, false);

    function close(returnFocus = false) {
      button.setAttribute("aria-expanded", "false");
      nav.setAttribute("aria-hidden", "true");
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      setNavInteractive(nav, false);
      updateMenuLabel();
      if (returnFocus) button.focus();
    }

    function open() {
      button.setAttribute("aria-expanded", "true");
      nav.setAttribute("aria-hidden", "false");
      nav.classList.add("is-open");
      document.body.classList.add("nav-open");
      setNavInteractive(nav, true);
      updateMenuLabel();
    }

    button.addEventListener("click", () => {
      if (button.getAttribute("aria-expanded") === "true") close();
      else open();
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => close());
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".site-header")) close();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
        close(true);
      }
    });

    window.matchMedia("(min-width: 1101px)").addEventListener("change", (event) => {
      if (event.matches) close();
    });
  }

  function initReveal() {
    const items = Array.from(document.querySelectorAll(".reveal-item"));
    if (!items.length) return;

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -6% 0px",
      }
    );

    items.forEach((item) => {
      const siblings = Array.from(item.parentElement?.children || []).filter((child) =>
        child.classList.contains("reveal-item")
      );
      const index = siblings.indexOf(item);
      item.style.setProperty("--reveal-delay", String(Math.min(Math.max(index, 0), 4) * 70) + "ms");
      observer.observe(item);
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        const target = href === "#" ? document.documentElement : document.querySelector(href);
        if (!target) return;

        event.preventDefault();
        const headerHeight = document.querySelector(".site-header")?.offsetHeight || 76;
        const top =
          href === "#"
            ? 0
            : target.getBoundingClientRect().top + window.scrollY - headerHeight - 18;

        window.scrollTo({
          top,
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
      });
    });
  }

  function initScrollEffects() {
    const header = document.querySelector(".site-header");
    const processSection = document.querySelector(".process-section");
    const processFlow = document.querySelector(".process-flow");
    let ticking = false;

    function render() {
      const scrollTop = window.scrollY;
      const scrollable = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      document.documentElement.style.setProperty(
        "--scroll-progress",
        Math.min(Math.max(scrollTop / scrollable, 0), 1).toFixed(4)
      );

      if (header) header.classList.toggle("is-scrolled", scrollTop > 8);

      if (processSection && processFlow) {
        const start = processSection.offsetTop - window.innerHeight * 0.58;
        const end =
          processSection.offsetTop +
          processSection.offsetHeight -
          window.innerHeight * 0.38;
        const progress = Math.min(
          Math.max((scrollTop - start) / Math.max(end - start, 1), 0),
          1
        );
        processFlow.style.setProperty("--process-progress", progress.toFixed(4));
      }

      ticking = false;
    }

    function requestRender() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(render);
    }

    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender, { passive: true });
    render();
  }

  function initProgressBar() {
    const progress = document.createElement("div");
    progress.className = "scroll-progress";
    progress.setAttribute("aria-hidden", "true");
    progress.innerHTML = '<span class="scroll-progress__bar"></span>';
    document.body.appendChild(progress);
  }

  function initPointerLight() {
    if (
      prefersReducedMotion() ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }

    let latestEvent = null;
    let ticking = false;

    window.addEventListener(
      "pointermove",
      (event) => {
        latestEvent = event;
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          document.documentElement.style.setProperty("--pointer-x", String(latestEvent.clientX) + "px");
          document.documentElement.style.setProperty("--pointer-y", String(latestEvent.clientY) + "px");
          document.body.classList.add("has-pointer");
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  function initFaqKeyboardNavigation() {
    const summaries = Array.from(document.querySelectorAll(".faq-q"));
    summaries.forEach((summary, index) => {
      summary.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" && summaries[index + 1]) {
          event.preventDefault();
          summaries[index + 1].focus();
        }
        if (event.key === "ArrowUp" && summaries[index - 1]) {
          event.preventDefault();
          summaries[index - 1].focus();
        }
        if (event.key === "Home" && summaries[0]) {
          event.preventDefault();
          summaries[0].focus();
        }
        if (event.key === "End" && summaries.at(-1)) {
          event.preventDefault();
          summaries.at(-1).focus();
        }
      });
    });
  }

  function formMessage(key) {
    return (FORM_MESSAGES[getLang()] || FORM_MESSAGES.ja)[key];
  }

  function errorElementFor(field) {
    const id = field.getAttribute("aria-describedby");
    return id ? document.getElementById(id) : null;
  }

  function setFieldError(field, message) {
    field.classList.add("has-error");
    field.setAttribute("aria-invalid", "true");
    const error = errorElementFor(field);
    if (error) error.textContent = message;
  }

  function clearFieldError(field) {
    field.classList.remove("has-error");
    field.setAttribute("aria-invalid", "false");
    const error = errorElementFor(field);
    if (error) error.textContent = "";
  }

  function validateForm(form) {
    let valid = true;
    form.querySelectorAll("[required]").forEach((field) => {
      clearFieldError(field);
      const value = field.value.trim();
      if (!value) {
        setFieldError(
          field,
          field.tagName === "SELECT" ? formMessage("select") : formMessage("required")
        );
        valid = false;
      } else if (
        field.type === "email" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        setFieldError(field, formMessage("email"));
        valid = false;
      }
    });
    return valid;
  }

  function showFormStatus(type) {
    const status = document.getElementById("formStatus");
    if (!status) return;

    status.hidden = false;
    const success = status.querySelector(".status-ok");
    const error = status.querySelector(".status-err");
    if (success) success.hidden = type !== "ok";
    if (error) error.hidden = type !== "err";
    applyLang(getLang());
    status.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
    });
  }

  function initContactForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;

    // The existing intake serves both sites; the source is a fixed label, never arbitrary URL data.
    const fromOneddy = new URLSearchParams(window.location.search).get("from") === "oneddy";
    if (fromOneddy) {
      const option = form.querySelector('option[value="ai"]');
      if (option) option.defaultSelected = true;
    }
    const syncSubject = () => {
      form.elements.subject.value = form.elements.inquiry_type.value === "ai"
        ? "[Oneddy] 業務改善・自動化・AI活用のご相談"
        : "[岡田泰地] お問い合わせ";
    };
    form.addEventListener("change", syncSubject);
    syncSubject();

    form.querySelectorAll("[required]").forEach((field) => {
      field.setAttribute("aria-invalid", "false");
      const label = form.querySelector('label[for="' + field.id + '"]');
      if (label) label.classList.add("is-required");
    });

    form.querySelectorAll("input, textarea, select").forEach((field) => {
      field.addEventListener("input", () => clearFieldError(field));
      field.addEventListener("change", () => clearFieldError(field));
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validateForm(form)) {
        form.querySelector(".has-error")?.focus();
        return;
      }

      const button = document.getElementById("submitBtn");
      const action = form.getAttribute("action");
      const preview =
        !action || action === "#" || action === window.location.href.split("#")[0];

      button?.classList.add("is-loading");
      if (button) button.disabled = true;
      form.setAttribute("aria-busy", "true");

      try {
        if (preview) throw new Error("Contact endpoint is not configured");

        const response = await fetch(action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || (!result.success && !result.ok)) {
          throw new Error(result.message || String(response.status));
        }

        form.reset();
        syncSubject();
        showFormStatus("ok");
      } catch (error) {
        console.error("Contact form error:", error);
        showFormStatus("err");
      } finally {
        button?.classList.remove("is-loading");
        if (button) button.disabled = false;
        form.setAttribute("aria-busy", "false");
      }
    });
  }

  function initActiveNavigation() {
    const fileName = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-primary a, .mobile-nav a").forEach((link) => {
      const linkName =
        link.getAttribute("href").split("#")[0].split("/").pop() || "index.html";
      const sameOrigin = new URL(link.href).origin === window.location.origin;
      if (sameOrigin && linkName === fileName) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function updateFooterYear() {
    const year = new Date().getFullYear();
    document.querySelectorAll(".footer-copy").forEach((element) => {
      element.textContent = "© " + year + " Taichi Okada";
    });
  }

  function initReadyState() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => document.body.classList.add("is-ready"));
    });
  }

  function init() {
    initLanguageToggle();
    initHeroReveal();
    initMobileNav();
    initReveal();
    initSmoothScroll();
    initProgressBar();
    initScrollEffects();
    initPointerLight();
    initFaqKeyboardNavigation();
    initContactForm();
    initActiveNavigation();
    updateFooterYear();
    initReadyState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
