"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { authClient } from "../lib/auth-client";

type Account = { id: string; name: string; type: string; institution: string; balance: number; accent: string };

const history = [91, 95, 93, 99, 105, 108, 114, 112, 119, 123, 121, 130];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function Icon({ name }: { name: string }) {
  const icons: Record<string, string> = { overview: "⌂", accounts: "◫", activity: "↕", plan: "⌁", import: "⇧", settings: "⚙", shield: "◇", plus: "+", bell: "•" };
  return <span className="icon" aria-hidden="true">{icons[name]}</span>;
}

export default function Home() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [range, setRange] = useState("1Y");
  const [scenario, setScenario] = useState(false);
  const [drawer, setDrawer] = useState<"account" | "import" | "security" | null>(null);
  const [toast, setToast] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup" | "enroll" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const total = useMemo(() => accounts.reduce((sum, account) => sum + account.balance, 0), [accounts]);
  const projected = scenario ? total * 1.194 : total * 1.126;
  const graph = scenario ? [...history, 137, 147, 159] : [...history, 134, 139, 144];
  const points = graph.map((v, i) => `${(i / (graph.length - 1)) * 760},${220 - ((v - 85) / 75) * 185}`).join(" ");

  useEffect(() => {
    if (!session) return;
    fetch("/api/accounts").then((response) => response.ok ? response.json() : []).then(setAccounts).catch(() => notify("Could not load accounts"));
  }, [session]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  async function addAccount() {
    const amount = Number(balance.replace(/[^0-9.-]/g, ""));
    if (!name || !Number.isFinite(amount)) return;
    const response = await fetch("/api/accounts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, type: "Custom", institution: "Manual", balance: amount, accent: "#fe67d4" }) });
    if (!response.ok) return notify("Account could not be saved");
    const account = await response.json();
    setAccounts((current) => [...current, account]);
    setName(""); setBalance(""); setDrawer(null); notify("Account saved to your vault");
  }

  async function submitAuth() {
    setAuthBusy(true); setAuthError("");
    try {
      if (authMode === "signup") {
        const result = await authClient.signUp.email({ email, password, name: displayName || email.split("@")[0] });
        if (result.error) throw new Error(result.error.message);
        const enrollment = await authClient.twoFactor.enable({ password });
        if (enrollment.error) throw new Error(enrollment.error.message);
        setTotpUri(enrollment.data?.totpURI ?? "");
        setBackupCodes(enrollment.data?.backupCodes ?? []);
        setAuthMode("enroll");
      } else {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) throw new Error(result.error.message);
        if (result.data && "twoFactorRedirect" in result.data && result.data.twoFactorRedirect) setAuthMode("verify");
        else await refetch();
      }
    } catch (error) { setAuthError(error instanceof Error ? error.message : "Authentication failed"); }
    finally { setAuthBusy(false); }
  }

  async function verifyTwoFactor() {
    setAuthBusy(true); setAuthError("");
    const result = await authClient.twoFactor.verifyTotp({ code: authCode, trustDevice: false });
    setAuthBusy(false);
    if (result.error) return setAuthError(result.error.message ?? "The authentication code was not accepted");
    setAuthMode("login"); setAuthCode(""); await refetch(); notify("Vault unlocked securely");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img src="/vaultyra-logo.png" alt="Vaultyra" /><div><strong>Vaultyra</strong><span>Personal vault</span></div></div>
        <nav aria-label="Main navigation">
          <button className="nav-item active"><Icon name="overview" />Overview</button>
          <button className="nav-item" onClick={() => document.getElementById("accounts")?.scrollIntoView({ behavior: "smooth" })}><Icon name="accounts" />Accounts</button>
          <button className="nav-item" onClick={() => notify("Transactions are ready for bank sync data")}><Icon name="activity" />Transactions</button>
          <button className="nav-item" onClick={() => document.getElementById("projection")?.scrollIntoView({ behavior: "smooth" })}><Icon name="plan" />Planning</button>
          <button className="nav-item" onClick={() => setDrawer("import")}><Icon name="import" />Import history</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="security-card"><div className="security-icon">✓</div><strong>Vault protected</strong><span>2FA enabled · Encrypted</span><button onClick={() => setDrawer("security")}>Security center</button></div>
          <button className="profile" onClick={async () => { await authClient.signOut(); setAccounts([]); setAuthMode("login"); }}><span className="avatar">{session?.user.name?.slice(0,2).toUpperCase() || "V"}</span><span><strong>{session?.user.name || "Vaultyra user"}</strong><small>Sign out and lock</small></span><span>⋯</span></button>
        </div>
      </aside>

      <section className="content">
        <header><div><p className="eyebrow">YOUR PRIVATE FINANCIAL VAULT</p><h1>Welcome, {session?.user.name?.split(" ")[0] || "there"}.</h1><p>Your balances and history are stored on your own server.</p></div><div className="header-actions"><button className="circle" aria-label="Notifications"><Icon name="bell" /></button><button className="primary" onClick={() => setDrawer("account")}><Icon name="plus" /> Add account</button></div></header>

        <section className="hero-grid">
          <article className="net-card">
            <div className="card-top"><div><span className="label">TOTAL NET WORTH</span><h2>{money(total)}</h2><p><b>↗ 8.4%</b> <span>+$9,411 this year</span></p></div><div className="range-tabs">{["1M","3M","1Y","ALL"].map((item) => <button key={item} className={range === item ? "selected" : ""} onClick={() => setRange(item)}>{item}</button>)}</div></div>
            <div className="chart" aria-label={`Net worth chart for ${range}`}><svg viewBox="0 0 760 230" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#43e7c3" stopOpacity=".28"/><stop offset="1" stopColor="#43e7c3" stopOpacity="0"/></linearGradient></defs><polygon points={`0,230 ${points} 760,230`} fill="url(#fill)"/><polyline points={points} fill="none" stroke="#50e3c2" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="760" cy={points.split(" ").at(-1)?.split(",")[1]} r="7" fill="#071815" stroke="#57f4cd" strokeWidth="4"/></svg><div className="axis"><span>AUG</span><span>NOV</span><span>FEB</span><span>MAY</span><span>JUL</span></div></div>
          </article>

          <article className="projection-card" id="projection"><div className="projection-head"><span className="spark">✦</span><span>VAULTYRA FORECAST</span></div><h3>Your money, 12 months from now</h3><div className="forecast-number">{money(projected)}</div><p>Based on your {scenario ? "custom plan" : "current pace"}</p><div className="mini-bars">{[28,36,42,49,58,67,78,88].map((h,i)=><i key={i} style={{height: `${h}%`}} />)}</div><div className="forecast-row"><span>Projected growth</span><b>{scenario ? "+19.4%" : "+12.6%"}</b></div><button className="scenario-button" onClick={() => setScenario(!scenario)}>{scenario ? "Use history forecast" : "Build a what-if scenario"} <span>→</span></button></article>
        </section>

        <section className="summary-row"><div><span>Cash</span><strong>{money(accounts.filter(a=>a.type.toLowerCase().includes("cash")).reduce((s,a)=>s+a.balance,0))}</strong><em className="up">Live total</em></div><div><span>Investments</span><strong>{money(accounts.filter(a=>a.type.toLowerCase().includes("invest")).reduce((s,a)=>s+a.balance,0))}</strong><em className="up">Live total</em></div><div><span>Crypto</span><strong>{money(accounts.filter(a=>a.type.toLowerCase().includes("crypto")).reduce((s,a)=>s+a.balance,0))}</strong><em className="up">Live total</em></div><div><span>Credit cards</span><strong>{money(Math.abs(accounts.filter(a=>a.type.toLowerCase().includes("credit")).reduce((s,a)=>s+a.balance,0)))}</strong><em className="down">Current balance</em></div></section>

        <section className="lower-grid" id="accounts">
          <article className="panel accounts-panel"><div className="panel-title"><div><h3>Your accounts</h3><p>Everything you own and owe, persisted securely.</p></div><button onClick={() => setDrawer("account")}>Add account</button></div><div className="account-list">{accounts.length === 0 && <div className="empty-state"><strong>Your vault is ready</strong><span>Add your first account to begin tracking net worth.</span></div>}{accounts.map((account) => <button className="account-row" key={account.id} onClick={() => notify(`${account.name} details opened`)}><span className="account-mark" style={{background: account.accent}}>{account.institution[0]}</span><span className="account-name"><strong>{account.name}</strong><small>{account.institution} · {account.type}</small></span><span className={account.balance < 0 ? "negative" : ""}><strong>{money(Math.abs(account.balance))}</strong><small>{account.balance < 0 ? "Balance due" : "Saved securely"}</small></span><b className="chevron">›</b></button>)}</div></article>
          <article className="panel allocation"><div className="panel-title"><div><h3>Portfolio mix</h3><p>Across all investment accounts</p></div><button aria-label="Portfolio options">⋯</button></div><div className="donut-wrap"><div className="donut"><div><strong>$97.5k</strong><span>invested</span></div></div><div className="legend"><div><i className="dot violet"/><span>US stocks</span><b>54%</b></div><div><i className="dot mint"/><span>Crypto</span><b>23%</b></div><div><i className="dot blue"/><span>International</span><b>15%</b></div><div><i className="dot gray"/><span>Bonds & cash</span><b>8%</b></div></div></div><div className="insight"><span>✦</span><p><strong>Healthy diversification</strong>Your mix is aligned with your growth profile.</p></div></article>
        </section>
      </section>

      {drawer && <div className="modal-backdrop" onMouseDown={() => setDrawer(null)}><section className="modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setDrawer(null)}>×</button>{drawer === "account" && <><span className="modal-kicker">EXPAND YOUR VAULT</span><h2>Add an account</h2><p>Connect a provider or add a balance manually.</p><div className="providers">{["Bank account", "Fidelity", "Coinbase", "Pionex"].map(provider => <button key={provider} onClick={() => notify(`${provider} connection flow ready for credentials`)}><span>{provider[0]}</span>{provider}<b>Connect</b></button>)}</div><div className="divider"><span>or add manually</span></div><label>Account name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Emergency fund" /></label><label>Current balance<input value={balance} onChange={e=>setBalance(e.target.value)} inputMode="decimal" placeholder="$0.00" /></label><button className="primary wide" onClick={addAccount}>Add to Vaultyra</button></>}{drawer === "import" && <><span className="modal-kicker">BRING YOUR HISTORY</span><h2>Import transactions</h2><p>Upload CSV or XLSX exports from your bank, broker, or previous finance app.</p><label className="dropzone"><input type="file" accept=".csv,.xlsx,.xls" onChange={(e)=>e.target.files?.[0] && notify(`${e.target.files[0].name} is ready to map`)} /><span>⇧</span><strong>Drop a spreadsheet here</strong><small>or click to browse · CSV, XLSX up to 25 MB</small></label><div className="privacy-note">Your import is processed inside your Vaultyra instance.</div></>}{drawer === "security" && <><span className="modal-kicker">SECURITY CENTER</span><h2>Your vault is protected</h2><p>Security controls are designed for a self-hosted financial system.</p><div className="security-list"><div><span>✓</span><p><strong>Authenticator 2FA</strong><small>Required for every account</small></p><b>On</b></div><div><span>✓</span><p><strong>Encrypted secrets</strong><small>Provider tokens encrypted at rest</small></p><b>On</b></div><div><span>✓</span><p><strong>Session protection</strong><small>Secure cookies and automatic expiry</small></p><b>On</b></div></div><button className="primary wide" onClick={() => {setDrawer(null);notify("Security settings saved")}}>Review recovery codes</button></>}</section></div>}
      {(!session || isPending) && <div className="auth-screen"><section className="auth-card"><img src="/vaultyra-logo.png" alt="Vaultyra logo" /><span className="modal-kicker">PRIVATE BY DESIGN</span><h2>{isPending ? "Opening your vault" : authMode === "signup" ? "Create your vault" : authMode === "enroll" ? "Protect your vault" : authMode === "verify" ? "Verify it’s you" : "Welcome back"}</h2><p>{authMode === "enroll" ? "Scan this code with your authenticator app, then enter the current 6-digit code." : authMode === "verify" ? "Enter the 6-digit code from your authenticator app." : "Your financial world, protected and in one place."}</p>{!isPending && authMode !== "verify" && authMode !== "enroll" && <>{authMode === "signup" && <label>Your name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} autoComplete="name" placeholder="Your name" /></label>}<label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" /></label><label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} placeholder="12 characters minimum" /></label>{authError && <div className="auth-error">{authError}</div>}<button className="primary wide" disabled={authBusy} onClick={submitAuth}>{authBusy ? "Please wait…" : authMode === "signup" ? "Create secure account" : "Sign in securely"}</button><button className="auth-switch" onClick={() => {setAuthError("");setAuthMode(authMode === "signup" ? "login" : "signup")}}>{authMode === "signup" ? "Already have an account? Sign in" : "New to Vaultyra? Create an account"}</button></>}{!isPending && (authMode === "verify" || authMode === "enroll") && <>{authMode === "enroll" && totpUri && <div className="qr-box"><QRCodeSVG value={totpUri} size={156} /><small>Save your recovery codes after verification.</small></div>}<label>Authentication code<input className="code-input" value={authCode} onChange={e=>setAuthCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" maxLength={6} placeholder="000000" /></label>{authError && <div className="auth-error">{authError}</div>}<button className="primary wide" disabled={authBusy || authCode.length !== 6} onClick={verifyTwoFactor}>{authBusy ? "Verifying…" : "Verify and enter"}</button>{backupCodes.length > 0 && <details className="backup-codes"><summary>Show recovery codes</summary><code>{backupCodes.join("\n")}</code></details>}<button className="auth-switch" onClick={() => setAuthMode("login")}>Use a different account</button></>}<small className="auth-foot">Encrypted sessions · Authenticator 2FA · Self-hosted</small></section></div>}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}
