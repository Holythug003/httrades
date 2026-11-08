/* Deriv account connection. After "Log in with Deriv" the user comes back to HT TRADES and stays here:
   balance, buying contracts and contract results all run over Deriv's WebSocket API from this page.
   Login tokens are kept in this browser only (like Deriv's own apps) and are sent to nobody but Deriv. */
const CTYPE = {
  rise: "CALL",
  fall: "PUT",
  even: "DIGITEVEN",
  odd: "DIGITODD",
  over: "DIGITOVER",
  under: "DIGITUNDER",
  match: "DIGITMATCH",
  differ: "DIGITDIFF"
};
const DV = {
  accts: [],
  id: "",
  bal: null,
  cur: "USD",
  ok: false,
  ws: null,
  rq: 1,
  pend: {},
  subs: {},
  ping: 0,
  want: false
};
DV.on = () => DV.accts.length > 0;
DV.ready = () => DV.on() && DV.ok;
DV.acct = (id) => DV.accts.find((a) => a.id === (id || DV.id));
DV.virt = (id) => {
  const a = DV.acct(id);
  return a ? a.virtual : true;
};
const OAUTH_READY = !!CFG.APP_ID && CFG.APP_ID !== 1089;
const isVirt = (id) => /^(VR|VRT|DOT|VRTC)/i.test(id || "");
const bookKey = () => (DV.on() ? "book_" + DV.id : "demo");
const rr = () => typeof render === "function" && render();
const curTxt = () => (DV.on() ? DV.cur : "USD");

