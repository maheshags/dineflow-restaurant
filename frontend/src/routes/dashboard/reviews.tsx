import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { StatCard } from '@/components/shared/StatCard';
import { FilterBar, SelectFilter } from '@/components/shared/FilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Review } from '@/lib/types';
import { Star, MessageSquare, AlertTriangle, Loader } from 'lucide-react';
import { toast } from 'sonner';
import reviewsService from '@/services/reviews';

export const Route = createFileRoute('/dashboard/reviews')({
  component: ReviewsPage,
});

function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [foodFilter, setFoodFilter] = useState('');

  // Fetch reviews on component mount
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reviewsService.getReviews();
      setReviews(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reviews';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = reviews.filter(r => {
    if (search && !r.customerName.toLowerCase().includes(search.toLowerCase()) && !r.text.toLowerCase().includes(search.toLowerCase())) return false;
    if (ratingFilter && r.rating !== Number(ratingFilter)) return false;
    if (foodFilter && r.foodName !== foodFilter) return false;
    return true;
  });

  const avgRating = reviewsService.calculateAverageRating(reviews);
  const lowRated = reviewsService.countLowRated(reviews);
  const foodNames = reviewsService.getUniqueFoodNames(reviews);

  return (
    <>
      <TopNavbar title="Ratings & Reviews" subtitle="Customer feedback" />
      <div className="p-6 space-y-6">
        {/* Error State */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-between">
            <span className="text-sm text-destructive">{error}</span>
            <button onClick={fetchReviews} className="text-sm font-medium text-destructive hover:underline">
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading reviews...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Average Rating" value={avgRating} icon={Star} variant="primary" />
              <StatCard title="Total Reviews" value={reviews.length} icon={MessageSquare} />
              <StatCard title="Low Rated" value={lowRated} icon={AlertTriangle} variant="destructive" />
            </div>

            <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search reviews...">
              <SelectFilter value={ratingFilter} onChange={setRatingFilter} placeholder="All Ratings" options={[1,2,3,4,5].map(r => ({ value: String(r), label: `${r} Star${r > 1 ? 's' : ''}` }))} />
              <SelectFilter value={foodFilter} onChange={setFoodFilter} placeholder="All Items" options={foodNames.map(n => ({ value: n, label: n }))} />
            </FilterBar>

            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No reviews match your filters</p>
                </div>
              ) : (
                filtered.map(review => (
                  <div key={review.id} className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {review.customerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{review.customerName}</p>
                          <p className="text-xs text-muted-foreground">{review.foodName} · {review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-warning fill-warning' : 'text-muted'}`} />
                          ))}
                        </div>
                        <StatusBadge status={review.status} />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{review.text}</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
