import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// UTILS & HELPERS
// ============================================================
const generateId = () => Math.random().toString(36).substr(2, 9).toUpperCase();
const generateBillNo = () => `INV-${Date.now().toString().slice(-6)}`;
const today = () => new Date().toISOString().split("T")[0];
const fmt = (n) => `₹${parseFloat(n || 0).toFixed(2)}`;
const fmtShort = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

function useLocalStorage(key, def) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; }
    catch { return def; }
  });
  const set = useCallback((v) => {
    setVal(prev => { const next = typeof v === "function" ? v(prev) : v; localStorage.setItem(key, JSON.stringify(next)); return next; });
  }, [key]);
  return [val, set];
}

// ============================================================
// INITIAL SEED DATA
// ============================================================
const SEED_PRODUCTS = [
  { id: "p1", name: "Classic White Shirt", category: "Shirt", price: 899, stock: 45 },
  { id: "p2", name: "Slim Fit Jeans", category: "Jeans", price: 1499, stock: 30 },
  { id: "p3", name: "Graphic T-Shirt", category: "T-Shirt", price: 499, stock: 8 },
  { id: "p4", name: "Formal Trousers", category: "Trousers", price: 1299, stock: 20 },
  { id: "p5", name: "Polo T-Shirt", category: "T-Shirt", price: 699, stock: 3 },
  { id: "p6", name: "Denim Jacket", category: "Jacket", price: 2499, stock: 12 },
  { id: "p7", name: "Striped Kurta", category: "Kurta", price: 999, stock: 25 },
  { id: "p8", name: "Cargo Shorts", category: "Shorts", price: 799, stock: 0 },
];
const SEED_CUSTOMERS = [
  { id: "c1", name: "Rahul Sharma", phone: "9876543210", totalPurchases: 5240, totalBills: 4, lastVisit: "2025-03-01" },
  { id: "c2", name: "Priya Patel", phone: "9123456789", totalPurchases: 2890, totalBills: 2, lastVisit: "2025-02-28" },
];
const SEED_BILLS = [
  { id: "b1", billNo: "INV-001001", date: today(), customerId: "c1", customerName: "Rahul Sharma", phone: "9876543210", items: [{ name: "Classic White Shirt", qty: 2, price: 899, total: 1798 }], subtotal: 1798, discount: 100, total: 1698, status: "paid" },
  { id: "b2", billNo: "INV-001002", date: today(), customerId: "c2", customerName: "Priya Patel", phone: "9123456789", items: [{ name: "Slim Fit Jeans", qty: 1, price: 1499, total: 1499 }], subtotal: 1499, discount: 0, total: 1499, status: "paid" },
  { id: "b3", billNo: "INV-000923", date: "2025-03-01", customerId: "c1", customerName: "Rahul Sharma", phone: "9876543210", items: [{ name: "Graphic T-Shirt", qty: 3, price: 499, total: 1497 }], subtotal: 1497, discount: 50, total: 1447, status: "paid" },
];

// ============================================================
// STORE INFO (Settings)
// ============================================================
const DEFAULT_STORE = { name: "Sai Fashion", address: "Main Market Road, Hyderabad - 500001", phone: "9988776655", email: "saifashion@gmail.com", gstin: "36ABCDE1234F1Z5", tagline: "Style That Speaks, Prices That Smile ✨" };

