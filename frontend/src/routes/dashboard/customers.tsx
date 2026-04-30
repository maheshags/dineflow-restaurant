import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { FilterBar } from '@/components/shared/FilterBar';
import { Modal } from '@/components/shared/Modal';
import type { Customer } from '@/lib/types';
import { Eye, Users } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import customersService from '@/services/customers';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/customers')({
  component: CustomersPage,
});

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await customersService.getCustomers();
      setCustomers(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load customers');
    }
  };

  const filtered = customers.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <TopNavbar title="Customers" subtitle={`${filtered.length} customers`} />
      <div className="p-6">
        <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search customers..." />

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{c.totalOrders}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">₹{c.totalSpending.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.joinedDate}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(c)} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Customer Details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                {selected.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selected.name}</h3>
                <p className="text-sm text-muted-foreground">{selected.email} · {selected.phone}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Orders', value: selected.totalOrders },
                { label: 'Total Spent', value: `₹${selected.totalSpending.toLocaleString()}` },
                { label: 'Last Order', value: selected.lastOrderDate },
              ].map(stat => (
                <div key={stat.label} className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
            {selected.favoriteItems.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Favorite Items</p>
                <div className="flex flex-wrap gap-2">
                  {selected.favoriteItems.map(item => (
                    <span key={item} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{item}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
