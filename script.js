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
        description: "岡田泰地のプロフィール・経歴・実績。AI教材と業務ツールの設計・制作の経験をもとに、Oneddyで経営者のAI活用サポートと業務改善の実装支援に取り組んでいます。",
      },
      en: {
        title: "Taichi Okada | Profile & Selected Work",
        description: "The profile and work of Taichi Okada. Drawing on AI learning content and workflow tools, Oneddy offers personal AI coaching for business owners and workflow implementation support.",
      },
    },
    works: {
      ja: {
        title: "実績 / Works | Taichi Okada",
        description: "岡田泰地の実績紹介。AI学習コンテンツ、管理・請求業務ツール、Web制作について、取り組んだ課題と担当範囲を紹介します。",
      },
      en: {
        title: "Selected Work | Taichi Okada",
        description: "Selected work by Taichi Okada: AI learning content, internal workflow tools and websites, with the context and scope of each project.",
      },
    },
    about: {
      ja: {
        title: "岡田泰地について｜AI活用・業務改善の経験",
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

  // Keep this small offer snapshot in sync with oneddy-sites/content/site.json.
  // npm run build/check rejects a mismatch; change stage manually after actual initial delivery.
  const ADVISORY_OFFER = {
  "stage": "initial",
  "experiencePrice": 22000,
  "experienceMinutes": 90,
  "experienceSegments": [
    10,
    15,
    20,
    35,
    10
  ],
  "initialPrice": 99000,
  "regularPrice": 132000,
  "initialClients": 2,
  "weeks": 4,
  "sessions": [
    90,
    60,
    45,
    30
  ],
  "assignments": 3
};
  let syncContactContext = () => {};

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
    syncContactContext();
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
    document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach((link) => {
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
    return id ? id.split(/\s+/).map((value) => document.getElementById(value)).find((element) => element?.classList.contains("field-err")) : null;
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

    // Only fixed query values select a service. Raw URL text never becomes copy or a subject.
    const query = new URLSearchParams(window.location.search);
    const serviceTypes = { advisory: "ai_advisory", implementation: "ai", undecided: "oneddy_consultation" };
    const category = form.elements.inquiry_type;
    const plan = form.elements.advisory_plan;
    const initialType = (Object.hasOwn(serviceTypes, query.get("service")) ? serviceTypes[query.get("service")] : "") ||
      (query.get("from") === "oneddy" || query.has("service") || query.get("inquiry_type") === "ai" ? "ai" : "");
    const initialPlan = query.get("service") === "advisory" && ["experience", "program"].includes(query.get("plan"))
      ? query.get("plan") : "undecided";
    [...category.options].forEach((option) => { option.defaultSelected = option.value === initialType; });
    [...plan.options].forEach((option) => { option.defaultSelected = option.value === initialPlan; });
    category.value = initialType;
    plan.value = initialPlan;

    const contexts = {
      experience: {
        title: ["90分体験のご相談", "Discuss a 90-minute experience."],
        subject: "[Oneddy] AI実務体験のご相談", path: "/ai-advisory/#experience",
        back: ["AI実務体験の内容へ戻る →", "Back to AI Work Experience →"],
      },
      program: {
        title: ["4週間プログラムのご相談", "Discuss the four-week program."],
        subject: "[Oneddy] AI実務習得・定着プログラムのご相談", path: "/ai-advisory/#program",
        back: ["4週間プログラムの進め方へ戻る →", "Back to the program →"],
      },
      ai_advisory: {
        title: ["自分の仕事でのAI活用", "Discuss using AI in your own work."],
        subject: "[Oneddy] 経営者のAI活用伴走のご相談", path: "/ai-advisory/#plans",
        back: ["AI活用サポートの2つのプランへ戻る →", "Back to AI coaching plans →"],
      },
      ai: {
        title: ["業務改善・自動化のご相談", "Discuss workflow improvement and automation."],
        subject: "[Oneddy] 業務改善・自動化の実装支援のご相談", path: "/implementation/",
        back: ["実装支援の内容へ戻る →", "Back to implementation support →"],
      },
      oneddy_consultation: {
        title: ["無料相談のお申し込み", "Find the right support together."],
        subject: "[Oneddy] ご相談・内容未定", path: "/#contact",
        back: ["Oneddyの2つの支援へ戻る →", "Back to Oneddy’s two services →"],
      },
    };
    const regular = ADVISORY_OFFER.stage === "regular";
    const amount = (value) => value.toLocaleString("ja-JP");
    const programPrice = regular ? ADVISORY_OFFER.regularPrice : ADVISORY_OFFER.initialPrice;
    const sessionTotal = ADVISORY_OFFER.sessions.reduce((sum, minutes) => sum + minutes, 0);
    const feeText = (language) => {
      const experience = amount(ADVISORY_OFFER.experiencePrice);
      const program = amount(programPrice);
      const total = amount(ADVISORY_OFFER.experiencePrice + programPrice);
      if (language === "en") {
        const current = regular ? `Program: JPY ${program} including tax (regular fee).`
          : `Program: JPY ${program} including tax for the first ${ADVISORY_OFFER.initialClients} paid engagements. The regular fee of JPY ${amount(ADVISORY_OFFER.regularPrice)} applies after this initial phase.`;
        const selected = plan.value === "experience" ? `AI Work Experience: JPY ${experience} including tax, one ${ADVISORY_OFFER.experienceMinutes}-minute session.`
          : plan.value === "program" ? current + ` About ${ADVISORY_OFFER.weeks} weeks, ${ADVISORY_OFFER.sessions.length} sessions (${ADVISORY_OFFER.sessions.join(" / ")} minutes; ${sessionTotal} minutes total) and ${ADVISORY_OFFER.assignments} practice assignments.`
          : `Choose together: a ${ADVISORY_OFFER.experienceMinutes}-minute experience (JPY ${experience} including tax) or the four-week program. ${current}`;
        return `${selected} The experience is optional and charged separately, with no credit toward the program. You may start with the program directly; it still includes all four sessions after an experience. Both cost JPY ${total} including tax${regular ? "" : ` in the initial phase, or JPY ${amount(ADVISORY_OFFER.experiencePrice + ADVISORY_OFFER.regularPrice)} at the regular fee`}. AI tool fees are extra. We confirm the applicable fee and terms before you apply.`;
      }
      const current = regular ? `4週間プログラム：通常料金${program}円（税込）。`
        : `4週間プログラム：初期提供価格${program}円（税込・最初の有料${ADVISORY_OFFER.initialClients}件）。通常料金${amount(ADVISORY_OFFER.regularPrice)}円（税込・初期提供後）。`;
      const selected = plan.value === "experience" ? `AI実務体験：${experience}円（税込）・1回${ADVISORY_OFFER.experienceMinutes}分。`
        : plan.value === "program" ? current + ` 約${ADVISORY_OFFER.weeks}週間、面談${ADVISORY_OFFER.sessions.length}回（${ADVISORY_OFFER.sessions.join("・")}分、計${sessionTotal}分）・実践課題${ADVISORY_OFFER.assignments}回。`
        : `相談して決める：${ADVISORY_OFFER.experienceMinutes}分の体験${experience}円（税込）と、約${ADVISORY_OFFER.weeks}週間の4週間プログラムから選べます。${current}`;
      return `${selected} 体験は任意・別料金で、プログラム料金からの差し引きはありません。4週間プログラムへ直接申込みでき、体験後も4週間プログラムは4回です。両方なら${regular ? "合計" : "初期合計"}${total}円${regular ? "" : `、通常合計${amount(ADVISORY_OFFER.experiencePrice + ADVISORY_OFFER.regularPrice)}円`}（税込）。AIツール利用料は別途です。適用料金と提供条件は申込前に確認します。`;
    };
    syncContactContext = () => {
      const english = document.documentElement.lang === "en";
      const languageIndex = english ? 1 : 0;
      const advisory = category.value === "ai_advisory";
      if (!advisory) plan.value = "undecided";
      plan.disabled = !advisory;
      document.getElementById("advisoryPlanField").hidden = !advisory;
      const context = contexts[advisory && plan.value !== "undecided" ? plan.value : category.value];
      document.body.classList.toggle("oneddy-contact", Boolean(context));
      document.documentElement.classList.toggle("oneddy-contact-theme", Boolean(context));
      document.getElementById("contactServiceIdentity").hidden = !context;
      document.getElementById("contactBrand").textContent = context ? "Oneddy / 無料30分相談" : "Taichi Okada / Contact";
      if (english && context) document.getElementById("contactBrand").textContent = "Oneddy / Free 30-minute consultation";
      document.getElementById("contactTitle").textContent = context ? context.title[languageIndex] : (english ? "Get in touch." : "お問い合わせ。");
      document.getElementById("contactIntro").textContent = context
        ? (english ? "Tell me about your work. Taichi Okada will help you find a starting point in a free 30-minute online call."
          : "いまの仕事と困っていることを教えてください。岡田泰地が無料30分のオンライン相談で、進め方を一緒に考えます。")
        : (english ? "For partnerships, introductions or other inquiries, please briefly describe what you have in mind. I typically respond within 2–3 business days."
          : "協業・紹介やその他のご連絡も、こちらで受け付けています。ご相談の内容を簡単にお知らせください。通常2〜3営業日以内にご連絡します。");
      document.getElementById("contactScope").textContent = context
        ? (english ? "Submit → reply within 2–3 business days → arrange a time. Submission does not confirm a booking or contract."
          : "受付 → 通常2〜3営業日以内に返信 → 日程調整。送信だけで予約・契約は確定しません。")
        : (english ? "Choose an Oneddy category below for AI coaching or workflow implementation."
          : "AI活用サポート・業務改善の実装支援をご希望の場合は、下の相談カテゴリから選べます。");
      const back = document.getElementById("serviceBack");
      back.hidden = !context;
      back.href = "https://oneddy.net" + (context?.path || "/");
      back.textContent = context ? context.back[languageIndex] : "";
      document.getElementById("advisoryPrice").textContent = advisory ? feeText(english ? "en" : "ja") : "";
      const selectedFee = plan.value === "experience" ? ADVISORY_OFFER.experiencePrice : programPrice;
      document.getElementById("selectedPrice").textContent = !advisory ? "" : plan.value === "undecided"
        ? (english ? "Experience JPY " : "体験 ") + amount(ADVISORY_OFFER.experiencePrice) + (english ? " / Program JPY " : "円 ／ 4週間プログラム ") + amount(programPrice) + (english ? " · tax included" : "円（税込）")
        : (english ? "JPY " : "") + amount(selectedFee) + (english ? " · tax included" : "円（税込）") + (plan.value === "program" && !regular ? (english ? " · initial fee, first two paid engagements" : "・初期提供価格／最初の有料2件") : "");
      document.getElementById("messageLabel").textContent = context
        ? (english ? "Your work and what you need help with" : "相談したい仕事・困っていること")
        : (english ? "Message" : "内容");
      document.getElementById("messageHelp").textContent = context
        ? (english ? "Briefly describe a recent task and where you got stuck. You do not need to have chosen a tool. Do not include customer information or confidential materials."
          : "最近行った仕事と、迷っている場面を簡単に教えてください。ツールが未定でも大丈夫です。顧客情報や機密資料は入力しないでください。")
        : (english ? "Please do not include personal data or confidential materials." : "個人情報や機密資料は入力しないでください。");
      form.elements.message.placeholder = context
        ? (english ? "A recent task, tools you use and what you would like help with." : "最近行った仕事、使っている道具、困っている場面など。")
        : (english ? "Briefly describe your inquiry." : "ご相談の内容を簡単にお書きください。");
      form.elements.subject.value = context?.subject || "[岡田泰地] お問い合わせ";
      document.title = context ? `${context.title[languageIndex]} | Oneddy` : PAGE_META.contact[english ? "en" : "ja"].title;
    };
    category.addEventListener("change", () => { plan.value = "undecided"; syncContactContext(); });
    plan.addEventListener("change", syncContactContext);
    form.addEventListener("reset", () => {
      queueMicrotask(() => {
        form.querySelectorAll("[required]").forEach(clearFieldError);
        syncContactContext();
      });
    });
    syncContactContext();

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
      if (form.getAttribute("aria-busy") === "true") return;
      syncContactContext();
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
        syncContactContext();
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