/* ---------- session ---------- */
function dvSave() {
  store.set("session", { accts: DV.accts, id: DV.id });
}
function dvLoad() {
  const s = store.get("session", null);
  if (s && Array.isArray(s.accts) && s.accts.length) {
    DV.accts = s.accts.filter(
      (a) => a && /^[A-Za-z0-9]+$/.test(a.id) && /^[\w-]+$/.test(a.token)
    );
    DV.id = DV.acct(s.id) ? s.id : (DV.accts[0] || {}).id || "";
  }
}
function dvParse(qs) {
  const q = new URLSearchParams(qs);
  if (!q.get("token1")) return false;
  const a = [];
  for (let i = 1; q.get("acct" + i); i++) {
    const id = q.get("acct" + i),
      tk = q.get("token" + i),
      cu = (q.get("cur" + i) || "USD").toUpperCase();
    if (/^[A-Za-z0-9]+$/.test(id) && /^[\w-]+$/.test(tk || ""))
      a.push({
        id,
        token: tk,
        cur: /^[A-Z0-9]{1,10}$/.test(cu) ? cu : "USD",
        virtual: isVirt(id)
      });
  }
  if (!a.length) return false;
  DV.accts = a;
  DV.id = (a.find((x) => x.virtual) || a[0]).id;
  dvSave();
  return true;
}
function dvFromUrl() {
  const q = new URLSearchParams(location.search);
  if (!q.get("token1") && !q.get("error")) return false;
  const back = store.get("login_from", "") || "#/dashboard";
  store.set("login_from", null);
  const ok = q.get("token1") ? dvParse(location.search) : false;
  history.replaceState(
    null,
    "",
    location.pathname + (/^#\/[a-z-]+$/.test(back) ? back : "#/dashboard")
  );
  return ok ? true : "fail";
}

/* ---------- socket ---------- */
function dvSend(msg) {
  return new Promise((res, rej) => {
    if (!DV.ws || DV.ws.readyState !== 1)
      return rej({
        message: "Not connected to Deriv yet. Check your connection and try again."
      });
    const id = DV.rq++;
    DV.pend[id] = { res, rej };
    DV.ws.send(JSON.stringify({ ...msg, req_id: id }));
  });
}

function dvConnect(id) {
  if (id) DV.id = id;
  const a = DV.acct();
  if (!a) return;

  DV.want = true;
  DV.ok = false;
  DV.bal = null;
  DV.cur = a.cur;
  rr();

  const oauthToken =
    localStorage.getItem("ht_access_token") || window.HT_OAUTH_TOKEN || "";

  // OAuth Bearer token → OTP WebSocket (demo or real)
  if (
    oauthToken &&
    (!a.token || a.token === oauthToken || String(a.token).length > 40)
  ) {
    connectViaOtp(a, oauthToken);
    return;
  }

  // Legacy session token (token1 from old oauth.deriv.com redirect)
  if (DV.ws) {
    DV.ws.onclose = null;
    try {
      DV.ws.close();
    } catch (e) {}
  }
  for (const k in DV.pend)
    DV.pend[k].rej({ message: "Connection changed. Try again." });
  DV.pend = {};
  DV.subs = {};

  const ws = new WebSocket(
    "wss://ws.derivws.com/websockets/v3?app_id=1089&l=EN&brand=deriv"
  );
  DV.ws = ws;
  rr();

  ws.onopen = () =>
    dvSend({ authorize: a.token })
      .then((r) => {
        const au = r.authorize;
        DV.ok = true;
        DV.bal = +au.balance;
        DV.cur = au.currency || a.cur;
        a.cur = DV.cur;
        (au.account_list || []).forEach((x) => {
          const m = DV.acct(x.loginid);
          if (m) {
            m.virtual = !!x.is_virtual;
            if (x.currency) m.cur = x.currency;
          }
        });
        dvSave();
        acct = DV.virt() ? "demo" : "real";
        ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
        OPEN.filter(
          (c) => c.remote && c.cid && c.acc === DV.id && !c.done
        ).forEach(dvWatch);
        overlay("");
        rr();
      })
      .catch((e) => {
        overlay("");
        DV.ok = false;
        if (e.code === "InvalidToken" || e.code === "AuthorizationRequired") {
          toast("Your Deriv session has expired. Log in again.");
          dvLogout(true);
        } else {
          toast("Deriv: " + (e.message || "could not open your account"));
        }
        rr();
      });

  ws.onmessage = (ev) => {
    const d = JSON.parse(ev.data);
    if (d.msg_type === "balance" && d.balance && d.balance.loginid === DV.id) {
      DV.bal = +d.balance.balance;
      DV.cur = d.balance.currency || DV.cur;
    }
    if (d.req_id && DV.subs[d.req_id]) return DV.subs[d.req_id](d);
    const p = d.req_id && DV.pend[d.req_id];
    if (p) {
      delete DV.pend[d.req_id];
      d.error ? p.rej(d.error) : p.res(d);
    }
  };

  ws.onclose = () => {
    DV.ok = false;
    if (DV.want && DV.ws === ws)
      setTimeout(() => DV.want && DV.ws === ws && dvConnect(), 3000);
    rr();
  };

  clearInterval(DV.ping);
  DV.ping = setInterval(
    () => DV.ws && DV.ws.readyState === 1 && DV.ws.send('{"ping":1}'),
    30000
  );
}

async function connectViaOtp(a, oauthToken) {
  try {
    if (DV.ws) {
      DV.ws.onclose = null;
      try {
        DV.ws.close();
      } catch (e) {}
    }
    for (const k in DV.pend)
      DV.pend[k].rej({ message: "Connection changed. Try again." });
    DV.pend = {};
    DV.subs = {};

    const res = await fetch(
      "https://api.derivws.com/trading/v1/options/accounts/" +
        encodeURIComponent(a.id) +
        "/otp",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + oauthToken,
          "Content-Type": "application/json"
        }
      }
    );
    if (!res.ok) throw new Error("OTP failed (" + res.status + ")");
    const json = await res.json();
    const url = (json.data && json.data.url) || json.url;
    if (!url) throw new Error("No trading socket URL");

    const ws = new WebSocket(url);
    DV.ws = ws;

    ws.onopen = function () {
      DV.ok = true;
      DV.want = true;
      if (a.balance != null) DV.bal = +a.balance;
      try {
        acct = DV.virt() ? "demo" : "real";
      } catch (e) {}
      try {
        ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
      } catch (e) {}
      overlay("");
      if (typeof toast === "function") toast("Connected · " + a.id);
      rr();
    };

    ws.onmessage = function (ev) {
      try {
        const d = JSON.parse(ev.data);
        if (d.msg_type === "balance" && d.balance) {
          DV.bal = +d.balance.balance;
          DV.cur = d.balance.currency || DV.cur;
          rr();
        }
        if (d.req_id && DV.subs[d.req_id]) return DV.subs[d.req_id](d);
        const p = d.req_id && DV.pend[d.req_id];
        if (p) {
          delete DV.pend[d.req_id];
          d.error ? p.rej(d.error) : p.res(d);
        }
      } catch (e) {}
    };

    ws.onclose = function () {
      DV.ok = false;
      if (DV.want)
        setTimeout(function () {
          if (DV.want) dvConnect(DV.id);
        }, 4000);
      rr();
    };

    ws.onerror = function () {
      console.warn("OTP socket error", a.id);
    };

    clearInterval(DV.ping);
    DV.ping = setInterval(function () {
      if (DV.ws && DV.ws.readyState === 1)
        DV.ws.send(JSON.stringify({ ping: 1 }));
    }, 30000);
  } catch (e) {
    console.error(e);
    DV.ok = false;
    overlay("");
    if (typeof toast === "function")
      toast("Could not connect " + a.id + ": " + (e.message || e));
    rr();
  }
}

