import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { FilterBar, SelectFilter } from '@/components/shared/FilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Modal } from '@/components/shared/Modal';
import { Bike, Mail, Phone, Plus, Star, Trash2, Pencil, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { DeliveryPerson, Order } from '@/lib/types';
import deliveryTeamService from '@/services/delivery-team';
import ordersService from '@/services/orders';

export const Route = createFileRoute('/dashboard/delivery')({
    component: DeliveryTeamPage,
});

const blank = {
    name: '', email: '', phone: '', password: '', vehicle: '',
    status: 'active' as 'active' | 'inactive',
};

function DeliveryTeamPage() {
    const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<DeliveryPerson | null>(null);
    const [form, setForm] = useState(blank);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [teamData, ordersData] = await Promise.all([
                deliveryTeamService.getDeliveryPersons(),
                ordersService.getAdminOrders(),
            ]);
            setDeliveryPersons(teamData);
            setOrders(ordersData);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to load delivery team');
        }
    };

    const filtered = deliveryPersons.filter(d => {
        if (statusFilter && d.status !== statusFilter) return false;
        if (search) {
            const s = search.toLowerCase();
            return d.name.toLowerCase().includes(s) || d.phone.includes(s) || d.email.toLowerCase().includes(s);
        }
        return true;
    });

    const active = deliveryPersons.filter(d => d.status === 'active');

    const activeAssignments = (id: string) =>
        orders.filter(o => o.deliveryPersonId === id && !['delivered', 'completed', 'cancelled'].includes(o.orderStatus)).length;

    const openAdd = () => { setEditing(null); setForm(blank); setOpen(true); };
    const openEdit = (d: DeliveryPerson) => {
        setEditing(d);
        setForm({ name: d.name, email: d.email, phone: d.phone, password: d.password, vehicle: d.vehicle, status: d.status });
        setOpen(true);
    };

    const submit = async () => {
        if (!form.name || !form.email || !form.phone || (!editing && !form.password)) {
            toast.error('Name, email, phone and password are required');
            return;
        }
        try {
            if (editing) {
                const updated = await deliveryTeamService.updateDeliveryPerson(editing.id, form);
                setDeliveryPersons(prev => prev.map(d => d.id === editing.id ? updated : d));
                toast.success('Delivery person updated');
            } else {
                const added = await deliveryTeamService.addDeliveryPerson(form);
                setDeliveryPersons(prev => [added, ...prev]);
                toast.success('Delivery person added');
            }
            setOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save delivery person');
        }
    };

    const remove = async (d: DeliveryPerson) => {
        if (activeAssignments(d.id) > 0) {
            toast.error('Cannot remove — has active orders assigned');
            return;
        }
        try {
            await deliveryTeamService.deleteDeliveryPerson(d.id);
            setDeliveryPersons(prev => prev.filter(person => person.id !== d.id));
            toast.success('Removed');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to remove delivery person');
        }
    };

    return (
        <>
            <TopNavbar title="Delivery Team" subtitle={`${deliveryPersons.length} members · ${active.length} active`} />
            <div className="p-6 space-y-6">
                {/* Header / KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KpiCard label="Total Members" value={deliveryPersons.length} icon={<Bike className="w-5 h-5" />} tone="default" />
                    <KpiCard label="Active" value={active.length} icon={<ShieldCheck className="w-5 h-5" />} tone="success" />
                    <KpiCard label="On Delivery"
                        value={orders.filter(o => o.orderStatus === 'out-for-delivery').length}
                        icon={<Bike className="w-5 h-5" />} tone="warning" />
                    <KpiCard label="Delivered Today"
                        value={orders.filter(o => o.orderStatus === 'delivered' || o.orderStatus === 'completed').length}
                        icon={<ShieldCheck className="w-5 h-5" />} tone="info" />
                </div>

                {/* Add / Filter */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by name, phone, email...">
                        <SelectFilter
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="All Status"
                            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
                        />
                    </FilterBar>
                    <button
                        onClick={openAdd}
                        className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow"
                    >
                        <Plus className="w-4 h-4" /> Add Delivery Person
                    </button>
                </div>

                {/* All members table */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                        <h2 className="font-display font-bold text-foreground">All Delivery Persons</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    {['Person', 'Contact', 'Vehicle', 'Active Orders', 'Deliveries', 'Rating', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(d => (
                                    <tr key={d.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
                                                    {d.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{d.name}</p>
                                                    <p className="text-xs text-muted-foreground">Joined {new Date(d.joinedDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {d.phone}</div>
                                            <div className="flex items-center gap-1.5 text-xs"><Mail className="w-3 h-3" /> {d.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{d.vehicle}</td>
                                        <td className="px-4 py-3 font-semibold text-foreground">{activeAssignments(d.id)}</td>
                                        <td className="px-4 py-3 text-foreground">{d.totalDeliveries}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1 text-warning"><Star className="w-3.5 h-3.5 fill-warning" /> {d.rating.toFixed(1)}</span>
                                        </td>
                                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openEdit(d)} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors">
                                                    <Pencil className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                                <button onClick={() => remove(d)} className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors">
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">No delivery persons found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Active list */}
                <div className="bg-card rounded-xl border border-border shadow-sm">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-success" />
                        <h2 className="font-display font-bold text-foreground">Active Delivery Persons</h2>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {active.map(d => (
                            <div key={d.id} className="rounded-xl border border-border p-4 hover:border-primary/40 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-lg">
                                        {d.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-foreground truncate">{d.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{d.vehicle}</p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-warning text-sm"><Star className="w-3.5 h-3.5 fill-warning" /> {d.rating.toFixed(1)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="rounded-lg bg-muted/40 px-2 py-2">
                                        <p className="text-muted-foreground">Active</p>
                                        <p className="font-semibold text-foreground">{activeAssignments(d.id)}</p>
                                    </div>
                                    <div className="rounded-lg bg-muted/40 px-2 py-2">
                                        <p className="text-muted-foreground">Total</p>
                                        <p className="font-semibold text-foreground">{d.totalDeliveries}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Phone className="w-3 h-3" /> {d.phone}
                                </div>
                            </div>
                        ))}
                        {active.length === 0 && (
                            <p className="col-span-full text-sm text-muted-foreground text-center py-6">No active delivery persons.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Add / Edit Modal */}
            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Delivery Person' : 'Add Delivery Person'} size="md">
                <div className="space-y-4">
                    <Field label="Full Name">
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Email">
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
                        </Field>
                        <Field label="Phone">
                            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
                        </Field>
                    </div>
                    <Field label="Password (used for delivery app login)">
                        <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
                    </Field>
                    <Field label="Vehicle">
                        <input value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })}
                            placeholder="Bike — KA01 AB 1234"
                            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
                    </Field>
                    <Field label="Status">
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </Field>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setOpen(false)} className="h-10 px-4 rounded-lg border border-input text-sm font-medium hover:bg-accent">Cancel</button>
                        <button onClick={submit} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                            {editing ? 'Save Changes' : 'Add Person'}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
            {children}
        </div>
    );
}

function KpiCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: 'default' | 'success' | 'warning' | 'info' }) {
    const map = {
        default: 'bg-primary/10 text-primary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        info: 'bg-info/10 text-info',
    };
    return (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${map[tone]}`}>{icon}</div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold text-foreground">{value}</p>
            </div>
        </div>
    );
}
