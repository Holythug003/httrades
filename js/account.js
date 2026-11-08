/* =========================================
   DERIV-STYLE ACCOUNT SWITCHER
   Clean official look – no custom icons
   ========================================= */

let atab = "demo",
  _did,
  pendingId = "",
  realOK = false;

const COIN =
  '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="currentColor"/><path d="M11.5 9.5h5a6.5 6.5 0 0 1 0 13h-5zM8 13.5h7M8 18.5h7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* Guest demo ID */
function demoId() {
  // ... rest of the code stays the same
  if (DV.on()) return DV.id;
  if (!_did) {
    _did = store.get("demo_id", null);
    if (!_did) {
      _did = CFG.ID_PREFIX + String(Math.floor(Math.random() * 1e8)).padStart(8, "0");
      store.set("demo_id", _did);
    }
  }
  return _did;
}

const curBal = () => (DV.on() ? DV.bal || 0 : bal);
const balTxt = () => (DV.on() ? (DV.bal == null ? "—" : f(DV.bal)) : f(bal));

const confirmReal = () =>
  realOK ||
  (realOK = confirm(`This will trade with real money on your Deriv account ${DV.id}. Continue?`));

/* Load trade history per account */
function loadBook() {
  const b = store.get(bookKey(), null);
  trades = b && Array.isArray(b.trades) ? b.trades : [];
  pl = (b && b.pl) || 0;
  if (!DV.on() && b && typeof b.bal === "number") bal = b.bal;
}

/* ========== HEADER (exact clean Deriv style) ========== */
function acctHdr() {
  const r = acct === "real";
  const on = DV.on();

  // Balance
  $("ab").textContent = balTxt() + " " + curTxt();

  if (r) {
    // ===== REAL ACCOUNT → correct currency flag =====
    const currency = on ? (DV.cur || "USD") : "USD";

    const flagMap = {
      USD: "us",
      EUR: "eu",
      GBP: "gb",
      AUD: "au",
      CAD: "ca",
      CHF: "ch",
      JPY: "jp",
      NZD: "nz",
      HKD: "hk",
      SGD: "sg",
      USDT: "us",
      USDC: "us"
    };

    const flagCode = flagMap[currency] || "us";

    $("ak").className = "flag-circle real";
    
    if (currency === "BTC" || currency === "ETH") {
      $("ak").innerHTML = `<span style="font-size:14px;font-weight:700">${currency === "BTC" ? "₿" : "Ξ"}</span>`;
    } else {
      $("ak").innerHTML = `<img src="https://flagcdn.com/w40/${flagCode}.png" alt="${currency}" width="20" height="20">`;
    }
  } else {
    // ===== DEMO / GUEST → original coin icon =====
    $("ak").className = "coin";
    $("ak").innerHTML = COIN;
  }

  $("ak").title = r ? "Real account" : "Demo account";

  // Clear the old text badge
  $("atg").innerHTML = "";
  $("atg").className = "";

  // Warning message
  let msg = "";
  if (!on) {
    msg = `<b>Real</b> — Real money is used . Trading involves risks.`;
  } else if (!DV.ok) {
    msg = `<b>Connecting…</b>`;
  } else if (r) {
    msg = `<b>Real account </b> — real money is used. Trading involves risk.`;
  } else {
    msg = `<b>Demo account</b> — virtual funds.`;
  }

  if ($("wn").dataset.m !== msg) {
    $("wn").innerHTML = msg;
    $("wn").dataset.m = msg;
  }

  $("wn").className = "warn" + (r ? " real" : "");
}