window.htConnectOtp = function () {
  const a = DV.acct();
  const t =
    localStorage.getItem("ht_access_token") || window.HT_OAUTH_TOKEN || "";
  if (a && t) connectViaOtp(a, t);
};

function dvLogout(silent) {
  DV.want = false;
  try {
    if (DV.ws && DV.ws.readyState === 1) DV.ws.send('{"logout":1}');
  } catch (e) {}
  if (DV.ws) {
    DV.ws.onclose = null;
    setTimeout(() => {
      try {
        DV.ws && DV.ws.close();
      } catch (e) {}
    }, 300);
  }
  for (let i = OPEN.length - 1; i >= 0; i--)
    if (OPEN[i].remote) OPEN.splice(i, 1);
  DV.accts = [];
  DV.id = "";
  DV.ok = false;
  DV.bal = null;
  store.set("session", null);
  try {
    acct = "demo";
  } catch (e) {}
  for (const id in BOTS) {
    BOTS[id].on = false;
    BOTS[id].hold = 0;
  }
  loadBook();
  if (!silent) toast("Logged out of Deriv.");
}

/* ---------- trading ---------- */
const dropOpen = (c) => {
  const i = OPEN.indexOf(c);
  if (i >= 0) OPEN.splice(i, 1);
};
DV.buy = (o) => {
  const mkt = M[o.k];
  if (!mkt || !mkt.s) {
    toast("Deriv: unknown market. Re-select the symbol and try again.");
    return null;
  }
  const amt = +(+o.s).toFixed(2);
  if (!(amt >= 0.35)) {
    toast("The minimum stake is 0.35.");
    return null;
  }
  const cur = (DV.cur || "USD").toUpperCase();
  const c = {
    ...o,
    s: amt,
    e: mkt.p,
    l: o.n,
    remote: true,
    acc: DV.id,
    id: Date.now() + Math.random(),
    t0: Date.now()
  };
  OPEN.push(c);

  let p;
  if (o.t === "accu") {
    const gr = +o.g;
    if (!(gr > 0 && gr <= 0.05)) {
      dropOpen(c);
      toast("Deriv: growth rate must be between 1% and 5%.");
      return null;
    }
    p = {
      amount: amt,
      basis: "stake",
      contract_type: "ACCU",
      currency: cur,
      underlying_symbol: mkt.s,
      growth_rate: gr
    };
    if (+o.tp > 0) p.limit_order = { take_profit: +(+o.tp).toFixed(2) };
  } else {
    const ctype = CTYPE[o.t];
    if (!ctype) {
      dropOpen(c);
      toast("Deriv: unknown contract type.");
      return null;
    }
    const dur = Math.max(1, Math.min(10, +o.n || 1));
    p = {
      amount: amt,
      basis: "stake",
      contract_type: ctype,
      currency: cur,
      duration: dur,
      duration_unit: "t",
      underlying_symbol: mkt.s
    };
    if (HAS_B.includes(o.t)) {
      const b = o.b;
      if (b == null || b === "" || !isFinite(+b)) {
        dropOpen(c);
        toast("Deriv: choose a last-digit prediction (0–9).");
        return null;
      }
      p.barrier = String(+b);
    }
  }

  if (!p.underlying_symbol || !p.contract_type || !(p.amount > 0)) {
    dropOpen(c);
    toast("Deriv: missing trade parameters. Re-select market and try again.");
    return null;
  }

  dvSend({ buy: 1, price: amt, parameters: p })
    .then((r) => {
      c.cid = r.buy.contract_id;
      if (r.buy.balance_after != null) DV.bal = +r.buy.balance_after;
      journal(
        `Bought ${label(c)} on ${mkt.n} for ${f(amt)} ${cur} (ID ${c.cid})`
      );
      if (o.src === "Manual") toast("Contract bought. ID " + c.cid);
      dvWatch(c);
    })
    .catch((e) => {
      dropOpen(c);
      const msg = (e && (e.message || e.code)) || "the trade was not placed";
      toast("Deriv: " + msg);
      journal("Buy failed: " + msg + (e && e.code ? " [" + e.code + "]" : ""));
      if (typeof console !== "undefined") console.warn("HT buy error", e, p);
      c.onErr && c.onErr();
    });
  return c;
};
DV.sell = (c) => {
  if (!c.cid || c.selling) return;
  c.selling = true;
  dvSend({ sell: c.cid, price: 0 })
    .then(() => journal(`Sold contract ${c.cid}`))
    .catch((e) => {
      c.selling = false;
      toast("Deriv: " + (e.message || "could not sell"));
    });
};
function dvWatch(c) {
  const id = DV.rq++;
  DV.subs[id] = (d) => {
    if (d.error) {
      delete DV.subs[id];
      return;
    }
    const p = d.proposal_open_contract;
    if (!p || c.done) return;
    if (p.tick_count)
      c.l = Math.max(
        p.tick_count - (p.tick_stream ? p.tick_stream.length : 0),
        0
      );
    if (c.t === "accu") {
      c.val = +(p.bid_price || c.val || c.s);
      c.ticks = p.tick_count || c.ticks || 0;
      if (p.high_barrier) {
        c.hi = +p.high_barrier;
        c.lo = +p.low_barrier;
      }
    }
    if (
      c.sellAt &&
      !c.selling &&
      p.is_valid_to_sell &&
      +p.profit >= c.sellAt
    )
      DV.sell(c);
    if (p.is_sold) {
      c.done = true;
      delete DV.subs[id];
      if (d.subscription)
        dvSend({ forget: d.subscription.id }).catch(() => {});
      dropOpen(c);
      record(c, +(+p.profit).toFixed(2));
    }
  };
  DV.ws.send(
    JSON.stringify({
      proposal_open_contract: 1,
      contract_id: c.cid,
      subscribe: 1,
      req_id: id
    })
  );
}
const dvTopup = () =>
  dvSend({ topup_virtual: 1 })
    .then((r) =>
      toast(
        `Demo account topped up with ${f(+r.topup_virtual.amount)} ${r.topup_virtual.currency}.`
      )
    )
    .catch((e) =>
      toast("Deriv: " + (e.message || "top-up not available right now"))
    );

function dvLogin() {
  if (!OAUTH_READY) {
    $("lsetup").showModal();
    return;
  }
  if (typeof window.htStartLogin === "function") {
    window.htStartLogin();
    return;
  }
  const url =
    "https://oauth.deriv.com/oauth2/authorize?app_id=" +
    CFG.APP_ID +
    "&l=EN&brand=deriv" +
    (CFG.AFFILIATE
      ? "&affiliate_token=" + encodeURIComponent(CFG.AFFILIATE)
      : "");
  if (/^#\/./.test(location.hash)) store.set("login_from", location.hash);
  overlay(
    "Redirecting to Deriv…",
    "Log in on Deriv and you will come straight back to HT TRADES."
  );
  location.href = url;
}
function overlay(t, s) {
  $("ovt").textContent = t;
  $("ovs").textContent = s || "";
  $("ovl").hidden = !t;
}
dvLoad();
const dvFresh = dvFromUrl();