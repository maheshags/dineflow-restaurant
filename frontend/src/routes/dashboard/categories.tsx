import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Category } from '@/lib/types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import categoriesService from '@/services/categories';

export const Route = createFileRoute('/dashboard/categories')({
  component: CategoriesPage,
});

function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await categoriesService.getCategories();
        setCats(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch categories';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSave = async (cat: Category) => {
    try {
      setIsSaving(true);
      if (editItem) {
        const updated = await categoriesService.updateCategory(editItem.id, cat);
        setCats(prev => prev.map(c => c.id === editItem.id ? updated : c));
        toast.success('Category updated');
      } else {
        const added = await categoriesService.addCategory(cat);
        setCats(prev => [...prev, added]);
        toast.success('Category added');
      }
      setShowForm(false);
      setEditItem(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save category';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await categoriesService.deleteCategory(deleteId);
      setCats(prev => prev.filter(c => c.id !== deleteId));
      setDeleteId(null);
      toast.success('Category deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete category';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <TopNavbar title="Categories" subtitle={`${cats.length} categories`} />
      <div className="p-6">
        <div className="flex justify-end mb-6">
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">Loading categories...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-destructive font-medium">Error: {error}</p>
          </div>
        )}

        {!loading && cats.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No categories yet. Create one to get started.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map(cat => (
            <div key={cat.id} className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <CategoryIcon image={cat.image} name={cat.name} />
                  <div>
                    <h3 className="font-semibold text-foreground">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                </div>
                <StatusBadge status={cat.active ? 'active' : 'inactive'} />
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">{cat.itemCount} items</span>
                <div className="flex gap-1">
                  <button onClick={() => { setEditItem(cat); setShowForm(true); }} className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(cat.id)} className="w-7 h-7 rounded-md hover:bg-destructive/10 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} title={editItem ? 'Edit Category' : 'Add Category'}>
        <CategoryForm item={editItem} onSave={handleSave} onCancel={() => { setShowForm(false); setEditItem(null); }} isSaving={isSaving} />
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Category" message="Are you sure? All items in this category may need reassignment." isLoading={isDeleting} />
    </>
  );
}

function CategoryForm({ item, onSave, onCancel, isSaving }: { item: Category | null; onSave: (c: Category) => void; onCancel: () => void; isSaving: boolean }) {
  const [form, setForm] = useState<Partial<Category>>(item || { name: '', description: '', image: '📦', active: true, itemCount: 0 });
  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form as Category); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input value={form.name || ''} onChange={e => update('name', e.target.value)} required disabled={isSaving} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea value={form.description || ''} onChange={e => update('description', e.target.value)} rows={2} disabled={isSaving} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none disabled:opacity-50" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Emoji/Icon or Image URL</label>
        <input value={form.image || ''} onChange={e => update('image', e.target.value)} disabled={isSaving} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50" />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.active ?? true} onChange={e => update('active', e.target.checked)} disabled={isSaving} className="w-4 h-4 rounded accent-primary disabled:opacity-50" />
        <span className="text-sm">Active</span>
      </label>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={isSaving} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={isSaving} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">{isSaving ? 'Saving...' : item ? 'Update' : 'Add'}</button>
      </div>
    </form>
  );
}

function CategoryIcon({ image, name }: { image?: string; name: string }) {
  const value = image?.trim();
  const isUrl = !!value && /^https?:\/\//i.test(value);

  if (isUrl) {
    return (
      <img
        src={value}
        alt={name}
        className="w-12 h-12 rounded-lg object-cover border border-border bg-muted shrink-0"
        loading="lazy"
      />
    );
  }

  return (
    <span className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-3xl shrink-0">
      {value || '📦'}
    </span>
  );
}
