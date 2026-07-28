/* ============================================================
   ヒビノネ写真館 — gift.js
   「写真の贈り物」ページの内容と動作
   ------------------------------------------------------------
   ★ 文章・写真・料金の変更は、すぐ下の GIFT_CONFIG を
     書き換えるだけで反映されます（HTMLを触る必要はありません）
   ============================================================ */

const GIFT_CONFIG = {

  /* ----------------------------------------------------------
     贈るシーン
     image：images/gift/ の中のファイル名（拡張子なし）
     portrait：写真が縦長のときだけ true にする（幅を細めに表示します）
  ---------------------------------------------------------- */
  scenes: [
    {
      no: "Scene 01",
      title: "何気ない日常を。",
      lead: "いつも頑張っているご両親に感謝を込めて",
      image: "s1-main",
      alt: "工場で笑顔で並ぶご夫婦",
      portrait: false
    },
    {
      no: "Scene 02",
      title: "出産のお祝いに。",
      lead: "「生まれてきてくれてありがとう」の気持ちを何度も思い出せるように",
      image: "s2-main",
      alt: "赤ちゃんを抱いて笑い合う母と姉",
      portrait: false
    },
    {
      no: "Scene 03",
      title: "「父の日」や「母の日」に。",
      lead: "照れくさくて普段は言えない感謝を写真の贈り物で",
      image: "s3-main",
      alt: "孫を抱く祖父母の穏やかな時間",
      portrait: true
    },
    {
      no: "Scene 04",
      title: "開店のお祝いに。",
      lead: "新しい一歩を踏み出すあの人へ、夢がカタチになった輝く瞬間を",
      image: "s4-main",
      alt: "施術中に子どもへ笑顔を向ける女性オーナー",
      portrait: false
    }
  ],

  /* ----------------------------------------------------------
     贈り方（3ステップ）
  ---------------------------------------------------------- */
  flow: [
    {
      no: "01",
      title: "DM・フォームにてご注文",
      text: "贈りたいシーンやご希望・ご予算を伺いながら、ぴったりの撮影プランをご提案いたします。"
    },
    {
      no: "02",
      title: "ギフトカードをお届け",
      text: "大切な方へ贈れる、撮影ギフトカードをお渡し・または郵送いたします。",
      note: "※郵送の場合は別途送料をいただきます。"
    },
    {
      no: "03",
      title: "撮影のご予約",
      text: "贈られた方とご相談しながら、ご希望の日程で撮影日を決定します。"
    }
  ],

  /* ----------------------------------------------------------
     撮影プラン（価格が変わったらここを書き換える）
  ---------------------------------------------------------- */
  plans: [
    {
      no: "01",
      name: "撮影データのみ",
      price: "¥13,000",
      suffix: "〜",
      desc: [
        "撮影したお写真のデータを、オンラインにてお渡しします。",
        "何気ない日常も、未来に残る大切な思い出に。"
      ],
      include: "撮影データ"
    },
    {
      no: "02",
      name: "フォトパネル付き",
      price: "¥16,500",
      suffix: "〜",
      desc: [
        "お気に入りの一枚を、インテリアとして飾れるフォトパネルに。"
      ],
      include: "撮影データ ＋ フォトパネル1枚"
    },
    {
      no: "03",
      name: "フォトブック付き",
      price: "¥23,000",
      suffix: "〜",
      desc: [
        "愛おしい時間を、一冊の物語のように残すフォトブック。",
        "ページをめくるたび、その日の空気や笑顔が蘇ります。"
      ],
      include: "撮影データ ＋ フォトブック1冊"
    }
  ],

  planNotes: [
    "※ご希望の撮影時間・撮影場所により金額が変動いたします。",
    "※撮影データは、オンラインにてお届けいたします。",
    "※ギフトカードの有効期限は、お渡しから「1年間」です。受け取った方のタイミングでゆったりとお使いいただけます。"
  ],

  /* ----------------------------------------------------------
     フォームの選択肢
  ---------------------------------------------------------- */
  formOptions: {
    occasions: [
      "ご両親へ感謝を込めて",
      "出産のお祝いに",
      "父の日・母の日に",
      "開店・開業のお祝いに",
      "誕生日・記念日に",
      "その他",
      "まだ決まっていない"
    ],
    plans: ["撮影データのみ", "フォトパネル付き", "フォトブック付き", "相談して決めたい"],
    delivery: ["手渡し", "郵送", "相談したい"]
  }
};

