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
  .brand-contact span{color:#64748b;font-size:10px;text-transform:
