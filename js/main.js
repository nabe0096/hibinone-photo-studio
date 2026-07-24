/* ============================================================
   ヒビノネ写真館 — main.js
   ============================================================ */
(function () {
  "use strict";

  const C = window.SITE_CONFIG || SITE_CONFIG;
  // OSの「視差効果を減らす」設定、またはURLに ?static を付けた場合は自動アニメーションを止める
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    || new URLSearchParams(window.location.search).has("static");

  /* ----------------------------------------------------------
     ユーティリティ
  ---------------------------------------------------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }

  function paragraphs(text) {
    return esc(text).split("\n").filter(Boolean).map((t) => `<p>${t}</p>`).join("");
  }

  function voiceParagraphs(text) {
    return esc(text)
      .split(/\n{2,}/)
      .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
      .filter(Boolean)
      .map((t) => `<p>${t}</p>`)
      .join("");
  }

  /* ----------------------------------------------------------
     Loading
  ---------------------------------------------------------- */
  const loading = $("#loading");
  const loadingStartedAt = Date.now();

  function hideLoading() {
    if (!loading) return;
    const wait = Math.max(0, 700 - (Date.now() - loadingStartedAt));
    window.setTimeout(() => {
      loading.classList.add("is-hidden");
      window.setTimeout(() => loading.remove(), 800);
    }, wait);
  }

  if (document.readyState === "complete") {
    hideLoading();
  } else {
    window.addEventListener("load", hideLoading, { once: true });
    window.setTimeout(hideLoading, 3200);
  }

  /* ----------------------------------------------------------
     Header：スクロールで背景切り替え・ハンバーガー
  ---------------------------------------------------------- */
  const header = $("#header");
  const burger = $("#burger");
  const nav = $("#global-nav");

  function onScroll() {
    header.classList.toggle("is-solid", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "メニューを開く");
    document.body.style.overflow = "";
  }
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    document.body.style.overflow = open ? "hidden" : "";
  });

  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-scroll]");
    if (link) closeMenu();
  });

  /* ----------------------------------------------------------
     ふわっと表示（reveal）
  ---------------------------------------------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("is-visible");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((n) => io.observe(n));

  /* ----------------------------------------------------------
     無限ループカルーセル（自動再生のみ）
  ---------------------------------------------------------- */
  function createMarquee(container, track, speed) {
    let offset = 0;
    let halfWidth = 0;
    let lastTime = null;

    // 中身を複製してシームレスにループさせる
    function duplicate() {
      const items = Array.from(track.children);
      if (!items.length) return;

      const appendSet = () => {
        items.forEach((it) => {
          const clone = it.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          clone.querySelectorAll("a, button").forEach((a) => a.setAttribute("tabindex", "-1"));
          track.appendChild(clone);
        });
      };

      appendSet();
      halfWidth = track.scrollWidth / 2;

      let guard = 0;
      while (track.scrollWidth < container.clientWidth * 3 && guard < 8) {
        appendSet();
        guard += 1;
      }
    }

    function measure() {
      if (!halfWidth) halfWidth = track.scrollWidth / 2;
    }

    function apply() {
      if (halfWidth > 0) {
        offset = ((offset % halfWidth) + halfWidth) % halfWidth;
      }
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    }

    function tick(t) {
      if (lastTime === null) lastTime = t;
      const dt = Math.min(t - lastTime, 100);
      lastTime = t;
      if (!reduceMotion) {
        offset += (speed * dt) / 1000;
        apply();
      }
      requestAnimationFrame(tick);
    }

    duplicate();
    requestAnimationFrame(() => {
      measure();
      apply();
      requestAnimationFrame(tick);
    });
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
  }

  /* ----------------------------------------------------------
     First View：写真カルーセル
  ---------------------------------------------------------- */
  const heroTrack = $("#hero-track");
  // 表示サイズの目安（軽量版900pxと高解像度1600pxをブラウザが選ぶ）
  const HERO_SIZES = {
    wide: "(max-width: 767px) 84vw, 47vw",
    tall: "(max-width: 767px) 54vw, 31vw",
    small: "(max-width: 767px) 46vw, 25vw"
  };
  const firstLoads = [];
  function shufflePhotos(list) {
    return [...list]
      .map((photo) => ({ photo, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ photo }) => photo);
  }
  const heroPhotos = Array.isArray(C.heroPool) && C.heroPool.length
    ? shufflePhotos(C.heroPool).slice(0, Math.min(36, C.heroPool.length))
    : C.heroPhotos;

  heroPhotos.forEach((p, i) => {
    const item = el("div", `hero__item hero__item--${p.size}`);
    const img = el("img");
    const small = p.src.replace("images/photos/", "images/photos/900/");
    if (small !== p.src) img.srcset = `${small} 900w, ${p.src} 1600w`;
    img.sizes = HERO_SIZES[p.size] || HERO_SIZES.wide;
    img.src = p.src;
    img.alt = p.alt || "ヒビノネ写真館の撮影写真";
    img.decoding = "async";
    if (i < 4) {
      img.fetchPriority = "high";   // 最初に見える写真を優先して読み込む
    } else {
      img.loading = "lazy";
    }
    const done = new Promise((resolve) => {
      const ok = () => { item.classList.add("is-loaded"); resolve(); };
      if (img.complete && img.naturalWidth) ok();
      else {
        img.addEventListener("load", ok, { once: true });
        img.addEventListener("error", resolve, { once: true });
      }
    });
    if (i < 2) firstLoads.push(done);
    item.appendChild(img);
    heroTrack.appendChild(item);
  });
  createMarquee($("#hero-carousel"), heroTrack, 42);

  // キャッチコピーは最初の写真が表示されてから現れる（最大2秒待ち）
  Promise.race([
    Promise.all(firstLoads),
    new Promise((r) => setTimeout(r, 2000))
  ]).then(() => $(".hero__copy").classList.add("is-visible"));

  /* ----------------------------------------------------------
     Portrait Photo Flow：プロフィール下の写真帯
  ---------------------------------------------------------- */
  const portraitFlow = $("#portrait-flow");
  const portraitFlowTrack = $("#portrait-flow-track");
  if (portraitFlow && portraitFlowTrack) {
    const flowSizes = ["wide", "tall", "small", "wide", "small", "tall"];
    const flowPhotos = (Array.isArray(C.heroPool) && C.heroPool.length)
      ? shufflePhotos(C.heroPool).slice(0, Math.min(30, C.heroPool.length))
      : [];

    flowPhotos.forEach((p, i) => {
      const size = flowSizes[i % flowSizes.length];
      const item = el("figure", `portrait-flow__item portrait-flow__item--${size}`);
      item.innerHTML = `<img src="${esc(p.src)}" alt="${esc(p.alt || "ヒビノネ写真館の撮影写真")}" loading="lazy" decoding="async">`;
      portraitFlowTrack.appendChild(item);
    });

    if (flowPhotos.length) createMarquee(portraitFlow, portraitFlowTrack, 26);
  }

  /* ----------------------------------------------------------
     Select Scene
  ---------------------------------------------------------- */
  const sceneGrid = $("#scene-grid");
  const PLACEHOLDER_SVG = `
    <span class="scene-card__placeholder">
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="17" cy="18" r="4.5"/><circle cx="31" cy="18" r="4.5"/>
        <circle cx="12" cy="28" r="3.8"/><circle cx="36" cy="28" r="3.8"/>
        <path d="M24 26c5 0 9 4 9 8 0 3-2.5 5-5 4.4-1.7-.4-2.6-.8-4-.8s-2.3.4-4 .8c-2.5.6-5-1.4-5-4.4 0-4 4-8 9-8z"/>
      </svg>
    </span>`;

  C.scenes.forEach((s, index) => {
    const li = el("li", "scene-card");
    const photo = s.image
      ? `<img src="${esc(s.image)}" alt="${esc(s.alt)}" loading="lazy" width="900" height="900">`
      : PLACEHOLDER_SVG;
    li.innerHTML = `
      <button type="button" class="scene-card__link" data-scene-index="${index}" aria-haspopup="dialog">
        <span class="scene-card__meta">
          <span class="scene-card__en">${esc(s.en)}</span>
          <span class="scene-card__no">${esc(s.no)}</span>
        </span>
        <span class="scene-card__circle">${photo}</span>
        <span class="scene-card__ja">${esc(s.ja)}</span>
      </button>`;
    sceneGrid.appendChild(li);
  });

  const sceneModal = el("div", "scene-modal");
  sceneModal.setAttribute("role", "dialog");
  sceneModal.setAttribute("aria-modal", "true");
  sceneModal.setAttribute("aria-hidden", "true");
  sceneModal.innerHTML = `
    <button type="button" class="scene-modal__close" aria-label="写真を閉じる">×</button>
    <figure class="scene-modal__figure">
      <img class="scene-modal__img" src="" alt="">
      <div class="scene-modal__placeholder" hidden>
        <span class="scene-modal__placeholder-en">Preparing</span>
        <span class="scene-modal__placeholder-ja">写真は準備中です</span>
      </div>
      <div class="scene-modal__controls" aria-label="写真送り">
        <button type="button" class="scene-modal__nav scene-modal__nav--prev" aria-label="前の写真へ">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>
        </button>
        <button type="button" class="scene-modal__nav scene-modal__nav--next" aria-label="次の写真へ">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
        </button>
      </div>
      <figcaption class="scene-modal__caption">
        <span class="scene-modal__title"></span>
        <span class="scene-modal__count"></span>
      </figcaption>
      <p class="scene-modal__desc"></p>
    </figure>
    `;
  document.body.appendChild(sceneModal);

  const modalImg = $(".scene-modal__img", sceneModal);
  const modalPlaceholder = $(".scene-modal__placeholder", sceneModal);
  const modalTitle = $(".scene-modal__title", sceneModal);
  const modalCount = $(".scene-modal__count", sceneModal);
  const modalDesc = $(".scene-modal__desc", sceneModal);
  const prevBtn = $(".scene-modal__nav--prev", sceneModal);
  const nextBtn = $(".scene-modal__nav--next", sceneModal);
  const closeBtn = $(".scene-modal__close", sceneModal);
  let activeGallery = [];
  let activeScene = null;
  let activePhoto = 0;

  function getSceneGallery(scene) {
    if (Array.isArray(scene.gallery) && scene.gallery.length) return scene.gallery;
    return [];
  }

  function renderScenePhoto(direction) {
    if (!activeScene) return;
    if (!activeGallery.length) {
      modalImg.classList.remove("is-visible", "is-from-prev", "is-from-next");
      modalImg.hidden = true;
      modalImg.removeAttribute("src");
      modalImg.alt = "";
      modalPlaceholder.hidden = false;
      modalTitle.textContent = activeScene.ja;
      modalCount.textContent = "準備中";
      modalDesc.textContent = activeScene.desc || "";
      prevBtn.hidden = true;
      nextBtn.hidden = true;
      return;
    }

    const src = activeGallery[activePhoto];
    modalImg.hidden = false;
    modalPlaceholder.hidden = true;
    modalImg.classList.remove("is-visible", "is-from-prev", "is-from-next");
    modalImg.classList.add(direction === "prev" ? "is-from-prev" : "is-from-next");
    window.setTimeout(() => {
      modalImg.src = src;
      modalImg.alt = `${activeScene.ja} ${activePhoto + 1}`;
      modalTitle.textContent = activeScene.ja;
      modalCount.textContent = `${activePhoto + 1} / ${activeGallery.length}`;
      modalDesc.textContent = activeScene.desc || "";
      prevBtn.hidden = activeGallery.length < 2;
      nextBtn.hidden = activeGallery.length < 2;
    }, 90);
  }

  modalImg.addEventListener("load", () => {
    modalImg.classList.add("is-visible");
  });

  function moveScenePhoto(step) {
    if (activeGallery.length < 2) return;
    activePhoto = (activePhoto + step + activeGallery.length) % activeGallery.length;
    renderScenePhoto(step < 0 ? "prev" : "next");
  }

  function openSceneGallery(scene, startIndex = 0) {
    const gallery = getSceneGallery(scene);
    activeScene = scene;
    activeGallery = gallery;
    activePhoto = gallery.length ? startIndex : 0;
    sceneModal.setAttribute("aria-hidden", "false");
    sceneModal.classList.add("is-open");
    document.body.classList.add("is-modal-open");
    renderScenePhoto("next");
    closeBtn.focus({ preventScroll: true });
  }

  function closeSceneGallery() {
    sceneModal.classList.remove("is-open");
    sceneModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");
  }

  sceneGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".scene-card__link");
    if (!btn) return;
    openSceneGallery(C.scenes[Number(btn.dataset.sceneIndex)]);
  });

  prevBtn.addEventListener("click", () => moveScenePhoto(-1));
  nextBtn.addEventListener("click", () => moveScenePhoto(1));
  closeBtn.addEventListener("click", closeSceneGallery);
  sceneModal.addEventListener("click", (e) => {
    if (e.target === sceneModal) closeSceneGallery();
  });
  document.addEventListener("keydown", (e) => {
    if (!sceneModal.classList.contains("is-open")) return;
    if (e.key === "Escape") closeSceneGallery();
    if (e.key === "ArrowLeft") moveScenePhoto(-1);
    if (e.key === "ArrowRight") moveScenePhoto(1);
  });

  /* ----------------------------------------------------------
     Portrait Plan：納品プラン
  ---------------------------------------------------------- */
  const planWrap = $("#plan-cards");
  C.plans.forEach((p, index) => {
    const direction = index % 2 === 0 ? " plan-card--from-left" : " plan-card--from-right";
    const card = el("article", "plan-card reveal" + direction);
    card.innerHTML = `
      <figure class="plan-card__visual">
        <img src="${esc(p.image.src)}" alt="${esc(p.image.alt)}" loading="lazy" width="1680" height="960">
      </figure>
      <div class="plan-card__body">
        <p class="plan-card__en">${esc(p.en)}</p>
        <h4 class="plan-card__ja">${esc(p.ja)}</h4>
        <div class="plan-card__copy">${p.copy.map((t) => `<p>${esc(t)}</p>`).join("")}</div>
        <div class="plan-card__desc">${p.desc.map((t) => `<p>${esc(t)}</p>`).join("")}</div>
      </div>`;
    planWrap.appendChild(card);
    io.observe(card);
  });

  /* 撮影時間別料金 */
  const priceWrap = $("#price-cards");
  C.pricing.forEach((f) => {
    const card = el("article", "fee-card");
    card.innerHTML = `
      <p class="fee-card__en">${esc(f.en)}</p>
      <h4 class="fee-card__ja">${esc(f.ja)}</h4>
      <p class="fee-card__price">${esc(f.price)}</p>
      <ul class="fee-card__notes">${f.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`;
    priceWrap.appendChild(card);
  });

  $("#price-notes").innerHTML = C.pricingNotes.map((n) => `<p>${esc(n)}</p>`).join("");

  /* ----------------------------------------------------------
     Voice：お客様の声
  ---------------------------------------------------------- */
  const voiceList = $("#voice-list");
  const MORE_LIMIT = 100;

  C.voices
    .filter((v) => v.published)
    .sort((a, b) => a.order - b.order)
    .forEach((v, i) => {
      const li = el("li", "voice-card");
      const full = v.text;
      const needsMore = full.replace(/\n/g, "").length > MORE_LIMIT;
      const short = needsMore ? full.replace(/\n/g, " ").slice(0, MORE_LIMIT) + "…" : full;
      li.innerHTML = `
        <figure class="voice-card__figure">
          <svg class="voice-card__arc" viewBox="0 0 240 86" aria-hidden="true">
            <defs><path id="voice-arc-${i}" d="M 48 70 A 72 58 0 0 1 192 70" fill="none"/></defs>
            <text><textPath href="#voice-arc-${i}" startOffset="50%" text-anchor="middle">Customer&#8217;s Voice</textPath></text>
          </svg>
          <div class="voice-card__photo">
            <img src="${esc(v.image)}" alt="${esc(v.alt)}" loading="lazy" width="900" height="1080" style="${v.focus ? `object-position: ${esc(v.focus)}` : ``}">
          </div>
        </figure>
        <p class="voice-card__name">${esc(v.name)}</p>
        <div class="voice-card__text" data-state="${needsMore ? "short" : "full"}">${voiceParagraphs(short)}</div>
        ${needsMore ? '<button type="button" class="voice-card__more">続きを読む</button>' : ""}`;
      if (needsMore) {
        $(".voice-card__more", li).addEventListener("click", (e) => {
          const box = $(".voice-card__text", li);
          const toFull = box.dataset.state === "short";
          box.innerHTML = voiceParagraphs(toFull ? full : short);
          box.dataset.state = toFull ? "full" : "short";
          e.target.textContent = toFull ? "閉じる" : "続きを読む";
        });
      }
      voiceList.appendChild(li);
    });

  function voiceStep(dir) {
    const card = $(".voice-card", voiceList);
    if (!card) return;
    const step = card.getBoundingClientRect().width + 30;
    voiceList.scrollBy({ left: dir * step, behavior: reduceMotion ? "auto" : "smooth" });
  }
  $("#voice-prev").addEventListener("click", () => voiceStep(-1));
  $("#voice-next").addEventListener("click", () => voiceStep(1));

  /* ----------------------------------------------------------
     Instagram
  ---------------------------------------------------------- */
  $("#insta-bg").src = C.instagramBackground;
  $("#insta-btn").href = C.instagramUrl;
  $("#footer-insta").href = C.instagramUrl;

  const instaTrack = $("#insta-track");
  C.instagramPosts
    .filter((p) => p.published)
    .sort((a, b) => a.order - b.order)
    .forEach((p) => {
      const href = p.url || C.instagramUrl;
      const a = el("a", "insta-item");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML = `<img src="${esc(p.image)}" alt="${esc(p.alt)}" loading="lazy" width="900" height="900">`;
      instaTrack.appendChild(a);
    });
  createMarquee($("#insta-carousel"), instaTrack, 22);

  /* ----------------------------------------------------------
     FAQ：アコーディオン
  ---------------------------------------------------------- */
  const faqList = $("#faq-list");
  C.faq
    .filter((f) => f.published)
    .sort((a, b) => a.order - b.order)
    .forEach((f, i) => {
      const item = el("div", "faq-item");
      item.innerHTML = `
        <h3>
          <button type="button" class="faq-item__q" aria-expanded="false" aria-controls="faq-a-${i}" id="faq-q-${i}">
            <span class="faq-item__mark">Q${i + 1}</span>
            <span>${esc(f.q)}</span>
            <span class="faq-item__icon" aria-hidden="true"></span>
          </button>
        </h3>
        <div class="faq-item__a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}">
          <div class="faq-item__a-inner">${paragraphs(f.a)}</div>
        </div>`;
      faqList.appendChild(item);
    });

  faqList.addEventListener("click", (e) => {
    const btn = e.target.closest(".faq-item__q");
    if (!btn) return;
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    panel.style.maxHeight = open ? "0" : panel.scrollHeight + "px";
  });

  /* ----------------------------------------------------------
     Contact フォーム
  ---------------------------------------------------------- */
  const form = $("#contact-form");

  // 選択肢の生成
  const sceneSelect = $("#f-scene");
  C.formOptions.sceneTypes.forEach((v) => sceneSelect.appendChild(new Option(v, v)));
  const locationSelect = $("#f-location");
  C.formOptions.locations.forEach((v) => locationSelect.appendChild(new Option(v, v)));

  function buildRadios(id, name, options) {
    const wrap = document.getElementById(id);
    options.forEach((v) => {
      const label = el("label", "form-radio");
      label.innerHTML = `<input type="radio" name="${esc(name)}" value="${esc(v)}"><span>${esc(v)}</span>`;
      wrap.appendChild(label);
    });
  }
  buildRadios("f-plan", "希望するプラン", C.formOptions.plans);
  buildRadios("f-duration", "希望する撮影時間", C.formOptions.durations);
  buildRadios("f-studio", "スタジオ手配の希望", C.formOptions.studio);
  buildRadios("f-hairmake", "美容師紹介の希望", C.formOptions.hairmake);

  // スタジオ撮影を選んだら追加項目を表示
  const studioExtra = $("#studio-extra");
  function updateStudioExtra() {
    const loc = locationSelect.value === "スタジオ撮影";
    const studio = form.querySelector('input[name="スタジオ手配の希望"]:checked');
    studioExtra.hidden = !(loc || (studio && studio.value === "希望する"));
  }
  locationSelect.addEventListener("change", updateStudioExtra);
  $("#f-studio").addEventListener("change", updateStudioExtra);

  // 撮影場所ボタン → フォームへ自動入力
  document.addEventListener("click", (e) => {
    const prefillLoc = e.target.closest("[data-prefill-location]");
    if (prefillLoc) {
      locationSelect.value = prefillLoc.dataset.prefillLocation;
      updateStudioExtra();
    }
  });

  // バリデーション
  const validators = [
    { id: "f-name", check: (v) => v.trim() !== "", msg: "お名前を入力してください。" },
    { id: "f-email", check: (v) => v.trim() !== "", msg: "メールアドレスを入力してください。",
      check2: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg2: "正しい形式のメールアドレスを入力してください。" },
    { id: "f-scene", check: (v) => v !== "", msg: "希望する撮影内容を選択してください。" },
    { id: "f-message", check: (v) => v.trim() !== "", msg: "お問い合わせ内容を入力してください。" }
  ];

  function showError(id, msg) {
    const field = document.getElementById(id);
    const errEl = form.querySelector(`[data-error-for="${id}"]`);
    if (errEl) {
      errEl.textContent = msg || "";
      errEl.classList.toggle("is-shown", Boolean(msg));
    }
    if (field && field.classList) field.classList.toggle("is-invalid", Boolean(msg));
  }

  function validate() {
    let firstBad = null;
    validators.forEach((v) => {
      const field = document.getElementById(v.id);
      let msg = "";
      if (!v.check(field.value)) msg = v.msg;
      else if (v.check2 && !v.check2(field.value)) msg = v.msg2;
      showError(v.id, msg);
      if (msg && !firstBad) firstBad = field;
    });
    const agree = $("#f-agree");
    const agreeMsg = agree.checked ? "" : "プライバシーポリシーへの同意にチェックを入れてください。";
    showError("f-agree", agreeMsg);
    if (agreeMsg && !firstBad) firstBad = agree;
    if (firstBad) {
      firstBad.focus({ preventScroll: false });
      firstBad.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }
    return !firstBad;
  }

  // 送信（Web3Forms）
  const globalError = $("#form-global-error");
  let lastSubmit = 0;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    globalError.textContent = "";
    globalError.classList.remove("is-shown");
    if (!validate()) return;

    // ハニーポット＆連続送信の抑止
    if (form.botcheck.value) return;
    const now = Date.now();
    if (now - lastSubmit < 15000) {
      globalError.textContent = "送信間隔が短すぎます。少し時間をおいて再度お試しください。";
      globalError.classList.add("is-shown");
      return;
    }

    if (!C.form.accessKey) {
      globalError.textContent = "送信フォームは現在準備中です。恐れ入りますが、Instagramなどから直接ご連絡ください。";
      globalError.classList.add("is-shown");
      return;
    }

    const btn = $("#submit-btn");
    btn.disabled = true;
    btn.textContent = "送信しています…";

    const data = new FormData(form);
    const name = data.get("お名前");
    const scene = data.get("希望する撮影内容");
    const payload = {
      access_key: C.form.accessKey,
      subject: `${C.form.subjectPrefix}${name}様／${scene}のお問い合わせ`,
      from_name: "ヒビノネ写真館 ホームページ",
      replyto: data.get("メールアドレス"),
      botcheck: ""
    };
    data.forEach((v, k) => {
      if (k !== "botcheck" && v !== "") payload[k] = v;
    });

    try {
      const res = await fetch(C.form.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "send failed");
      lastSubmit = now;
      form.hidden = true;
      const done = $("#contact-done");
      done.hidden = false;
      done.focus();
      done.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    } catch (err) {
      globalError.innerHTML = "送信に失敗しました。<br>時間をおいて再度お試しください。";
      globalError.classList.add("is-shown");
    } finally {
      btn.disabled = false;
      btn.textContent = "内容を確認して送信する";
    }
  });

  // 入力し直したらエラーを消す
  form.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id && form.querySelector(`[data-error-for="${t.id}"]`)) showError(t.id, "");
  });
})();
