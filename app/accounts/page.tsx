"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { authClient } from "../../lib/auth-client";

type Account = { id: string; name: string; institution: string; type: string; balance: number; currency: string; accent: string; provider: string };

const accountTypes = ["Checking", "Savings", "Money market", "Credit card", "Investment", "Crypto", "Loan", "Other"];
const colors = ["#48e6bd", "#58b7ff", "#7f7bff", "#f4a261", "#fe67d4"];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function AccountsPage() {
  const { data: session, isPending } = authClient.useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [institution, setInstitution] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("Checking");
  const [balance, setBalance] = useState("");

  const loadAccounts = useCallback(async () => {
    const response = await fetch("/api/accounts");
    if (response.status === 401) return;
    if (!response.ok) throw new Error("Accounts could not be loaded");
    setAccounts(await response.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) loadAccounts().catch((reason) => { setError(reason.message); setLoading(false); });
    if (!isPending && !session) window.location.href = "/";
  }, [session, isPending, loadAccounts]);

  const totals = useMemo(() => ({
    assets: accounts.filter((account) => !account.type.toLowerCase().includes("credit") && !account.type.toLowerCase().includes("loan")).reduce((sum, account) => sum + account.balance, 0),
    debts: Math.abs(accounts.filter((account) => account.type.toLowerCase().includes("credit") || account.type.toLowerCase().includes("loan")).reduce((sum, account) => sum + account.balance, 0)),
  }), [accounts]);

  async function addAccount(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    const amount = Number(balance.replace(/[^0-9.-]/g, ""));
    if (!institution.trim() || !name.trim() || !Number.isFinite(amount)) { setError("Complete all account fields."); setSaving(false); return; }
    const response = await fetch("/api/accounts", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ institution, name, type, balance: amount, accent: colors[accounts.length % colors.length] }),
    });
    if (!response.ok) { setError("The account could not be saved."); setSaving(false); return; }
    const account = await response.json();
    setAccounts((current) => [...current, account]);
    setInstitution(""); setName(""); setBalance(""); setType("Checking"); setShowForm(false); setSaving(false);
  }

  async function removeAccount(account: Account) {
    if (!window.confirm(`Remove ${account.name}? Its transactions will also be removed.`)) return;
    const response = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
    if (response.ok) setAccounts((current) => current.filter((item) => item.id !== account.id));
    else setError("The account could not be removed.");
  }

  if (isPending || !session) return <main className="account-loading">Opening your vault…</main>;

  return <main className="accounts-page">
    <aside className="accounts-sidebar">
      <Link className="brand accounts-brand" href="/"><img src="/vaultyra-logo.png" alt="Vaultyra" /><div><strong>Vaultyra</strong><span>Personal vault</span></div></Link>
      <nav><Link className="nav-item" href="/"><span className="icon">⌂</span>Overview</Link><Link className="nav-item active" href="/accounts"><span className="icon">◫</span>Accounts</Link><button className="nav-item" onClick={() => setShowForm(true)}><span className="icon">+</span>Add account</button></nav>
      <div className="accounts-user"><span>{session.user.name?.slice(0, 2).toUpperCase()}</span><div><strong>{session.user.name}</strong><small>{session.user.email}</small></div></div>
    </aside>

    <section className="accounts-content">
      <header className="accounts-header"><div><p className="eyebrow">YOUR FINANCIAL CONNECTIONS</p><h1>Accounts</h1><p>Add and manage every account that contributes to your net worth.</p></div><button className="primary add-bank-button" onClick={() => setShowForm(true)}>+ Add bank account</button></header>

      <section className="account-stat-grid"><article><span>Total assets</span><strong>{money(totals.assets)}</strong><small>Across {accounts.length} accounts</small></article><article><span>Total debt</span><strong>{money(totals.debts)}</strong><small>Credit cards and loans</small></article><article><span>Net position</span><strong>{money(totals.assets - totals.debts)}</strong><small>Assets minus debt</small></article></section>

      <section className="accounts-main-panel">
        <div className="accounts-panel-heading"><div><h2>Financial accounts</h2><p>Balances are private to your Vaultyra user.</p></div><span>{accounts.length} total</span></div>
        {error && <div className="account-error">{error}</div>}
        {loading ? <div className="accounts-empty">Loading accounts…</div> : accounts.length === 0 ? <div className="accounts-empty"><span>＋</span><h3>Add your first bank account</h3><p>Start with checking, savings, or a credit card. Vaultyra never asks for routing or full account numbers for manual accounts.</p><button className="primary" onClick={() => setShowForm(true)}>Add an account</button></div> : <div className="full-account-list">{accounts.map((account) => <article key={account.id}><span className="large-account-mark" style={{ background: account.accent }}>{account.institution.slice(0,1).toUpperCase()}</span><div><strong>{account.name}</strong><small>{account.institution} · {account.type}</small></div><span className="account-source">{account.provider === "manual" ? "Manual" : "Connected"}</span><div className="account-balance"><strong>{money(account.balance)}</strong><small>Current balance</small></div><button className="account-menu" aria-label={`Remove ${account.name}`} onClick={() => removeAccount(account)}>Remove</button></article>)}</div>}
      </section>
    </section>

    {showForm && <div className="modal-backdrop" onMouseDown={() => setShowForm(false)}><form className="modal bank-form" onSubmit={addAccount} onMouseDown={(event) => event.stopPropagation()}><button type="button" className="modal-close" onClick={() => setShowForm(false)}>×</button><span className="modal-kicker">ADD TO YOUR VAULT</span><h2>Add a bank account</h2><p>Enter the account’s current balance. Do not enter routing numbers, full account numbers, passwords, or PINs.</p><label>Bank or institution<input value={institution} onChange={(event) => setInstitution(event.target.value)} placeholder="e.g. Chase, Fidelity, Local Credit Union" maxLength={100} required /></label><label>Account nickname<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Everyday Checking" maxLength={100} required /></label><label>Account type<select value={type} onChange={(event) => setType(event.target.value)}>{accountTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>Current balance<input value={balance} onChange={(event) => setBalance(event.target.value)} inputMode="decimal" placeholder="0.00" required /></label><div className="bank-form-note">For credit cards or loans, enter the amount owed as a negative value.</div>{error && <div className="account-error">{error}</div>}<button className="primary wide" disabled={saving}>{saving ? "Saving securely…" : "Save bank account"}</button></form></div>}
  </main>;
}
