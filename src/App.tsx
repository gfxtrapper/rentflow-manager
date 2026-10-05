import { useEffect, useState } from 'react';
import { api } from '@appdeploy/client';
import { auth } from '@appdeploy/client';
import {
  Building2,
  LayoutDashboard,
  Home,
  Users,
  FileText,
  WalletCards,
  Wrench,
  Receipt,
  Plus,
  Search,
  LogOut,
  Menu,
  X,
  Bell,
  MoreHorizontal,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock3,
} from 'lucide-react';

type Resource =
  | 'properties'
  | 'units'
  | 'tenants'
  | 'leases'
  | 'payments'
  | 'expenses'
  | 'maintenance';
type Row = { id: string; [key: string]: any };

const nav = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'properties', label: 'Properties', icon: Building2 },
  { key: 'units', label: 'Units', icon: Home },
  { key: 'tenants', label: 'Tenants', icon: Users },
  { key: 'leases', label: 'Leases', icon: FileText },
  { key: 'payments', label: 'Rent payments', icon: WalletCards },
  { key: 'expenses', label: 'Expenses', icon: Receipt },
  { key: 'maintenance', label: 'Maintenance', icon: Wrench },
] as const;

const fields: Record<
  Resource,
  { label: string; key: string; type?: string; placeholder?: string }[]
> = {
  properties: [
    { label: 'Property name', key: 'name' },
    { label: 'Location', key: 'location' },
    { label: 'Address', key: 'address' },
    { label: 'Units', key: 'units', type: 'number' },
  ],
  units: [
    { label: 'Unit number', key: 'unitNumber' },
    { label: 'Property ID', key: 'propertyId' },
    { label: 'Monthly rent (KSh)', key: 'rent', type: 'number' },
    { label: 'Status', key: 'status' },
  ],
  tenants: [
    { label: 'Full name', key: 'name' },
    { label: 'Phone', key: 'phone' },
    { label: 'Email', key: 'email' },
    { label: 'National ID', key: 'nationalId' },
  ],
  leases: [
    { label: 'Tenant ID', key: 'tenantId' },
    { label: 'Unit ID', key: 'unitId' },
    { label: 'Start date', key: 'startDate', type: 'date' },
    { label: 'End date', key: 'endDate', type: 'date' },
    { label: 'Monthly rent (KSh)', key: 'rent', type: 'number' },
  ],
  payments: [
    { label: 'Tenant ID', key: 'tenantId' },
    { label: 'Unit ID', key: 'unitId' },
    { label: 'Amount (KSh)', key: 'amount', type: 'number' },
    { label: 'Payment date', key: 'date', type: 'date' },
    { label: 'Method', key: 'method' },
  ],
  expenses: [
    { label: 'Property ID', key: 'propertyId' },
    { label: 'Description', key: 'description' },
    { label: 'Amount (KSh)', key: 'amount', type: 'number' },
    { label: 'Date', key: 'date', type: 'date' },
    { label: 'Category', key: 'category' },
  ],
  maintenance: [
    { label: 'Unit ID', key: 'unitId' },
    { label: 'Issue', key: 'issue' },
    { label: 'Priority', key: 'priority' },
    { label: 'Status', key: 'status' },
    { label: 'Cost (KSh)', key: 'cost', type: 'number' },
  ],
};