// ============================================================
// ICONS (inline SVG)
// ============================================================
const Icon = ({ d, size = 20, cls = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
    {Array.isArray(d) ? d.map((p, i) => typeof p === "string" ? <path key={i} d={p} /> : <circle key={i} cx={p[0]} cy={p[1]} r={p[2]} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  dashboard: ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M9 22V12h6v10"],
  bill: ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"],
  products: ["M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"],
  customers: ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", [9, 7, 4], "M23 21v-2a4 4 0 00-3-3.87", "M16 3.13a4 4 0 010 7.75"],
  reports: ["M18 20V10", "M12 20V4", "M6 20v-6"],
  settings: ["M12 15a3 3 0 100-6 3 3 0 000 6z", "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"],
  plus: "M12 5v14M5 12h14",
  trash: ["M3 6h18", "M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"],
  edit: ["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7", "M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"],
  search: [[12, 11, 8], "M21 21l-4.35-4.35"],
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  print: ["M6 9V2h12v7", "M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2", "M6 14h12v8H6z"],
  whatsapp: [[12, 12, 10], "M8.56 2.9A7 7 0 0119 13.44L21 22l-8.56-2A7 7 0 018.56 2.9z"],
  logout: ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  menu: "M3 12h18M3 6h18M3 18h18",
  close: "M18 6L6 18M6 6l12 12",
  warning: ["M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z", "M12 9v4", [12, 17, 0.5]],
  check: "M20 6L9 17l-5-5",
  receipt: ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6"],
  trending: "M23 6l-9.5 9.5-5-5L1 18",
  user: [[12, 8, 4], "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"],
};

// ============================================================
// COMPONENTS
// ============================================================
const Card = ({ children, cls = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${cls}`}>{children}</div>
);

const Btn = ({ children, onClick, variant = "primary", cls = "", disabled = false, size = "md" }) => {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    outline: "border border-slate-200 text-slate-700 hover:bg-slate-50",
    whatsapp: "bg-green-500 text-white hover:bg-green-600",
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${cls}`}>{children}</button>;
};

const Input = ({ label, value, onChange, placeholder, type = "text", cls = "", required = false, readOnly = false }) => (
  <div className={`flex flex-col gap-1 ${cls}`}>
    {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly}
      className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 transition-all ${readOnly ? "bg-slate-50 text-slate-500" : ""}`} />
  </div>
);

const Select = ({ label, value, onChange, options, cls = "" }) => (
  <div className={`flex flex-col gap-1 ${cls}`}>
    {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Badge = ({ children, color = "blue" }) => {
  const colors = { blue: "bg-blue-50 text-blue-700", green: "bg-emerald-50 text-emerald-700", red: "bg-red-50 text-red-700", yellow: "bg-yellow-50 text-yellow-700", slate: "bg-slate-100 text-slate-600" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>{children}</span>;
};

const Modal = ({ open, onClose, title, children, width = "max-w-lg" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className={`relative w-full ${width} bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <Icon d={ICONS.close} size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  );
};

const Toast = ({ msg, type = "success" }) => {
  if (!msg) return null;
  const colors = { success: "bg-emerald-600", error: "bg-red-600", info: "bg-blue-600" };
  return (
    <div className={`fixed top-4 right-4 z-[100] ${colors[type]} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-[slideIn_0.2s_ease]`}>
      <Icon d={ICONS.check} size={16} /> {msg}
    </div>
  );
};

// ============================================================
// PAGE: LOGIN
// ============================================================
function LoginPage({ onLogin }) {
  const [user, setUser] = useState("admin");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const handle = () => {
    if (user === "admin" && pass === "admin123") onLogin();
    else setErr("Invalid credentials. Try admin / admin123");
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur">
            <span className="text-3xl">👔</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Sai Fashion POS</h1>
          <p className="text-blue-200 mt-1">Clothing Retail Management</p>
        </div>
        <Card cls="p-6">
          <div className="space-y-4">
            <Input label="Username" value={user} onChange={setUser} placeholder="admin" />
            <Input label="Password" value={pass} onChange={setPass} placeholder="••••••••" type="password" />
            {err && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
            <Btn onClick={handle} cls="w-full" size="lg">Login to Dashboard</Btn>
            <p className="text-center text-xs text-slate-400">Demo: admin / admin123</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// PAGE: DASHBOARD
// ============================================================
function Dashboard({ bills, customers, products }) {
  const todayBills = bills.filter(b => b.date === today());
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthBills = bills.filter(b => b.date.startsWith(thisMonth));
  const todaySales = todayBills.reduce((s, b) => s + b.total, 0);
  const monthSales = monthBills.reduce((s, b) => s + b.total, 0);
  const lowStock = products.filter(p => p.stock <= 5);

  // Last 7 days chart data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-IN", { weekday: "short" });
    const sales = bills.filter(b => b.date === ds).reduce((s, b) => s + b.total, 0);
    return { label, sales };
  });
  const maxSale = Math.max(...last7.map(d => d.sales), 1);

  const stats = [
    { label: "Today's Sales", value: fmtShort(todaySales), sub: `${todayBills.length} bills`, icon: "💰", color: "bg-blue-50 text-blue-600" },
    { label: "Monthly Sales", value: fmtShort(monthSales), sub: `${monthBills.length} bills`, icon: "📅", color: "bg-purple-50 text-purple-600" },
    { label: "Total Bills", value: bills.length, sub: "all time", icon: "🧾", color: "bg-emerald-50 text-emerald-600" },
    { label: "Customers", value: customers.length, sub: "registered", icon: "👥", color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500 text-sm">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <Card key={s.label} cls="p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            <div className="text-xs text-slate-400">{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Sales Chart */}
      <Card cls="p-5">
        <h3 className="font-bold text-slate-800 mb-4">Last 7 Days Sales</h3>
        <div className="flex items-end gap-2 h-28">
          {last7.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-xs text-slate-500 font-medium">{d.sales > 0 ? `₹${Math.round(d.sales / 100) * 100 >= 1000 ? (d.sales / 1000).toFixed(1) + "k" : Math.round(d.sales)}` : ""}</div>
              <div className="w-full rounded-t-lg bg-blue-100 relative overflow-hidden" style={{ height: `${Math.max((d.sales / maxSale) * 80, d.sales > 0 ? 8 : 2)}px` }}>
                <div className="absolute inset-0 bg-blue-500 rounded-t-lg" style={{ height: "100%" }} />
              </div>
              <div className="text-xs text-slate-500">{d.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <Card cls="p-5 border-yellow-200 bg-yellow-50">
          <div className="flex items-center gap-2 mb-3">
            <Icon d={ICONS.warning} size={18} cls="text-yellow-600" />
            <h3 className="font-bold text-yellow-800">Low Stock Alert</h3>
          </div>
          <div className="space-y-2">
            {lowStock.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2">
                <span className="text-sm text-slate-700 font-medium">{p.name}</span>
                <Badge color={p.stock === 0 ? "red" : "yellow"}>{p.stock === 0 ? "Out of Stock" : `${p.stock} left`}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Bills */}
      <Card cls="p-5">
        <h3 className="font-bold text-slate-800 mb-4">Recent Bills</h3>
        {bills.slice(-5).reverse().map(b => (
          <div key={b.id} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
            <div>
              <div className="text-sm font-semibold text-slate-800">{b.customerName}</div>
              <div className="text-xs text-slate-400">{b.billNo} · {b.date}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-800">{fmtShort(b.total)}</div>
              <Badge color="green">Paid</Badge>
            </div>
          </div>
        ))}
        {bills.length === 0 && <p className="text-slate-400 text-sm text-center py-4">No bills yet</p>}
      </Card>
    </div>
  );
}

// ============================================================
// INVOICE HTML BUILDER — A4 Professional Design
// ============================================================
function buildInvoiceHTML(bill, store) {
  if (!bill) return "";

  const dateStr = new Date(bill.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const itemRows = bill.items.map((it, i) => `
    <tr>
      <td class="col-sno">${i + 1}</td>
      <td class="col-desc">${it.name}</td>
      <td class="col-qty">${it.qty}</td>
      <td class="col-rate">₹${parseFloat(it.price).toFixed(2)}</td>
      <td class="col-amt">₹${parseFloat(it.total).toFixed(2)}</td>
    </tr>`).join("");

  // Fill blank rows to maintain table height for small bills
  const blankCount = Math.max(0, 5 - bill.items.length);
  const blankRows = Array(blankCount).fill(`<tr><td class="col-sno">&nbsp;</td><td class="col-desc"></td><td class="col-qty"></td><td class="col-rate"></td><td class="col-amt"></td></tr>`).join("");

  const amtInWords = numberToWords(Math.round(bill.total));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Invoice ${bill.billNo} — ${store.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}

  body{
    font-family:'Inter',sans-serif;
    background:#e8ecf0;
    display:flex;
    justify-content:center;
    padding:32px 16px;
    min-height:100vh;
  }

  /* ── PAGE SHELL ─────────────────────────────── */
  .page{
    background:#fff;
    width:210mm;
    min-height:297mm;
    display:flex;
    flex-direction:column;
    box-shadow:0 4px 40px rgba(0,0,0,0.18);
    position:relative;
  }

  /* ── TOP ACCENT BAR ─────────────────────────── */
  .accent-bar{
    height:6px;
    background:linear-gradient(90deg,#1e3a8a 0%,#2563eb 40%,#0ea5e9 100%);
  }

  /* ── HEADER ─────────────────────────────────── */
  .header{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    padding:28px 36px 20px;
    border-bottom:2px solid #1e3a8a;
  }

  .brand-block{}
  .brand-name{
    font-size:30px;
    font-weight:800;
    color:#1e3a8a;
    letter-spacing:-0.5px;
    line-height:1;
  }
  .brand-tagline{
    font-size:11px;
    color:#64748b;
    font-weight:400;
    margin-top:3px;
    letter-spacing:0.5px;
    text-transform:uppercase;
  }
  .brand-contact{
    margin-top:12px;
    font-size:11.5px;
    color:#334155;
    line-height:1.9;
  }
  .brand-contact span{color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-top:4px}

  .invoice-block{text-align:right}
  .invoice-title{
    font-size:32px;
    font-weight:800;
    color:#1e3a8a;
    letter-spacing:3px;
    text-transform:uppercase;
    line-height:1;
  }
  .invoice-subtitle{
    font-size:11px;
    color:#64748b;
    margin-top:4px;
    letter-spacing:1px;
    text-transform:uppercase;
  }
  .invoice-meta{
    margin-top:14px;
    display:grid;
    grid-template-columns:auto auto;
    gap:4px 20px;
    text-align:right;
  }
  .meta-key{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;font-weight:600}
  .meta-val{font-size:12px;color:#1e293b;font-weight:700}

  /* ── PAID WATERMARK ─────────────────────────── */
  .watermark{
    position:absolute;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%) rotate(-35deg);
    font-size:96px;
    font-weight:900;
    color:rgba(34,197,94,0.055);
    letter-spacing:12px;
    pointer-events:none;
    white-space:nowrap;
    z-index:0;
    user-select:none;
  }

  /* ── CUSTOMER + BILL INFO ROW ───────────────── */
  .info-row{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:0;
    border-bottom:1px solid #e2e8f0;
  }
  .info-box{padding:16px 36px}
  .info-box:first-child{border-right:1px solid #e2e8f0}
  .info-box-label{
    font-size:9.5px;
    font-weight:700;
    color:#2563eb;
    text-transform:uppercase;
    letter-spacing:1.5px;
    margin-bottom:8px;
    padding-bottom:5px;
    border-bottom:1px solid #dbeafe;
  }
  .info-line{
    display:flex;
    align-items:baseline;
    gap:8px;
    margin-bottom:4px;
  }
  .il-key{font-size:10px;color:#94a3b8;min-width:70px;flex-shrink:0;font-weight:500}
  .il-val{font-size:12px;color:#1e293b;font-weight:600}
  .il-val.big{font-size:15px;font-weight:800;color:#1e3a8a}

  /* ── TABLE ──────────────────────────────────── */
  .table-wrap{padding:20px 36px 0;position:relative;z-index:1}
  .table-section-label{
    font-size:9.5px;
    font-weight:700;
    color:#2563eb;
    text-transform:uppercase;
    letter-spacing:1.5px;
    margin-bottom:10px;
  }
  table{width:100%;border-collapse:collapse;font-size:12.5px}

  /* header row */
  thead tr{background:#1e3a8a}
  thead th{
    color:#fff;
    font-size:10px;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:1px;
    padding:10px 12px;
    white-space:nowrap;
  }
  thead th:first-child{border-radius:0}
  thead th.col-sno{width:40px;text-align:center}
  thead th.col-desc{text-align:left}
  thead th.col-qty{width:55px;text-align:center}
  thead th.col-rate{width:100px;text-align:right}
  thead th.col-amt{width:110px;text-align:right}

  /* body rows */
  tbody tr{border-bottom:1px solid #f1f5f9}
  tbody tr:nth-child(even){background:#f8fafc}
  tbody tr:nth-child(odd){background:#fff}
  tbody td{padding:10px 12px;color:#334155;vertical-align:middle}
  tbody td.col-sno{text-align:center;color:#94a3b8;font-size:11px}
  tbody td.col-desc{font-weight:500;color:#1e293b}
  tbody td.col-qty{text-align:center;font-weight:600;color:#475569}
  tbody td.col-rate{text-align:right;color:#475569}
  tbody td.col-amt{text-align:right;font-weight:700;color:#1e293b}

  /* ── TOTALS SECTION ─────────────────────────── */
  .totals-wrap{
    display:flex;
    justify-content:flex-end;
    padding:16px 36px 0;
    position:relative;
    z-index:1;
  }
  .totals-box{
    width:260px;
    border:1px solid #e2e8f0;
    border-radius:6px;
    overflow:hidden;
  }
  .t-row{
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:8px 14px;
    font-size:12px;
    border-bottom:1px solid #f1f5f9;
  }
  .t-row:last-child{border-bottom:none}
  .t-row .t-key{color:#64748b;font-weight:500}
  .t-row .t-val{font-weight:600;color:#1e293b}
  .t-row.discount .t-key,.t-row.discount .t-val{color:#16a34a}
  .t-row.grand{background:#1e3a8a;padding:12px 14px}
  .t-row.grand .t-key{color:#93c5fd;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px}
  .t-row.grand .t-val{color:#fff;font-size:18px;font-weight:800}

  /* ── AMOUNT IN WORDS ────────────────────────── */
  .words-wrap{
    padding:10px 36px 0;
    position:relative;z-index:1;
  }
  .words-box{
    background:#f0f9ff;
    border:1px solid #bae6fd;
    border-radius:6px;
    padding:9px 14px;
    font-size:11.5px;
    color:#0369a1;
    font-weight:500;
  }
  .words-box strong{font-weight:700;color:#0c4a6e}

  /* ── TERMS + SIGNATURE ──────────────────────── */
  .bottom-row{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:0;
    padding:16px 36px;
    margin-top:8px;
    border-top:1px solid #e2e8f0;
    position:relative;z-index:1;
  }
  .terms-block{}
  .terms-title{font-size:9.5px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
  .terms-list{font-size:10.5px;color:#64748b;line-height:1.8;padding-left:12px}
  .terms-list li{margin-bottom:1px}

  .sig-block{text-align:right}
  .sig-line{
    width:140px;
    border-bottom:1.5px solid #334155;
    margin:30px 0 6px auto;
  }
  .sig-label{font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.8px}
  .sig-store{font-size:11px;color:#1e293b;font-weight:700;margin-top:2px}

  /* ── FOOTER ─────────────────────────────────── */
  .footer{
    margin-top:auto;
    background:#1e3a8a;
    padding:12px 36px;
    display:flex;
    justify-content:space-between;
    align-items:center;
  }
  .footer-left{font-size:10px;color:#93c5fd;font-weight:500}
  .footer-center{font-size:11px;color:#fff;font-weight:700;text-align:center}
  .footer-right{font-size:10px;color:#93c5fd;font-weight:500;text-align:right}

  /* ── BOTTOM ACCENT ──────────────────────────── */
  .accent-bar-bottom{
    height:4px;
    background:linear-gradient(90deg,#0ea5e9 0%,#2563eb 60%,#1e3a8a 100%);
  }

  @media print{
    body{background:#fff;padding:0}
    .page{box-shadow:none;width:100%;min-height:auto}
    @page{size:A4;margin:0}
  }
</style>
</head>
<body>
<div class="page">
  <div class="accent-bar"></div>

  <!-- WATERMARK -->
  <div class="watermark">PAID</div>

  <!-- HEADER -->
  <div class="header">
    <div class="brand-block">
      <div class="brand-name">${store.name}</div>
      <div class="brand-tagline">${store.tagline}</div>
      <div class="brand-contact">
        <span>Address</span>${store.address}
        <span>Phone &amp; Email</span>${store.phone} &nbsp;|&nbsp; ${store.email}
        <span>GSTIN</span>${store.gstin}
      </div>
    </div>
    <div class="invoice-block">
      <div class="invoice-title">Invoice</div>
      <div class="invoice-subtitle">Tax Invoice / Cash Memo</div>
      <div class="invoice-meta">
        <div class="meta-key">Bill No</div>
        <div class="meta-val">${bill.billNo}</div>
        <div class="meta-key">Date</div>
        <div class="meta-val">${dateStr}</div>
        <div class="meta-key">Time</div>
        <div class="meta-val">${timeStr}</div>
        <div class="meta-key">Status</div>
        <div class="meta-val" style="color:#16a34a">● PAID</div>
      </div>
    </div>
  </div>

  <!-- CUSTOMER + SUMMARY INFO ROW -->
  <div class="info-row">
    <div class="info-box">
      <div class="info-box-label">Bill To</div>
      <div class="info-line"><span class="il-key">Customer</span><span class="il-val big">${bill.customerName}</span></div>
      <div class="info-line"><span class="il-key">Phone</span><span class="il-val">${bill.phone}</span></div>
    </div>
    <div class="info-box">
      <div class="info-box-label">Bill Summary</div>
      <div class="info-line"><span class="il-key">Total Items</span><span class="il-val">${bill.items.length} item${bill.items.length > 1 ? "s" : ""}</span></div>
      <div class="info-line"><span class="il-key">Total Qty</span><span class="il-val">${bill.items.reduce((s,i)=>s+Number(i.qty),0)} pcs</span></div>
      <div class="info-line"><span class="il-key">Payable</span><span class="il-val big">₹${bill.total.toFixed(2)}</span></div>
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <div class="table-wrap">
    <div class="table-section-label">Purchased Items</div>
    <table>
      <thead>
        <tr>
          <th class="col-sno">#</th>
          <th class="col-desc">Product Description</th>
          <th class="col-qty">Qty</th>
          <th class="col-rate">Unit Price</th>
          <th class="col-amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        ${blankRows}
      </tbody>
    </table>
  </div>

  <!-- TOTALS -->
  <div class="totals-wrap">
    <div class="totals-box">
      <div class="t-row"><span class="t-key">Subtotal</span><span class="t-val">₹${bill.subtotal.toFixed(2)}</span></div>
      ${bill.discount > 0 ? `<div class="t-row discount"><span class="t-key">Discount (−)</span><span class="t-val">₹${bill.discount.toFixed(2)}</span></div>` : ""}
      <div class="t-row"><span class="t-key">Tax (0%)</span><span class="t-val">—</span></div>
      <div class="t-row grand"><span class="t-key">Grand Total</span><span class="t-val">₹${bill.total.toFixed(2)}</span></div>
    </div>
  </div>

  <!-- AMOUNT IN WORDS -->
  <div class="words-wrap">
    <div class="words-box">
      <strong>Amount in Words:</strong> ${amtInWords} Rupees Only
    </div>
  </div>

  <!-- TERMS + SIGNATURE -->
  <div class="bottom-row">
    <div class="terms-block">
      <div class="terms-title">Terms &amp; Conditions</div>
      <ul class="terms-list">
        <li>Goods once sold will not be taken back without original bill.</li>
        <li>Exchange allowed within 7 days of purchase.</li>
        <li>No exchange on sale / discounted items.</li>
        <li>This is a computer-generated invoice.</li>
      </ul>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Authorised Signatory</div>
      <div class="sig-store">For ${store.name}</div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-left">GSTIN: ${store.gstin}</div>
    <div class="footer-center">Thank you for shopping with us! 🙏</div>
    <div class="footer-right">Powered by Sai Fashion POS</div>
  </div>
  <div class="accent-bar-bottom"></div>
</div>
</body></html>`;
}

function numberToWords(n) {
  if (n === 0) return "Zero";
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  function below100(n){return n<20?ones[n]:tens[Math.floor(n/10)]+(n%10?" "+ones[n%10]:"")}
  function below1000(n){return n<100?below100(n):ones[Math.floor(n/100)]+" Hundred"+(n%100?" "+below100(n%100):"")}
  if(n<1000) return below1000(n);
  if(n<100000) return below1000(Math.floor(n/1000))+" Thousand"+(n%1000?" "+below1000(n%1000):"");
  if(n<10000000) return below1000(Math.floor(n/100000))+" Lakh"+(n%100000?" "+numberToWords(n%100000):"");
  return below1000(Math.floor(n/10000000))+" Crore"+(n%10000000?" "+numberToWords(n%10000000):"");
}

// ============================================================
// PAGE: CREATE BILL
// ============================================================
function CreateBill({ bills, setBills, customers, setCustomers, products, setProducts, store }) {
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [existCust, setExistCust] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState([{ id: generateId(), name: "", qty: 1, price: 0, total: 0 }]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [savedBill, setSavedBill] = useState(null);
  const [toast, setToast] = useState("");
  const [prodSearch, setProdSearch] = useState({});
  const [prodDropdown, setProdDropdown] = useState(null);
  // invoiceRef removed — invoice renders in iframe

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handlePhoneChange = (phone) => {
    setCPhone(phone);
    if (phone.length >= 10) {
      const found = customers.find(c => c.phone === phone);
      if (found) { setExistCust(found); setCName(found.name); }
      else setExistCust(null);
    }
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      if (field === "qty" || field === "price") updated.total = (parseFloat(updated.qty) || 0) * (parseFloat(updated.price) || 0);
      return updated;
    }));
  };

  const selectProduct = (itemId, prod) => {
    setItems(prev => prev.map(it => it.id !== itemId ? it : { ...it, name: prod.name, price: prod.price, total: (it.qty || 1) * prod.price }));
    setProdDropdown(null);
    setProdSearch(prev => ({ ...prev, [itemId]: "" }));
  };

  const addItem = () => setItems(prev => [...prev, { id: generateId(), name: "", qty: 1, price: 0, total: 0 }]);
  const removeItem = (id) => setItems(prev => prev.filter(it => it.id !== id));

  const subtotal = items.reduce((s, it) => s + (it.total || 0), 0);
  const discAmt = parseFloat(discount) || 0;
  const total = Math.max(subtotal - discAmt, 0);

  const handleGenerate = () => {
    if (!cName.trim() || !cPhone.trim()) { showToast("Enter customer name and phone"); return; }
    if (items.every(it => !it.name)) { showToast("Add at least one product"); return; }

    const bill = {
      id: generateId(), billNo: generateBillNo(), date: today(),
      customerId: existCust?.id || generateId(),
      customerName: cName, phone: cPhone,
      items: items.filter(it => it.name),
      subtotal, discount: discAmt, total, status: "paid"
    };

    // Update stock
    setProducts(prev => prev.map(p => {
      const item = bill.items.find(it => it.name === p.name);
      if (!item) return p;
      return { ...p, stock: Math.max(p.stock - item.qty, 0) };
    }));

    // Update/add customer
    setCustomers(prev => {
      const idx = prev.findIndex(c => c.phone === cPhone);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], totalPurchases: updated[idx].totalPurchases + total, totalBills: updated[idx].totalBills + 1, lastVisit: today() };
        return updated;
      }
      return [...prev, { id: bill.customerId, name: cName, phone: cPhone, totalPurchases: total, totalBills: 1, lastVisit: today() }];
    });

    setBills(prev => [...prev, bill]);
    setSavedBill(bill);
    setShowInvoice(true);
    showToast("Bill generated successfully!");
  };

  const handlePrint = () => {
    const content = buildInvoiceHTML(savedBill, store);
    const win = window.open("", "_blank");
    win.document.write(content);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 500);
  };

  const handleDownload = async () => {
    if (!savedBill) return;
    // Use browser print-to-PDF via a styled popup window
    const content = buildInvoiceHTML(savedBill, store);
    const win = window.open("", "_blank");
    win.document.write(content);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 600);
  };

  const handleWhatsApp = () => {
    if (!savedBill) return;
    const text = `*${store.name}*\n${store.address}\n\n*Bill: ${savedBill.billNo}*\nDate: ${savedBill.date}\nCustomer: ${savedBill.customerName}\n\n*Items:*\n${savedBill.items.map(it => `${it.name} x${it.qty} = ₹${it.total}`).join("\n")}\n\nSubtotal: ₹${savedBill.subtotal}\nDiscount: ₹${savedBill.discount}\n*Total: ₹${savedBill.total}*\n\nThank you for shopping!`;
    window.open(`https://wa.me/${savedBill.phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const newBill = () => { setCName(""); setCPhone(""); setExistCust(null); setDiscount(0); setItems([{ id: generateId(), name: "", qty: 1, price: 0, total: 0 }]); setShowInvoice(false); setSavedBill(null); };

  return (
    <div className="space-y-4">
      <Toast msg={toast} />
      {!showInvoice ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Create Bill</h2>
            <Badge color="blue">{generateBillNo()}</Badge>
          </div>

          {/* Customer */}
          <Card cls="p-4">
            <h3 className="font-bold text-slate-700 mb-3">Customer Info</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="relative">
                <Input label="Phone Number" value={cPhone} onChange={handlePhoneChange} placeholder="9876543210" type="tel" />
                {existCust && <div className="mt-1 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1"><Icon d={ICONS.check} size={12} /> Returning customer found!</div>}
              </div>
              <Input label="Customer Name" value={cName} onChange={setCName} placeholder="Customer name" required />
            </div>
          </Card>

          {/* Items */}
          <Card cls="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-700">Products</h3>
              <Btn onClick={addItem} variant="secondary" size="sm"><Icon d={ICONS.plus} size={14} /> Add Item</Btn>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">ITEM {idx + 1}</span>
                    {items.length > 1 && <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600"><Icon d={ICONS.trash} size={14} /></button>}
                  </div>
                  <div className="relative">
                    <input value={prodSearch[item.id] !== undefined ? prodSearch[item.id] : item.name}
                      onChange={e => { setProdSearch(p => ({ ...p, [item.id]: e.target.value })); updateItem(item.id, "name", e.target.value); setProdDropdown(item.id); }}
                      onFocus={() => setProdDropdown(item.id)}
                      placeholder="Search product..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {prodDropdown === item.id && (
                      <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto">
                        {products.filter(p => p.name.toLowerCase().includes((prodSearch[item.id] || "").toLowerCase())).map(p => (
                          <button key={p.id} onClick={() => selectProduct(item.id, p)}
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 flex justify-between items-center text-sm border-b border-slate-50 last:border-0">
                            <div>
                              <span className="font-medium text-slate-800">{p.name}</span>
                              <span className="ml-2 text-xs text-slate-400">{p.category}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-blue-600">{fmt(p.price)}</span>
                              {p.stock <= 5 && <Badge color={p.stock === 0 ? "red" : "yellow"} >{p.stock}left</Badge>}
                            </div>
                          </button>
                        ))}
                        {products.filter(p => p.name.toLowerCase().includes((prodSearch[item.id] || "").toLowerCase())).length === 0 && (
                          <div className="px-3 py-3 text-slate-400 text-sm text-center">No products found</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input label="Qty" value={item.qty} onChange={v => updateItem(item.id, "qty", v)} type="number" />
                    <Input label="Price (₹)" value={item.price} onChange={v => updateItem(item.id, "price", v)} type="number" />
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</label>
                      <div className="px-3.5 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm">{fmt(item.total)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Totals */}
          <Card cls="p-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span className="font-semibold">{fmt(subtotal)}</span></div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Discount (₹)</span>
                <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="w-28 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-800">Grand Total</span>
                <span className="text-2xl font-bold text-blue-600">{fmt(total)}</span>
              </div>
            </div>
          </Card>

          <Btn onClick={handleGenerate} cls="w-full" size="lg"><Icon d={ICONS.check} size={18} /> Generate Bill</Btn>
        </>
      ) : (
        <>
          {/* Invoice View */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Invoice Ready</h2>
            <Badge color="green">✓ Saved</Badge>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Btn onClick={handleDownload} variant="primary" size="md" cls="w-full">
              <Icon d={ICONS.download} size={16} /> Download PDF
            </Btn>
            <Btn onClick={handlePrint} variant="secondary" size="md" cls="w-full">
              <Icon d={ICONS.print} size={16} /> Print Invoice
            </Btn>
            <Btn onClick={handleWhatsApp} variant="whatsapp" size="md" cls="w-full">
              <span>📱</span> Share on WhatsApp
            </Btn>
            <Btn onClick={newBill} size="md" cls="w-full">
              <Icon d={ICONS.plus} size={16} /> New Bill
            </Btn>
          </div>

          {/* Live Invoice Preview */}
          <Card cls="overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-slate-500 font-mono">Invoice Preview</span>
            </div>
            <iframe
              srcDoc={buildInvoiceHTML(savedBill, store)}
              className="w-full border-0"
              style={{ height: "680px" }}
              title="Invoice Preview"
            />
          </Card>
        </>
      )}
    </div>
  );
}

// ============================================================
// PAGE: PRODUCTS
// ============================================================
function Products({ products, setProducts }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", category: "Shirt", price: "", stock: "" });
  const [toast, setToast] = useState("");
  const categories = ["Shirt", "Jeans", "T-Shirt", "Trousers", "Kurta", "Jacket", "Shorts", "Other"];

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2000); };

  const openAdd = () => { setForm({ name: "", category: "Shirt", price: "", stock: "" }); setEditing(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ name: p.name, category: p.category, price: p.price, stock: p.stock }); setEditing(p.id); setShowModal(true); };

  const handleSave = () => {
    if (!form.name || !form.price) { showToast("Name and price are required"); return; }
    if (editing) {
      setProducts(prev => prev.map(p => p.id === editing ? { ...p, ...form, price: +form.price, stock: +form.stock } : p));
    } else {
      setProducts(prev => [...prev, { id: generateId(), ...form, price: +form.price, stock: +form.stock }]);
    }
    setShowModal(false);
    showToast(editing ? "Product updated!" : "Product added!");
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this product?")) { setProducts(prev => prev.filter(p => p.id !== id)); showToast("Product deleted"); }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <Toast msg={toast} />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Products</h2>
        <Btn onClick={openAdd} size="sm"><Icon d={ICONS.plus} size={14} /> Add</Btn>
      </div>

      <div className="relative">
        <Icon d={ICONS.search} size={16} cls="absolute left-3.5 top-3 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="space-y-2">
        {filtered.map(p => (
          <Card key={p.id} cls="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                  <Badge color="slate">{p.category}</Badge>
                  {p.stock === 0 && <Badge color="red">Out of Stock</Badge>}
                  {p.stock > 0 && p.stock <= 5 && <Badge color="yellow">Low Stock</Badge>}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-lg font-black text-blue-600">{fmt(p.price)}</span>
                  <span className="text-sm text-slate-500">Stock: <span className="font-bold text-slate-700">{p.stock}</span></span>
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <button onClick={() => openEdit(p)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500"><Icon d={ICONS.edit} size={15} /></button>
                <button onClick={() => handleDelete(p.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400"><Icon d={ICONS.trash} size={15} /></button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-slate-400">No products found</div>}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Product" : "Add Product"}>
        <div className="space-y-4">
          <Input label="Product Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Classic White Shirt" required />
          <Select label="Category" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={categories.map(c => ({ value: c, label: c }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price (₹)" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} type="number" placeholder="999" required />
            <Input label="Stock Qty" value={form.stock} onChange={v => setForm(f => ({ ...f, stock: v }))} type="number" placeholder="50" />
          </div>
          <div className="flex gap-3 pt-2">
            <Btn onClick={() => setShowModal(false)} variant="secondary" cls="flex-1">Cancel</Btn>
            <Btn onClick={handleSave} cls="flex-1">{editing ? "Update" : "Add Product"}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// PAGE: CUSTOMERS
// ============================================================
function Customers({ customers, bills }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));
  const custBills = selected ? bills.filter(b => b.phone === selected.phone) : [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Customers</h2>
      <div className="relative">
        <Icon d={ICONS.search} size={16} cls="absolute left-3.5 top-3 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="space-y-2">
        {filtered.map(c => (
          <Card key={c.id} cls="p-4 cursor-pointer hover:border-blue-200 transition-colors" onClick={() => setSelected(c)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800">{c.name}</div>
                <div className="text-sm text-slate-500">{c.phone}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-600">{fmtShort(c.totalPurchases)}</div>
                <div className="text-xs text-slate-400">{c.totalBills} bills</div>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-slate-400">No customers found</div>}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Customer Details">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-2xl">{selected.name.charAt(0)}</div>
              <div>
                <div className="font-black text-slate-800 text-lg">{selected.name}</div>
                <div className="text-slate-500">{selected.phone}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-blue-50 rounded-xl p-3"><div className="text-xl font-black text-blue-600">{fmtShort(selected.totalPurchases)}</div><div className="text-xs text-slate-500">Total Spent</div></div>
              <div className="bg-emerald-50 rounded-xl p-3"><div className="text-xl font-black text-emerald-600">{selected.totalBills}</div><div className="text-xs text-slate-500">Bills</div></div>
              <div className="bg-purple-50 rounded-xl p-3"><div className="text-xs font-black text-purple-600">{selected.lastVisit}</div><div className="text-xs text-slate-500">Last Visit</div></div>
            </div>
            <div>
              <h4 className="font-bold text-slate-700 mb-2">Purchase History</h4>
              {custBills.length > 0 ? custBills.reverse().map(b => (
                <div key={b.id} className="flex justify-between items-center py-2.5 border-b border-slate-50">
                  <div><div className="text-sm font-semibold text-slate-700">{b.billNo}</div><div className="text-xs text-slate-400">{b.date}</div></div>
                  <div className="font-bold text-slate-800">{fmtShort(b.total)}</div>
                </div>
              )) : <p className="text-slate-400 text-sm">No bills found</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============================================================
// PAGE: REPORTS
// ============================================================
function Reports({ bills }) {
  const [filter, setFilter] = useState("today");
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());

  const getFiltered = () => {
    const now = new Date();
    if (filter === "today") return bills.filter(b => b.date === today());
    if (filter === "week") {
      const d = new Date(); d.setDate(d.getDate() - 7);
      return bills.filter(b => new Date(b.date) >= d);
    }
    if (filter === "month") return bills.filter(b => b.date.startsWith(now.toISOString().slice(0, 7)));
    if (filter === "custom") return bills.filter(b => b.date >= dateFrom && b.date <= dateTo);
    return bills;
  };

  const filtered = getFiltered();
  const totalRevenue = filtered.reduce((s, b) => s + b.total, 0);
  const totalDiscount = filtered.reduce((s, b) => s + (b.discount || 0), 0);

  const exportCSV = () => {
    const rows = [["Bill No", "Date", "Customer", "Phone", "Total", "Discount"]];
    filtered.forEach(b => rows.push([b.billNo, b.date, b.customerName, b.phone, b.total, b.discount]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `sales-report.csv`; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Reports</h2>
        <Btn onClick={exportCSV} variant="secondary" size="sm"><Icon d={ICONS.download} size={14} /> CSV</Btn>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[["today", "Today"], ["week", "This Week"], ["month", "This Month"], ["custom", "Custom"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === v ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>{l}</button>
        ))}
      </div>

      {filter === "custom" && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="From" value={dateFrom} onChange={setDateFrom} type="date" />
          <Input label="To" value={dateTo} onChange={setDateTo} type="date" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card cls="p-4 text-center"><div className="text-2xl font-black text-blue-600">{fmtShort(totalRevenue)}</div><div className="text-xs text-slate-500 mt-1">Revenue</div></Card>
        <Card cls="p-4 text-center"><div className="text-2xl font-black text-emerald-600">{filtered.length}</div><div className="text-xs text-slate-500 mt-1">Bills</div></Card>
        <Card cls="p-4 text-center"><div className="text-2xl font-black text-red-500">{fmtShort(totalDiscount)}</div><div className="text-xs text-slate-500 mt-1">Discounts</div></Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Bill No", "Date", "Customer", "Total"].map(h => <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-bold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.slice().reverse().map(b => (
                <tr key={b.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{b.billNo}</td>
                  <td className="px-4 py-3 text-slate-600">{b.date}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{b.customerName}</td>
                  <td className="px-4 py-3 font-bold text-blue-600">{fmtShort(b.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-slate-400">No data for selected period</div>}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// PAGE: SETTINGS
// ============================================================
function Settings({ store, setStore }) {
  const [form, setForm] = useState(store);
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2000); };

  const handleSave = () => { setStore(form); showToast("Settings saved!"); };

  return (
    <div className="space-y-4">
      <Toast msg={toast} />
      <h2 className="text-xl font-bold text-slate-800">Store Settings</h2>
      <Card cls="p-5">
        <h3 className="font-bold text-slate-700 mb-4">Store Information</h3>
        <div className="space-y-3">
          <Input label="Store Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <Input label="Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} />
          <Input label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} type="tel" />
          <Input label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
          <Input label="GSTIN" value={form.gstin} onChange={v => setForm(f => ({ ...f, gstin: v }))} />
          <Input label="Tagline" value={form.tagline} onChange={v => setForm(f => ({ ...f, tagline: v }))} />
        </div>
        <Btn onClick={handleSave} cls="mt-5 w-full" size="lg">Save Settings</Btn>
      </Card>
      <Card cls="p-5">
        <h3 className="font-bold text-slate-700 mb-2">Admin Account</h3>
        <div className="text-sm text-slate-500 space-y-1">
          <div>Username: <span className="font-bold text-slate-700">admin</span></div>
          <div>Password: <span className="font-bold text-slate-700">admin123</span></div>
        </div>
        <p className="text-xs text-slate-400 mt-3">Contact developer to change admin credentials.</p>
      </Card>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage("pos_auth", false);
  const [page, setPage] = useState("dashboard");
  const [products, setProducts] = useLocalStorage("pos_products", SEED_PRODUCTS);
  const [customers, setCustomers] = useLocalStorage("pos_customers", SEED_CUSTOMERS);
  const [bills, setBills] = useLocalStorage("pos_bills", SEED_BILLS);
  const [store, setStore] = useLocalStorage("pos_store", DEFAULT_STORE);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: ICONS.dashboard, emoji: "📊" },
    { id: "bill", label: "Create Bill", icon: ICONS.bill, emoji: "🧾" },
    { id: "products", label: "Products", icon: ICONS.products, emoji: "📦" },
    { id: "customers", label: "Customers", icon: ICONS.customers, emoji: "👥" },
    { id: "reports", label: "Reports", icon: ICONS.reports, emoji: "📈" },
    { id: "settings", label: "Settings", icon: ICONS.settings, emoji: "⚙️" },
  ];

  if (!isLoggedIn) return <LoginPage onLogin={() => setIsLoggedIn(true)} />;

  const goTo = (p) => { setPage(p); setSidebarOpen(false); };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @media print { .no-print { display: none !important; } }
      `}</style>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 sm:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 z-40 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0`}>
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">👔</div>
            <div>
              <div className="font-black text-slate-800 text-sm leading-tight">{store.name}</div>
              <div className="text-xs text-slate-400">Sai Fashion POS</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(n => (
            <button key={n.id} onClick={() => goTo(n.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${page === n.id ? "bg-blue-600 text-white shadow-sm shadow-blue-200" : "text-slate-600 hover:bg-slate-100"}`}>
              <span className="text-base">{n.emoji}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
            <Icon d={ICONS.logout} size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 sm:ml-64 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="sm:hidden sticky top-0 z-20 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between no-print">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100">
            <Icon d={ICONS.menu} size={20} cls="text-slate-700" />
          </button>
          <div className="font-black text-slate-800">{store.name}</div>
          <button onClick={() => goTo("bill")} className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg">
            🧾
          </button>
        </header>

        <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
          {page === "dashboard" && <Dashboard bills={bills} customers={customers} products={products} />}
          {page === "bill" && <CreateBill bills={bills} setBills={setBills} customers={customers} setCustomers={setCustomers} products={products} setProducts={setProducts} store={store} />}
          {page === "products" && <Products products={products} setProducts={setProducts} />}
          {page === "customers" && <Customers customers={customers} bills={bills} />}
          {page === "reports" && <Reports bills={bills} />}
          {page === "settings" && <Settings store={store} setStore={setStore} />}
        </main>

        {/* Mobile bottom nav */}
        <nav className="sm:hidden sticky bottom-0 bg-white border-t border-slate-100 flex no-print">
          {nav.slice(0, 5).map(n => (
            <button key={n.id} onClick={() => goTo(n.id)}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-all ${page === n.id ? "text-blue-600" : "text-slate-400"}`}>
              <span className="text-lg">{n.emoji}</span>
              <span className="text-[10px] font-semibold">{n.label.split(" ")[0]}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