/* ============================================================
   ここから下は動作のプログラムです
============================================================ */
(function () {
  "use strict";

  const C = window.SITE_CONFIG || SITE_CONFIG;
  const G = GIFT_CONFIG;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }

  /* 大小2枚の画像を出し分ける（表示が速くなります） */
  function pic(name, alt, sizes, w, h) {
    return `<img src="images/gift/${esc(name)}.webp"
      srcset="images/gift/900/${esc(name)}.webp 900w, images/gift/${esc(name)}.webp 1600w"
      sizes="${esc(sizes)}" alt="${esc(alt)}" loading="lazy" width="${w}" height="${h}">`;
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
  if (document.readyState === "complete") hideLoading();
  else {
    window.addEventListener("load", hideLoading, { once: true });
    window.setTimeout(hideLoading, 3200);
  }

  /* ----------------------------------------------------------
     Header
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
    if (e.target.closest("#global-nav a")) closeMenu();
  });

  /* ----------------------------------------------------------
     ふわっと表示
  ---------------------------------------------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("is-visible");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  function observeReveals() { $$(".reveal:not(.is-visible)").forEach((n) => io.observe(n)); }
  observeReveals();

  /* ----------------------------------------------------------
     贈るシーン
  ---------------------------------------------------------- */
  const sceneList = $("#gift-scene-list");
  sceneList.innerHTML = G.scenes.map((s) => `
    <article class="gift-scene reveal">
      <div class="gift-scene__body">
        <p class="gift-scene__no">${esc(s.no)}</p>
        <h3 class="gift-scene__title">${esc(s.title)}</h3>
        <p class="gift-scene__lead">${esc(s.lead)}</p>
      </div>
      <figure class="gift-scene__photo${s.portrait ? " gift-scene__photo--portrait" : ""}">
        ${pic(s.image, s.alt,
              s.portrait ? "(max-width: 767px) 78vw, 560px" : "(max-width: 767px) 92vw, 920px",
              s.portrait ? 1067 : 1600,
              s.portrait ? 1600 : 1067)}
      </figure>
    </article>`).join("");

  /* ----------------------------------------------------------
     贈り方
  ---------------------------------------------------------- */
  $("#gift-flow-list").innerHTML = G.flow.map((f) => `
    <li class="gift-flow__item">
      <span class="gift-flow__no">${esc(f.no)}</span>
      <div>
        <h3 class="gift-flow__title">${esc(f.title)}</h3>
        <p class="gift-flow__text">${esc(f.text)}${f.note ? `<span class="gift-flow__note">${esc(f.note)}</span>` : ""}</p>
      </div>
    </li>`).join("");

  /* ----------------------------------------------------------
     撮影プラン
  ---------------------------------------------------------- */
  $("#gift-plan-list").innerHTML = G.plans.map((p) => `
    <article class="gift-plan__card">
      <p class="gift-plan__no">${esc(p.no)}</p>
      <h3 class="gift-plan__name">${esc(p.name)}</h3>
      <p class="gift-plan__price">${esc(p.price)}<small>${esc(p.suffix || "")}</small></p>
      <div class="gift-plan__desc">${p.desc.map((d) => `<p>${esc(d)}</p>`).join("")}</div>
      <p class="gift-plan__include">${esc(p.include)}</p>
    </article>`).join("");

  $("#gift-plan-notes").innerHTML = G.planNotes.map((n) => `<li>${esc(n)}</li>`).join("");

  observeReveals();

  /* ----------------------------------------------------------
     Instagram リンク
  ---------------------------------------------------------- */
  $("#gift-dm-btn").href = C.instagramUrl;
  $("#footer-insta").href = C.instagramUrl;

  /* ----------------------------------------------------------
     なめらかスクロール
  ---------------------------------------------------------- */
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[data-scroll][href^="#"]');
    if (!link) return;
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ----------------------------------------------------------
     お問い合わせフォーム
  ---------------------------------------------------------- */
  const form = $("#gift-form");

  const occasionSelect = $("#g-occasion");
  G.formOptions.occasions.forEach((v) => occasionSelect.appendChild(new Option(v, v)));

  function buildRadios(id, name, options) {
    const wrap = document.getElementById(id);
    options.forEach((v) => {
      const label = document.createElement("label");
      label.className = "form-radio";
      label.innerHTML = `<input type="radio" name="${esc(name)}" value="${esc(v)}"><span>${esc(v)}</span>`;
      wrap.appendChild(label);
    });
  }
  buildRadios("g-plan", "ご希望のプラン", G.formOptions.plans);
  buildRadios("g-delivery", "ギフトカードの受け取り方法", G.formOptions.delivery);

  const validators = [
    { id: "g-name", check: (v) => v.trim() !== "", msg: "お名前を入力してください。" },
    { id: "g-email", check: (v) => v.trim() !== "", msg: "メールアドレスを入力してください。",
      check2: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg2: "正しい形式のメールアドレスを入力してください。" },
    { id: "g-message", check: (v) => v.trim() !== "", msg: "お問い合わせ内容を入力してください。" }
  ];

  function showError(id, msg) {
    const field = document.getElementById(id);
    const errEl = form.querySelector(`[data-error-for="${id}"]`);
    if (errEl) {
      errEl.textContent = msg || "";
      errEl.classList.toggle("is-shown", Boolean(msg));
    }
    if (field) field.classList.toggle("is-invalid", Boolean(msg));
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
    const agree = $("#g-agree");
    const agreeMsg = agree.checked ? "" : "プライバシーポリシーへの同意にチェックを入れてください。";
    showError("g-agree", agreeMsg);
    if (agreeMsg && !firstBad) firstBad = agree;
    if (firstBad) {
      firstBad.focus({ preventScroll: true });
      firstBad.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }
    return !firstBad;
  }

  const globalError = $("#gift-form-error");
  let lastSubmit = 0;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    globalError.textContent = "";
    globalError.classList.remove("is-shown");
    if (!validate()) return;

    if (form.botcheck.value) return;
    const now = Date.now();
    if (now - lastSubmit < 15000) {
      globalError.textContent = "送信間隔が短すぎます。少し時間をおいて再度お試しください。";
      globalError.classList.add("is-shown");
      return;
    }

    if (!C.form.accessKey) {
      globalError.textContent = "送信フォームは現在準備中です。恐れ入りますが、InstagramのDMからご連絡ください。";
      globalError.classList.add("is-shown");
      return;
    }

    const btn = $("#gift-submit");
    btn.disabled = true;
    btn.textContent = "送信しています…";

    const data = new FormData(form);
    const payload = {
      access_key: C.form.accessKey,
      subject: `${C.form.subjectPrefix}${data.get("お名前")}様／写真の贈り物のお問い合わせ`,
      from_name: "ヒビノネ写真館 ホームページ",
      replyto: data.get("メールアドレス"),
      "お問い合わせ種別": "写真の贈り物（ギフト）",
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
      $(".gift-contact__dm").hidden = true;
      const done = $("#gift-done");
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

  form.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id && form.querySelector(`[data-error-for="${t.id}"]`)) showError(t.id, "");
  });
})();
