import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { FilterBar, SelectFilter } from '@/components/shared/FilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { FoodItem, Category } from '@/lib/types';
import { Plus, Edit, Trash2, Grid, List, Star, Loader } from 'lucide-react';
import { toast } from 'sonner';
import foodsService from '@/services/foods';
import categoriesService from '@/services/categories';

export const Route = createFileRoute('/dashboard/menu')({
  component: MenuPage,
});

function MenuPage() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [availFilter, setAvailFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [editItem, setEditItem] = useState<FoodItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch foods and categories on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [foodsData, categoriesData] = await Promise.all([
        foodsService.getFoods(),
        categoriesService.getCategories(),
      ]);
      setFoods(foodsData);
      setCategories(categoriesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Error fetching data:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filtered = foods.filter(f => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && f.category !== catFilter) return false;
    if (availFilter === 'available' && !f.availability) return false;
    if (availFilter === 'unavailable' && f.availability) return false;
    return true;
  });

  const handleSave = async (item: FoodItem) => {
    setIsSubmitting(true);
    try {
      if (editItem) {
        // Update existing item
        const updated = await foodsService.updateFood(editItem.id, item);
        setFoods(prev => prev.map(f => f.id === updated.id ? updated : f));
        toast.success('Food item updated');
      } else {
        // Add new item
        const newFood = await foodsService.addFood(item);
        setFoods(prev => [...prev, newFood]);
        toast.success('Food item added');
      }
      setShowForm(false);
      setEditItem(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save food';
      toast.error(errorMessage);
      console.error('Error saving food:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await foodsService.deleteFood(deleteId);
      setFoods(prev => prev.filter(f => f.id !== deleteId));
      toast.success('Food item deleted');
      setDeleteId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete food';
      toast.error(errorMessage);
      console.error('Error deleting food:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <TopNavbar title="Menu Management" subtitle={`${filtered.length} items`} />
      <div className="p-6">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-between">
            <span className="text-sm text-destructive">{error}</span>
            <button onClick={fetchData} className="text-sm font-medium text-destructive hover:underline">
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading menu items...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
          <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search menu items...">
            <SelectFilter 
              value={catFilter} 
              onChange={setCatFilter} 
              placeholder="All Categories" 
              options={categories.map(c => ({ 
                value: c.name, 
                label: c.name 
              }))} 
            />
            <SelectFilter value={availFilter} onChange={setAvailFilter} placeholder="All Status" options={[{ value: 'available', label: 'Available' }, { value: 'unavailable', label: 'Unavailable' }]} />
          </FilterBar>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex border border-input rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`w-9 h-9 flex items-center justify-center ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-accent'} transition-colors`}>
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('table')} className={`w-9 h-9 flex items-center justify-center ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-accent'} transition-colors`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => { setEditItem(null); setShowForm(true); }} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(food => (
              <div key={food.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                <div className="relative h-40 overflow-hidden">
                  <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {food.bestseller && (
                    <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" fill="currentColor" /> Bestseller
                    </span>
                  )}
                  {!food.availability && <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center"><span className="bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full">Unavailable</span></div>}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{food.name}</h3>
                      <p className="text-xs text-muted-foreground">{food.category}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">₹{food.price}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                      <span className="text-xs font-medium text-foreground">{food.rating}</span>
                      <span className="text-xs text-muted-foreground">· Stock: {food.stock}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditItem(food); setShowForm(true); }} className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center"><Edit className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => setDeleteId(food.id)} className="w-7 h-7 rounded-md hover:bg-destructive/10 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Image', 'Name', 'Category', 'Price', 'Stock', 'Rating', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(food => (
                  <tr key={food.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-2"><img src={food.image} alt={food.name} className="w-10 h-10 rounded-lg object-cover" /></td>
                    <td className="px-4 py-2 font-medium text-foreground">{food.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{food.category}</td>
                    <td className="px-4 py-2 font-semibold text-foreground">₹{food.price}</td>
                    <td className="px-4 py-2">{food.stock}</td>
                    <td className="px-4 py-2"><span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning fill-warning" />{food.rating}</span></td>
                    <td className="px-4 py-2"><StatusBadge status={food.availability ? 'active' : 'inactive'} /></td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditItem(food); setShowForm(true); }} className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(food.id)} className="w-7 h-7 rounded-md hover:bg-destructive/10 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} title={editItem ? 'Edit Food Item' : 'Add Food Item'} size="lg">
        <FoodForm item={editItem} categories={categories} isSubmitting={isSubmitting} onSave={handleSave} onCancel={() => { setShowForm(false); setEditItem(null); }} />
      </Modal>

      <ConfirmDialog open={!!deleteId} isLoading={isDeleting} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Food Item" message="Are you sure you want to delete this item? This action cannot be undone." />
    </>
  );
}

function FoodForm({ item, categories, isSubmitting, onSave, onCancel }: { item: FoodItem | null; categories: Category[]; isSubmitting: boolean; onSave: (f: FoodItem) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<FoodItem>>(item || {
    name: '', category: '', categoryId: '', description: '', price: 0, stock: 0, image: '', availability: true, bestseller: false, rating: 0, totalOrders: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form as FoodItem);
  };

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Name</label>
          <input value={form.name || ''} onChange={e => update('name', e.target.value)} required className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Category</label>
          <select value={form.category || ''} onChange={e => {
            const category = categories.find(c => c.name === e.target.value);
            setForm(prev => ({ ...prev, category: e.target.value, categoryId: category?.id || '' }));
          }} required className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
            <option value="">Select category</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Description</label>
        <textarea value={form.description || ''} onChange={e => update('description', e.target.value)} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Price (₹)</label>
          <input type="number" value={form.price || ''} onChange={e => update('price', Number(e.target.value))} required className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Stock</label>
          <input type="number" value={form.stock || ''} onChange={e => update('stock', Number(e.target.value))} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Image URL</label>
          <input value={form.image || ''} onChange={e => update('image', e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.availability ?? true} onChange={e => update('availability', e.target.checked)} className="w-4 h-4 rounded accent-primary" />
          <span className="text-sm">Available</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.bestseller ?? false} onChange={e => update('bestseller', e.target.checked)} className="w-4 h-4 rounded accent-primary" />
          <span className="text-sm">Bestseller</span>
        </label>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {isSubmitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              {item ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            `${item ? 'Update' : 'Add'} Item`
          )}
        </button>
      </div>
    </form>
  );
}
