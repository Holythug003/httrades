/* Admin mode – ?admin=1
    = local practice (offline trades, no Deriv)
   Demo = Deriv virtual (OTP)
   Footer: No real money · try now real trade? */
(function () {
  const ADMIN_LOCAL_NAME = "Real";

  const params = new URLSearchParams(location.search);
  const isAdmin =
    params.get("admin") === "1" || localStorage.getItem("ht_admin") === "1";
  if (!isAdmin) return;

  localStorage.setItem("ht_admin", "1");
  window.HT_ADMIN = true;
  if (typeof window._adminGuest !== "boolean") window._adminGuest = false;

  if (params.get("admin") === "1") {
    params.delete("admin");
    history.replaceState(
      null,
      "",
      location.pathname +
        (params.toString() ? "?" + params.toString() : "") +
        location.hash
    );
  }

  console.log(
    "%cHT TRADES · Admin (" + ADMIN_LOCAL_NAME + " = local offline | Demo = Deriv)",
    "color:#f28c28;font-weight:bold"
  );

  function usdFlagHtml() {
    return '<img src="https://flagcdn.com/w40/us.png" alt="USD" width="20" height="20">';
  }

  function localBalTxt() {
    if (typeof bal !== "undefined" && typeof f === "function")
      return f(bal) + " USD";
    return "10,000.00 USD";
  }

  function renameRealTab() {
    document.querySelectorAll(".at button").forEach(function (btn) {
      if (btn.dataset.t === "real") btn.textContent = ADMIN_LOCAL_NAME;
    });
  }

  function adminHdr() {
    if (!window._adminGuest) return false;

    const ab = document.getElementById("ab");
    const atg = document.getElementById("atg");
    const ak = document.getElementById("ak");
    const wn = document.getElementById("wn");
    if (!ab || !ak) return false;

    ab.textContent = localBalTxt();

    if (atg) {
      atg.innerHTML = "";
      atg.className = "";
    }

    ak.className = "flag-circle real";
    ak.innerHTML = usdFlagHtml();
    ak.title = ADMIN_LOCAL_NAME + " · R0T92772241";

    if (wn) {
      const msg =
        "<b>" +
        ADMIN_LOCAL_NAME +
        "</b> —  real money is used. Trading involves risk.";
      if (wn.dataset.m !== msg) {
        wn.innerHTML = msg;
        wn.dataset.m = msg;
      }
      wn.className = "warn";
    }
    return true;
  }

  function adminPopAfter() {
    renameRealTab();

    const onReal =
      window._adminGuest === true ||
      (typeof atab !== "undefined" && atab === "real");

    document.querySelectorAll(".at button").forEach(function (btn) {
      const isRealTab = btn.dataset.t === "real";
      const isDemoTab = btn.dataset.t === "demo";
      btn.classList.toggle(
        "on",
        (isRealTab && onReal) || (isDemoTab && !onReal)
      );
    });

    const ad = document.getElementById("ad");
    const pft = document.getElementById("pft");

    if (onReal && ad) {
      ad.innerHTML =
        '<div class="acb on">' +
        '<button type="button" class="ar" data-a="guest">' +
        '<span class="ai2"><b>USD</b><small>R0T92772241</small></span>' +
        "<b>" +
        localBalTxt() +
        "</b></button></div>";

      const guestBtn = ad.querySelector('[data-a="guest"]');
      if (guestBtn) {
        guestBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          goReal();
          if (typeof popOpen === "function") popOpen(false);
        };
      }
    }

    if (pft) {
      pft.innerHTML =
        'Looking for CFD accounts?<a href="#" id="traders-hub-link">Go to Traders Hub</a>';
      const tryLink = document.getElementById("ht-try-real");
      if (tryLink) {
        tryLink.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          goDemo();
          if (typeof popOpen === "function") popOpen(false);
          if (typeof toast === "function")
            toast("Switched to Demo — Deriv virtual funds");
        };
      }
    }
  }

  function goReal() {
    window._adminGuest = true;
    if (typeof atab !== "undefined") atab = "real";
    if (typeof acct !== "undefined") acct = "demo";
    if (typeof DV !== "undefined") {
      DV.want = false;
      try {
        if (DV.ws) {
          DV.ws.onclose = null;
          if (DV.ws.readyState <= 1) DV.ws.close();
        }
      } catch (e) {}
      DV.ok = true;
    }
    if (typeof switchTo === "function") switchTo("guest");
    else if (typeof loadBook === "function") loadBook();
    setTimeout(function () {
      adminHdr();
      if (typeof acctPop === "function") acctPop();
    }, 40);
  }

  function goDemo() {
    window._adminGuest = false;
    if (typeof atab !== "undefined") atab = "demo";
    if (typeof DV !== "undefined" && DV.on()) {
      const demo = DV.accts.find(function (a) {
        return a.virtual;
      });
      if (demo && typeof switchTo === "function") switchTo(demo.id);
    } else if (typeof dvLogin === "function") {
      dvLogin();
    }
    setTimeout(function () {
      if (typeof acctPop === "function") acctPop();
    }, 40);
  }

  document.addEventListener(
    "click",
    function (e) {
      if (!window.HT_ADMIN) return;
      const tab = e.target.closest(".at [data-t]");
      if (!tab) return;
      if (tab.dataset.t === "real") {
        e.preventDefault();
        e.stopPropagation();
        goReal();
      } else if (tab.dataset.t === "demo") {
        e.preventDefault();
        e.stopPropagation();
        goDemo();
      }
    },
    true
  );

  /* —— Offline guest  trading (no Deriv) —— */
  function enableOfflineGuestTrading() {
    if (typeof DV === "undefined") return;

    const _ready = DV.ready;
    DV.ready = function () {
      if (!DV.on()) return true;
      if (window.HT_ADMIN && window._adminGuest) return true;
      return typeof _ready === "function" ? _ready.call(DV) : DV.on() && DV.ok;
    };

    if (DV.buy && DV.buy._offlinePatched) return;

    const _buy = DV.buy;
    DV.buy = function (o) {
      const offline = !DV.on() || (window.HT_ADMIN && window._adminGuest);
      if (!offline && typeof _buy === "function") {
        return _buy.call(DV, o);
      }

      const amt = +(+o.s).toFixed(2);
      if (typeof bal !== "undefined" && bal < amt) {
        if (typeof toast === "function") toast("Insufficient local balance");
        if (o.onErr) o.onErr();
        return null;
      }

      if (typeof bal !== "undefined") bal = +(bal - amt).toFixed(2);

      const c = {
        ...o,
        s: amt,
        e: typeof M !== "undefined" && M[o.k] ? M[o.k].p : 0,
        l: o.n,
        remote: false,
        acc: "guest",
        id: Date.now() + Math.random(),
        t0: Date.now(),
        local: true
      };
      if (typeof OPEN !== "undefined") OPEN.push(c);

      if (typeof saveDemo === "function") saveDemo();
      if (typeof journal === "function") {
        journal(
          "Real trade " +
            (typeof label === "function" ? label(c) : o.t || "") +
            " stake " +
            amt
        );
      }
      if (typeof toast === "function")
        toast("Real trade placed · " + amt + " USD");
      if (typeof render === "function") render();
      if (typeof acctHdr === "function") acctHdr();

      const ticks = Math.max(1, +o.n || 5);
      setTimeout(function () {
        if (c.done) return;
        c.done = true;
        const win = Math.random() > 0.45;
        const payout = win ? +(amt * 1.85).toFixed(2) : 0;
        const profit = +(payout - amt).toFixed(2);
        if (typeof bal !== "undefined" && payout > 0) {
          bal = +(bal + payout).toFixed(2);
        }
        if (typeof OPEN !== "undefined") {
          const i = OPEN.indexOf(c);
          if (i >= 0) OPEN.splice(i, 1);
        }
        if (typeof record === "function") record(c, profit);
        else if (typeof trades !== "undefined") {
          trades.unshift({
            t: Date.now(),
            k: o.k,
            type: o.t,
            stake: amt,
            profit: profit
          });
        }
        if (typeof saveDemo === "function") saveDemo();
        if (typeof toast === "function") {
          toast(win ? "Real win +" + profit : "Real loss " + profit);
        }
        if (typeof render === "function") render();
        if (typeof acctHdr === "function") acctHdr();
      }, ticks * 1000);

      return c;
    };
    DV.buy._offlinePatched = true;

    if (!DV.on()) DV.ok = true;
  }

  window.htCanRunBot = function () {
    if (window.HT_ADMIN && window._adminGuest) return true;
    if (!DV.on()) return true;
    if (typeof DV === "undefined") return false;
    if (DV.on() && DV.ok && DV.ws && DV.ws.readyState === 1) return true;
    if (DV.on() && DV.ok) return true;
    return false;
  };

  function hook(name, wrap) {
    function tryIt() {
      if (typeof window[name] === "function" && !window[name]["_ad_" + name]) {
        wrap(window[name]);
        window[name]["_ad_" + name] = true;
      }
    }
    tryIt();
    [500, 1500, 3000].forEach(function (ms) {
      setTimeout(tryIt, ms);
    });
  }

  hook("acctPop", function (orig) {
    window.acctPop = function () {
      orig.apply(this, arguments);
      if (window.HT_ADMIN) adminPopAfter();
    };
  });

  hook("acctHdr", function (orig) {
    window.acctHdr = function () {
      if (window.HT_ADMIN && adminHdr()) return;
      orig.apply(this, arguments);
      if (window.HT_ADMIN) renameRealTab();
    };
  });

  hook("switchTo", function (orig) {
    window.switchTo = function (id) {
      if (window.HT_ADMIN && id !== "guest" && typeof DV !== "undefined") {
        const a = DV.accts.find(function (x) {
          return x.id === id;
        });
        if (a && !a.virtual) {
          const d = DV.accts.find(function (x) {
            return x.virtual;
          });
          id = d ? d.id : "guest";
          if (id === "guest") window._adminGuest = true;
          if (typeof toast === "function")
            toast(
              "Admin: real accounts disabled — use " +
                ADMIN_LOCAL_NAME +
                " or Demo"
            );
        }
      }
      if (window.HT_ADMIN) {
        window._adminGuest = id === "guest";
        if (typeof acct !== "undefined") acct = "demo";
      }
      const r = orig.call(this, id);
      if (window.HT_ADMIN) {
        setTimeout(function () {
          renameRealTab();
          adminHdr();
          enableOfflineGuestTrading();
        }, 30);
      }
      return r;
    };
  });

  enableOfflineGuestTrading();
  setTimeout(enableOfflineGuestTrading, 800);
  setTimeout(enableOfflineGuestTrading, 2000);

  setInterval(function () {
    if (!window.HT_ADMIN) return;
    renameRealTab();
    if (window._adminGuest) adminHdr();
  }, 1000);

  setTimeout(renameRealTab, 400);
  setTimeout(function () {
    if (window._adminGuest) adminHdr();
  }, 800);

  let lastA = 0;
  document.addEventListener("keydown", function (e) {
    if (e.key === "a" || e.key === "A") {
      const now = Date.now();
      if (now - lastA < 400) {
        localStorage.removeItem("ht_admin");
        window.HT_ADMIN = false;
        alert("Admin mode off. Refresh the page.");
      }
      lastA = now;
    }
  });
})();