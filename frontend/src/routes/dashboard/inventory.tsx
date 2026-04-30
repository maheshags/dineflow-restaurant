import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { StatCard } from '@/components/shared/StatCard';
import { FilterBar, SelectFilter } from '@/components/shared/FilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { InventoryItem } from '@/lib/types';
import { Package, AlertTriangle, XCircle, Plus, Minus, Loader } from 'lucide-react';
import { toast } from 'sonner';
import inventoryService from '@/services/inventory';

export const Route = createFileRoute('/dashboard/inventory')({
  component: InventoryPage,
});

function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Fetch inventory on component mount
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getInventory();
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch inventory';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter(i => {
    if (search && !i.foodName.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && i.status !== statusFilter) return false;
    return true;
  });

  const updateStock = async (id: string, delta: number) => {
    try {
      setIsUpdating(id);
      const item = items.find(i => i.id === id);
      if (!item) return;
      
      const newStock = Math.max(0, item.currentStock + delta);
      const updated = await inventoryService.updateStock(id, newStock);
      
      setItems(prev => prev.map(i => i.id === id ? updated : i));
      toast.success('Stock updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update stock';
      toast.error(message);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <>
      <TopNavbar title="Inventory" subtitle="Manage stock levels" />
      <div className="p-6 space-y-6">
        {/* Error State */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-between">
            <span className="text-sm text-destructive">{error}</span>
            <button onClick={fetchInventory} className="text-sm font-medium text-destructive hover:underline">
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading inventory...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Items" value={items.length} icon={Package} />
              <StatCard title="Low Stock" value={items.filter(i => i.status === 'low-stock').length} icon={AlertTriangle} variant="warning" />
              <StatCard title="Out of Stock" value={items.filter(i => i.status === 'out-of-stock').length} icon={XCircle} variant="destructive" />
            </div>

        <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search inventory...">
          <SelectFilter value={statusFilter} onChange={setStatusFilter} placeholder="All Status" options={[
            { value: 'in-stock', label: 'In Stock' }, { value: 'low-stock', label: 'Low Stock' }, { value: 'out-of-stock', label: 'Out of Stock' },
          ]} />
        </FilterBar>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Item', 'Category', 'Current Stock', 'Min Threshold', 'Status', 'Last Updated', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{item.foodName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{item.currentStock}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.minThreshold}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(item.lastUpdated).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateStock(item.id, -5)} disabled={isUpdating === item.id} className="w-7 h-7 rounded-md border border-input hover:bg-accent flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <button onClick={() => updateStock(item.id, 5)} disabled={isUpdating === item.id} className="w-7 h-7 rounded-md border border-input hover:bg-accent flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => updateStock(item.id, 50 - item.currentStock)} disabled={isUpdating === item.id} className="h-7 px-2 rounded-md border border-input hover:bg-accent text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        {isUpdating === item.id ? 'Updating...' : 'Restock'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          </>
        )}
      </div>
    </>
  );
}
