"use client";

import { useMemo, useState } from "react";

type Account = { name: string; type: string; institution: string; balance: number; accent: string };

const initialAccounts: Account[] = [
  { name: "Everyday Checking", type: "Cash", institution: "Chase", balance: 18420.16, accent: "#38e9bd" },
  { name: "Sapphire Reserve", type: "Credit card", institution: "Chase", balance: -2841.32, accent: "#f4a261" },
  { name: "Individual Brokerage", type: "Investment", institution: "Fidelity", balance: 84570.48, accent: "#7f7bff" },
  { name: "Crypto portfolio", type: "Crypto", institution: "Coinbase + Pionex", balance: 12916.82, accent: "#58b7ff" },
];

const history = [91, 95, 93, 99, 105, 108, 114, 112, 119, 123, 121, 130];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function Icon({ name }: { name: string }) {
  const icons: Record<string, string> = { overview: "⌂", accounts: "◫", activity: "↕", plan: "⌁", import: "⇧", settings: "⚙", shield: "◇", plus: "+", bell: "•" };
  return <span className="icon" aria-hidden="true">{icons[name]}</span>;
}

export default function Home() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [range, setRange] = useState("1Y");
  const [scenario, setScenario] = useState(false);
  const [drawer, setDrawer] = useState<"account" | "import" | "security" | null>(null);
  const [toast, setToast] = useState("");
  const [locked, setLocked] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup" | "verify">("login");
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const total = useMemo(() => accounts.reduce((sum, account) => sum + account.balance, 0), [accounts]);
  const projected = scenario ? total * 1.194 : total * 1.126;
  const graph = scenario ? [...history, 137, 147, 159] : [...history, 134, 139, 144];
  const points = graph.map((v, i) => `${(i / (graph.length - 1)) * 760},${220 - ((v - 85) / 75) * 185}`).join(" ");

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function addAccount() {
    const amount = Number(balance.replace(/[^0-9.-]/g, ""));
    if (!name || !Number.isFinite(amount)) return;
    setAccounts((current) => [...current, { name, type: "Custom", institution: "Manual", balance: amount, accent: "#fe67d4" }]);
    setName(""); setBalance(""); setDrawer(null); notify("Account added to your vault");
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
          <button className="profile" onClick={() => { setAuthMode("login"); setLocked(true); }}><span className="avatar">SL</span><span><strong>Sam Lawson</strong><small>Lock this vault</small></span><span>⋯</span></button>
        </div>
      </aside>

      <section className="content">
        <header><div><p className="eyebrow">TUESDAY, JULY 21</p><h1>Good afternoon, Sam.</h1><p>Your financial world is looking stronger today.</p></div><div className="header-actions"><button className="circle" aria-label="Notifications"><Icon name="bell" /></button><button className="primary" onClick={() => setDrawer("account")}><Icon name="plus" /> Add account</button></div></header>

        <section className="hero-grid">
          <article className="net-card">
            <div className="card-top"><div><span className="label">TOTAL NET WORTH</span><h2>{money(total)}</h2><p><b>↗ 8.4%</b> <span>+$9,411 this year</span></p></div><div className="range-tabs">{["1M","3M","1Y","ALL"].map((item) => <button key={item} className={range === item ? "selected" : ""} onClick={() => setRange(item)}>{item}</button>)}</div></div>
            <div className="chart" aria-label={`Net worth chart for ${range}`}><svg viewBox="0 0 760 230" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#43e7c3" stopOpacity=".28"/><stop offset="1" stopColor="#43e7c3" stopOpacity="0"/></linearGradient></defs><polygon points={`0,230 ${points} 760,230`} fill="url(#fill)"/><polyline points={points} fill="none" stroke="#50e3c2" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="760" cy={points.split(" ").at(-1)?.split(",")[1]} r="7" fill="#071815" stroke="#57f4cd" strokeWidth="4"/></svg><div className="axis"><span>AUG</span><span>NOV</span><span>FEB</span><span>MAY</span><span>JUL</span></div></div>
          </article>

          <article className="projection-card" id="projection"><div className="projection-head"><span className="spark">✦</span><span>VAULTYRA FORECAST</span></div><h3>Your money, 12 months from now</h3><div className="forecast-number">{money(projected)}</div><p>Based on your {scenario ? "custom plan" : "current pace"}</p><div className="mini-bars">{[28,36,42,49,58,67,78,88].map((h,i)=><i key={i} style={{height: `${h}%`}} />)}</div><div className="forecast-row"><span>Projected growth</span><b>{scenario ? "+19.4%" : "+12.6%"}</b></div><button className="scenario-button" onClick={() => setScenario(!scenario)}>{scenario ? "Use history forecast" : "Build a what-if scenario"} <span>→</span></button></article>
        </section>

        <section className="summary-row"><div><span>Cash</span><strong>{money(18420)}</strong><em className="up">+2.1%</em></div><div><span>Investments</span><strong>{money(84570)}</strong><em className="up">+11.8%</em></div><div><span>Crypto</span><strong>{money(12917)}</strong><em className="up">+18.2%</em></div><div><span>Credit cards</span><strong>{money(2841)}</strong><em className="down">$1,159 available</em></div></section>

        <section className="lower-grid" id="accounts">
          <article className="panel accounts-panel"><div className="panel-title"><div><h3>Connected accounts</h3><p>Everything you own and owe, in one place.</p></div><button onClick={() => setDrawer("account")}>Manage</button></div><div className="account-list">{accounts.map((account) => <button className="account-row" key={account.name} onClick={() => notify(`${account.name} details opened`)}><span className="account-mark" style={{background: account.accent}}>{account.institution[0]}</span><span className="account-name"><strong>{account.name}</strong><small>{account.institution} · {account.type}</small></span><span className={account.balance < 0 ? "negative" : ""}><strong>{money(Math.abs(account.balance))}</strong><small>{account.balance < 0 ? "Balance due" : "Updated now"}</small></span><b className="chevron">›</b></button>)}</div></article>
          <article className="panel allocation"><div className="panel-title"><div><h3>Portfolio mix</h3><p>Across all investment accounts</p></div><button aria-label="Portfolio options">⋯</button></div><div className="donut-wrap"><div className="donut"><div><strong>$97.5k</strong><span>invested</span></div></div><div className="legend"><div><i className="dot violet"/><span>US stocks</span><b>54%</b></div><div><i className="dot mint"/><span>Crypto</span><b>23%</b></div><div><i className="dot blue"/><span>International</span><b>15%</b></div><div><i className="dot gray"/><span>Bonds & cash</span><b>8%</b></div></div></div><div className="insight"><span>✦</span><p><strong>Healthy diversification</strong>Your mix is aligned with your growth profile.</p></div></article>
        </section>
      </section>

      {drawer && <div className="modal-backdrop" onMouseDown={() => setDrawer(null)}><section className="modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setDrawer(null)}>×</button>{drawer === "account" && <><span className="modal-kicker">EXPAND YOUR VAULT</span><h2>Add an account</h2><p>Connect a provider or add a balance manually.</p><div className="providers">{["Bank account", "Fidelity", "Coinbase", "Pionex"].map(provider => <button key={provider} onClick={() => notify(`${provider} connection flow ready for credentials`)}><span>{provider[0]}</span>{provider}<b>Connect</b></button>)}</div><div className="divider"><span>or add manually</span></div><label>Account name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Emergency fund" /></label><label>Current balance<input value={balance} onChange={e=>setBalance(e.target.value)} inputMode="decimal" placeholder="$0.00" /></label><button className="primary wide" onClick={addAccount}>Add to Vaultyra</button></>}{drawer === "import" && <><span className="modal-kicker">BRING YOUR HISTORY</span><h2>Import transactions</h2><p>Upload CSV or XLSX exports from your bank, broker, or previous finance app.</p><label className="dropzone"><input type="file" accept=".csv,.xlsx,.xls" onChange={(e)=>e.target.files?.[0] && notify(`${e.target.files[0].name} is ready to map`)} /><span>⇧</span><strong>Drop a spreadsheet here</strong><small>or click to browse · CSV, XLSX up to 25 MB</small></label><div className="privacy-note">Your import is processed inside your Vaultyra instance.</div></>}{drawer === "security" && <><span className="modal-kicker">SECURITY CENTER</span><h2>Your vault is protected</h2><p>Security controls are designed for a self-hosted financial system.</p><div className="security-list"><div><span>✓</span><p><strong>Authenticator 2FA</strong><small>Required for every account</small></p><b>On</b></div><div><span>✓</span><p><strong>Encrypted secrets</strong><small>Provider tokens encrypted at rest</small></p><b>On</b></div><div><span>✓</span><p><strong>Session protection</strong><small>Secure cookies and automatic expiry</small></p><b>On</b></div></div><button className="primary wide" onClick={() => {setDrawer(null);notify("Security settings saved")}}>Review recovery codes</button></>}</section></div>}
      {locked && <div className="auth-screen"><section className="auth-card"><img src="/vaultyra-logo.png" alt="Vaultyra logo" /><span className="modal-kicker">PRIVATE BY DESIGN</span><h2>{authMode === "signup" ? "Create your vault" : authMode === "verify" ? "Verify it’s you" : "Welcome back"}</h2><p>{authMode === "verify" ? "Enter the 6-digit code from your authenticator app." : "Your financial world, protected and in one place."}</p>{authMode !== "verify" ? <><label>Email address<input type="email" placeholder="you@example.com" /></label><label>Password<input type="password" placeholder="••••••••••••" /></label><button className="primary wide" onClick={() => setAuthMode("verify")}>{authMode === "signup" ? "Create account" : "Sign in securely"}</button><button className="auth-switch" onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}>{authMode === "signup" ? "Already have an account? Sign in" : "New to Vaultyra? Create an account"}</button></> : <><label>Authentication code<input className="code-input" inputMode="numeric" maxLength={6} placeholder="000000" /></label><button className="primary wide" onClick={() => { setLocked(false); setAuthMode("login"); notify("Vault unlocked securely"); }}>Verify and enter</button><button className="auth-switch" onClick={() => setAuthMode("login")}>Use a different account</button></>}<small className="auth-foot">End-to-end encrypted · 2FA protected · Self-hosted</small></section></div>}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}