function money(v: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(v || 0);
}
function titleFor(k: string) {
  return k.charAt(0).toUpperCase() + k.slice(1);
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState('dashboard');
  const [rows, setRows] = useState<Record<Resource, Row[]>>({
    properties: [],
    units: [],
    tenants: [],
    leases: [],
    payments: [],
    expenses: [],
    maintenance: [],
  });
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [modal, setModal] = useState<Resource | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    auth.getUser().then(u => {
      setUser(u);
      if (u) loadAll();
      else setLoading(false);
    });
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const resources = Object.keys(fields) as Resource[];
      const results = await Promise.all(
        resources.map(r => api.get('/api/' + r))
      );
      const next: any = {};
      resources.forEach((r, i) => (next[r] = results[i].data.items || []));
      setRows(next);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }
  async function signIn() {
    try {
      const result = await auth.signIn();
      setUser(result.user);
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  }
  async function save(resource: Resource, data: Record<string, any>) {
    const required = fields[resource][0]?.key;
    if (required && !String(data[required] ?? '').trim()) {
      alert(fields[resource][0].label + ' is required.');
      return;
    }
    try {
      if (editing) await api.put('/api/' + resource + '/' + editing.id, data);
      else await api.post('/api/' + resource, data);
      setModal(null);
      setEditing(null);
      await loadAll();
    } catch (e) {
      alert('Could not save this record. Please try again.');
    }
  }
  async function remove(resource: Resource, id: string) {
    if (!confirm('Delete this record? This action cannot be undone.')) return;
    try {
      await api.delete('/api/' + resource + '/' + id);
      await loadAll();
    } catch (e) {
      alert('Could not delete this record.');
    }
  }

  if (!user)
    return (
      <div className="login">
        <div className="login-card">
          <div className="brand-mark">
            <Building2 size={28} />
          </div>
          <p className="eyebrow">RENTAL OPERATIONS</p>
          <h1>RentFlow Manager</h1>
          <p className="muted">
            Manage properties, tenants, rent, expenses and maintenance in one
            secure workspace.
          </p>
          <button className="primary wide" onClick={signIn}>
            Sign in to continue
          </button>
          <p className="small">Your records are private to your account.</p>
        </div>
      </div>
    );

  const activeResource = page as Resource;
  const list = (rows[activeResource] || []).filter(r =>
    JSON.stringify(r).toLowerCase().includes(query.toLowerCase())
  );
  const totals = {
    properties: rows.properties.length,
    units: rows.units.length,
    tenants: rows.tenants.length,
    collected: rows.payments.reduce((s, r) => s + Number(r.amount || 0), 0),
    expenses: rows.expenses.reduce((s, r) => s + Number(r.amount || 0), 0),
    openMaintenance: rows.maintenance.filter(r => r.status !== 'Completed')
      .length,
  };

  return (
    <div className="shell">
      <aside className={mobile ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark">
            <Building2 size={21} />
          </div>
          <div>
            <strong>RentFlow</strong>
            <span>Manager</span>
          </div>
          <button className="icon-btn close" onClick={() => setMobile(false)}>
            <X size={19} />
          </button>
        </div>
        <div className="nav-section">
          <span className="nav-label">WORKSPACE</span>
          {nav.map(n => {
            const I = n.icon;
            return (
              <button
                key={n.key}
                className={page === n.key ? 'nav-item active' : 'nav-item'}
                onClick={() => {
                  setPage(n.key);
                  setMobile(false);
                  setQuery('');
                }}
              >
                <I size={18} />
                <span>{n.label}</span>
              </button>
            );
          })}
        </div>
        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="avatar">
              {(user.name || user.email || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <b>{user.name || 'Property manager'}</b>
              <span>{user.email || ''}</span>
            </div>
          </div>
          <button
            className="nav-item"
            onClick={() => auth.signOut().then(() => setUser(null))}
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button
            className="icon-btn mobile-menu"
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>
          <div>
            <p className="eyebrow">RENTAL MANAGEMENT</p>
            <h2>{page === 'dashboard' ? 'Good evening' : titleFor(page)}</h2>
          </div>
          <div className="top-actions">
            <button className="icon-btn">
              <Bell size={19} />
            </button>
            <div className="avatar">
              {(user.name || user.email || 'U').slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        {page === 'dashboard' ? (
          <Dashboard totals={totals} rows={rows} onNavigate={setPage} />
        ) : (
          <section className="content">
            <div className="section-head">
              <div>
                <h1>{titleFor(page)}</h1>
                <p className="muted">
                  Keep your {page} records accurate and up to date.
                </p>
              </div>
              <button
                className="primary"
                onClick={() => {
                  setEditing(null);
                  setModal(activeResource);
                }}
              >
                <Plus size={17} /> Add {page.slice(0, -1) || page}
              </button>
            </div>
            <div className="toolbar">
              <div className="search">
                <Search size={17} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={'Search ' + page + '...'}
                />
              </div>
              <span className="result-count">{list.length} records</span>
            </div>
            <div className="table-card">
              {loading ? (
                <div className="empty">
                  <Clock3 size={28} />
                  <p>Loading records…</p>
                </div>
              ) : list.length === 0 ? (
                <div className="empty">
                  <AlertCircle size={28} />
                  <h3>No {page} yet</h3>
                  <p>Add your first record to get started.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        {fields[activeResource].map(f => (
                          <th key={f.key}>{f.label}</th>
                        ))}
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map(r => (
                        <tr key={r.id}>
                          {fields[activeResource].map(f => (
                            <td key={f.key}>
                              {f.key === 'amount' ||
                              f.key === 'rent' ||
                              f.key === 'cost'
                                ? money(Number(r[f.key]))
                                : r[f.key] || '—'}
                            </td>
                          ))}
                          <td>
                            <div className="row-actions">
                              <button
                                className="icon-btn"
                                onClick={() => {
                                  setEditing(r);
                                  setModal(activeResource);
                                }}
                              >
                                <MoreHorizontal size={18} />
                              </button>
                              <button
                                className="text-danger"
                                onClick={() => remove(activeResource, r.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      {modal && (
        <Modal
          resource={modal}
          editing={editing}
          onClose={() => {
            setModal(null);
            setEditing(null);
          }}
          onSave={save}
        />
      )}
    </div>
  );
}

function Dashboard({
  totals,
  rows,
  onNavigate,
}: {
  totals: any;
  rows: any;
  onNavigate: (p: string) => void;
}) {
  const recent = [...rows.payments]
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, 5);
  return (
    <section className="content">
      <div className="hero">
        <div>
          <p className="eyebrow light">PORTFOLIO OVERVIEW</p>
          <h1>Your properties, under control.</h1>
          <p>
            Track occupancy, collections, expenses and maintenance from one
            place.
          </p>
        </div>
        <button className="hero-btn" onClick={() => onNavigate('properties')}>
          <Plus size={17} /> Add property
        </button>
      </div>
      <div className="stats">
        <Stat label="Properties" value={totals.properties} icon={Building2} />
        <Stat label="Units" value={totals.units} icon={Home} />
        <Stat label="Tenants" value={totals.tenants} icon={Users} />
        <Stat
          label="Rent collected"
          value={money(totals.collected)}
          icon={WalletCards}
        />
      </div>
      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Recent payments</h3>
              <p>Latest rent collections</p>
            </div>
            <button className="link-btn" onClick={() => onNavigate('payments')}>
              View all <ArrowUpRight size={15} />
            </button>
          </div>
          {recent.length ? (
            <div className="activity">
              {recent.map((r: Row) => (
                <div className="activity-row" key={r.id}>
                  <div className="mini-icon">
                    <WalletCards size={16} />
                  </div>
                  <div className="activity-main">
                    <b>Rent payment</b>
                    <span>
                      {r.date || 'No date'} · {r.method || 'Payment'}
                    </span>
                  </div>
                  <strong>{money(Number(r.amount))}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptySmall text="No rent payments recorded yet." />
          )}
        </div>
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Maintenance</h3>
              <p>Open work orders</p>
            </div>
            <button
              className="link-btn"
              onClick={() => onNavigate('maintenance')}
            >
              Manage <ArrowUpRight size={15} />
            </button>
          </div>
          {rows.maintenance
            .filter((r: Row) => r.status !== 'Completed')
            .slice(0, 5)
            .map((r: Row) => (
              <div className="issue" key={r.id}>
                <div>
                  <b>{r.issue}</b>
                  <span>
                    {r.priority || 'Normal'} priority · {r.status || 'Open'}
                  </span>
                </div>
                <div
                  className={
                    'pill ' + (r.status === 'In Progress' ? 'blue' : 'amber')
                  }
                >
                  {r.status || 'Open'}
                </div>
              </div>
            ))}
          {totals.openMaintenance === 0 && (
            <EmptySmall text="No open maintenance requests." />
          )}
        </div>
      </div>
      <div className="panel quick">
        <div>
          <h3>Portfolio health</h3>
          <p>Financial snapshot from your records</p>
        </div>
        <div className="health">
          <div>
            <span>Rent collected</span>
            <b>{money(totals.collected)}</b>
          </div>
          <div>
            <span>Expenses</span>
            <b>{money(totals.expenses)}</b>
          </div>
          <div>
            <span>Net cash flow</span>
            <b>{money(totals.collected - totals.expenses)}</b>
          </div>
        </div>
      </div>
    </section>
  );
}
function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: any;
  icon: any;
}) {
  return (
    <div className="stat">
      <div className="stat-icon">
        <Icon size={18} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
function EmptySmall({ text }: { text: string }) {
  return (
    <div className="empty-small">
      <CheckCircle2 size={18} />
      <span>{text}</span>
    </div>
  );
}

function Modal({
  resource,
  editing,
  onClose,
  onSave,
}: {
  resource: Resource;
  editing: Row | null;
  onClose: () => void;
  onSave: (r: Resource, d: any) => Promise<void>;
}) {
  const [form, setForm] = useState<Record<string, any>>(editing || {});
  const fs = fields[resource];
  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">{editing ? 'EDIT' : 'NEW RECORD'}</p>
            <h2>
              {editing ? 'Update' : 'Add'} {resource.slice(0, -1) || resource}
            </h2>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="form-grid">
          {fs.map(f => (
            <label key={f.key}>
              {f.label}
              <input
                type={f.type || 'text'}
                value={form[f.key] ?? ''}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
              />
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" onClick={() => onSave(resource, form)}>
            Save record
          </button>
        </div>
      </div>
    </div>
  );
}
export default App;
