/* HT TRADES – OAuth 2.0 + PKCE
   Accounts via REST. Works with admin.js (Trainer | Demo). */
(function () {
  const CLIENT_ID = (typeof CFG !== "undefined" && CFG.APP_ID) ? String(CFG.APP_ID) : "34FywFYdRovCPnNKFukpx";
  const REDIRECT_URI = window.location.origin + "/";
  const SCOPES = "trade account_manage";

  function generateRandomString(length) {
    length = length || 64;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    let result = "";
    array.forEach(function (x) { result += chars[x % chars.length]; });
    return result;
  }

  async function sha256(plain) {
    const data = new TextEncoder().encode(plain);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode.apply(null, new Uint8Array(hash)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  async function startLogin() {
    const verifier = generateRandomString(64);
    const challenge = await sha256(verifier);
    const state = generateRandomString(32);
    sessionStorage.setItem("ht_pkce_verifier", verifier);
    sessionStorage.setItem("ht_oauth_state", state);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      state: state,
      code_challenge: challenge,
      code_challenge_method: "S256"
    });
    window.location.href = "https://auth.deriv.com/oauth2/auth?" + params.toString();
  }

  function isVirtual(id) {
    return /^(VR|VRT|DOT)/i.test(id || "");
  }

  async function fetchAccounts(accessToken) {
    const res = await fetch("https://api.derivws.com/trading/v1/options/accounts", {
      headers: {
        "Authorization": "Bearer " + accessToken,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error("Accounts " + res.status + " " + text.slice(0, 120));
    }
    const json = await res.json();
    return Array.isArray(json.data) ? json.data
         : (json.data && json.data.accounts) || json.accounts || [];
  }

  async function applyToken(accessToken) {
    localStorage.setItem("ht_access_token", accessToken);
    window.HT_OAUTH_TOKEN = accessToken;

    const accounts = await fetchAccounts(accessToken);
    if (!accounts.length) throw new Error("No accounts returned from Deriv");

    DV.accts = accounts.map(function (a) {
      const id = a.account_id || a.loginid || a.id;
      return {
        id: String(id),
        token: accessToken,
        cur: (a.currency || a.currency_code || "USD").toUpperCase(),
        virtual: !!(a.is_virtual || a.account_type === "demo" || isVirtual(id)),
        balance: a.balance != null ? +a.balance : null
      };
    });

    const demo = DV.accts.find(function (a) { return a.virtual; });
    DV.id = (demo || DV.accts[0]).id;
    const active = typeof DV.acct === "function" ? DV.acct(DV.id) : DV.accts.find(function (a) { return a.id === DV.id; });
    DV.bal = active && active.balance != null ? active.balance : null;
    DV.cur = active ? active.cur : "USD";
    DV.ok = true;   // stop "connecting…"

    if (typeof dvSave === "function") dvSave();
    if (typeof loadBook === "function") loadBook();
    if (typeof acct === "string" || typeof acct === "undefined") {
      try { acct = (active && active.virtual) ? "demo" : "real"; } catch (e) {}
    }

    console.log("HT TRADES: logged in", DV.accts.map(function (a) { return a.id; }));
    return true;
  }

  async function handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error) {
      console.error("OAuth error:", error);
      if (typeof overlay === "function") overlay("");
      return false;
    }
    if (!code) return false;

    // Keep hash if present (e.g. #/dashboard)
    const hash = window.location.hash || "";
    window.history.replaceState({}, document.title, window.location.pathname + hash);

    if (state !== sessionStorage.getItem("ht_oauth_state")) {
      console.error("State mismatch");
      if (typeof overlay === "function") overlay("");
      return false;
    }

    const verifier = sessionStorage.getItem("ht_pkce_verifier");
    if (!verifier) {
      console.error("Missing verifier");
      if (typeof overlay === "function") overlay("");
      return false;
    }

    try {
      if (typeof overlay === "function") overlay("Signing you in…", "Loading your Deriv accounts.");

      const res = await fetch("https://auth.deriv.com/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: CLIENT_ID,
          code: code,
          redirect_uri: REDIRECT_URI,
          code_verifier: verifier
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || data.error || "token exchange failed");

      await applyToken(data.access_token);
      if (data.refresh_token) localStorage.setItem("ht_refresh_token", data.refresh_token);

      if (typeof overlay === "function") overlay("");
      if (typeof go === "function") go("app");
      if (typeof toast === "function") toast("Logged in with Deriv · " + DV.id);
      if (typeof acctHdr === "function") acctHdr();
      if (typeof render === "function") render();

      return true;
    } catch (e) {
      console.error("OAuth callback error", e);
      if (typeof overlay === "function") overlay("");
      if (typeof toast === "function") toast("Login error: " + (e.message || e));
      return false;
    }
  }

  window.htStartLogin = startLogin;
  window.dvLogin = startLogin;

  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-login]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    startLogin();
  }, true);

  // On load: handle OAuth redirect or restore session
  function boot() {
    handleCallback().then(function (ok) {
      if (ok) return;
      const token = localStorage.getItem("ht_access_token");
      if (token && typeof DV !== "undefined" && !DV.on()) {
        applyToken(token)
          .then(function () {
            if (typeof acctHdr === "function") acctHdr();
            if (typeof render === "function") render();
          })
          .catch(function (e) {
            console.warn("Could not restore session", e);
            localStorage.removeItem("ht_access_token");
          });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  
})();