/* ========== ACCOUNT POPUP ========== */
function acctPop() {
  document.querySelectorAll(".at button").forEach((b) => {
    b.classList.toggle("on", b.dataset.t === atab);
  });

  const row = (id, isReal, currency, amount, isActive, extra = "") => `
    <div class="acb${isActive ? " on" : ""}">
      <button class="ar" data-a="${id}">
        <span class="ai2">
          <b>${currency}</b>
          <small>${id}</small>
        </span>
        <b>${amount}</b>
      </button>
      ${extra}
    </div>
  `;

  const resetBtn = (label) => `
    <div class="rs"><button class="rb" id="rb">${label}</button></div>
  `;

  let html = "";

  if (!DV.on()) {
    if (atab === "demo") {
      html = row("guest", false, "USD", f(bal) + " USD", true, resetBtn);
    } else {
      html = `
        <p class="pnote">Log in with your Deriv account to trade with real funds.</p>
        <button class="btn b-or" data-login>Log in with Deriv</button>
      `;
    }
  } else {
    const list = DV.accts.filter((a) => (atab === "demo" ? a.virtual : !a.virtual));

    if (list.length) {
      html = list
        .map((a) => {
          const active = a.id === DV.id;
          const amount = active
            ? DV.bal == null
              ? "…"
              : f(DV.bal) + " " + DV.cur
            : "Switch";
          return row(
            a.id,
            !a.virtual,
            a.cur,
            amount,
            active,
            active && a.virtual ? resetBtn("Reset balance") : ""
          );
        })
        .join("");
    } else {
      html = `<p class="pnote">${
        atab === "demo"
          ? "No Deriv demo account on this login."
          : "No real account yet. Create one on Deriv, then log in again."
      }</p>`;
    }
  }

    $("ad").innerHTML = html;

  if (DV.on()) {
    $("pft").innerHTML = 'Looking for CFD accounts? <a href="#" id="traders-hub-link">Go to Trader\'s Hub</a>';
  } else {
    $("pft").textContent = "Practising as a guest";
  }

  $("lgo").firstElementChild.textContent = DV.on() ? "Log out" : "Back to home";
}


/* ========== SWITCH ACCOUNT ========== */
function switchTo(id) {
  for (const i in BOTS) {
    BOTS[i].on = false;
    BOTS[i].hold = 0;
  }
  CP.on = false;

  if (id === "guest") {
    acct = "demo";
  } else {
    dvConnect(id);
    acct = DV.virt(id) ? "demo" : "real";
  }

  loadBook();
  atab = acct;
  popOpen(false);

  toast(
    acct === "real"
      ? `Switched to real acc ${id}`
      : `Switched to ${id === "guest" ? "Real account" : "demo account " + id}`
  );
  render();
}

/* ========== POPUP CONTROLS ========== */
const popOpen = (open) => {
  $("pop").hidden = !open;
  $("ab-btn").setAttribute("aria-expanded", open);
  if (open) acctPop();
};

$("ab-btn").onclick = $("pf").onclick = (e) => {
  e.stopPropagation();
  if ($("pop").hidden) atab = acct;
  popOpen($("pop").hidden);
};

document.addEventListener("click", (e) => {
  if (!e.target.closest(".acct")) popOpen(false);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    popOpen(false);
    $("help").hidden = true;
  }
});

$("ph2").onclick = () => {
  $("ad").hidden = !$("ad").hidden;
  $("ph2").classList.toggle("shut", $("ad").hidden);
};

$("pop").onclick = (e) => {
  const tabBtn = e.target.closest("[data-t]");
  const accBtn = e.target.closest("[data-a]");

  if (tabBtn) {
    atab = tabBtn.dataset.t;
    acctPop();
  }

  if (accBtn && accBtn.dataset.a !== (DV.on() ? DV.id : "guest")) {
    const id = accBtn.dataset.a;
    if (id !== "guest" && !DV.virt(id)) {
      pendingId = id;
      $("cf").showModal();
    } else {
      switchTo(id);
    }
  }

  if (e.target.closest("#rb")) {
    if (DV.on()) {
      dvTopup();
    } else {
      bal = 700;
      pl = 0;
      trades.length = 0;
      for (let i = OPEN.length - 1; i >= 0; i--) {
        if (!OPEN[i].remote) OPEN.splice(i, 1);
      }
      for (const id in BOTS) BOTS[id].hold = 0;
      saveDemo();
      toast("Demo balance reset to 700.00 USD");
      acctPop();
      render();
    }
  }

  if (e.target.closest("#lgo")) {
    popOpen(false);
    if (DV.on()) dvLogout();
    for (const id in BOTS) BOTS[id].on = false;
    CP.on = false;
    go("landing");
  }
};

$("cfy").onclick = () => {
  $("cf").close();
  if (pendingId) switchTo(pendingId);
  pendingId = "";
};

/* Used by Copy Trading */
function afterSwitch() {
  const want =
    acct === "real"
      ? DV.accts.find((a) => !a.virtual)
      : DV.accts.find((a) => a.virtual);

  if (!DV.on() && acct === "real") return dvLogin();
  switchTo(want ? want.id : "guest");
}

/* Start-up */
if (DV.on()) {
  acct = DV.virt() ? "demo" : "real";
  atab = acct;
  dvConnect();
}
loadBook();