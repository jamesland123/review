import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Location, Review } from '../lib/database.types';
import { Button } from '../components/ui/Button';
import { StarRating } from '../components/ui/StarRating';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Star, Search, LogOut, MessageSquare, Calendar } from 'lucide-react';

export function LocationDashboard() {
  const [location, setLocation] = useState<Location | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLocationAndReviews();
  }, [user]);

  useEffect(() => {
    filterReviews();
  }, [reviews, searchQuery, ratingFilter]);

  const fetchLocationAndReviews = async () => {
    if (!user) return;

    try {
      // 🟢 Try to match by user_id first, fallback to email if needed
      let { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (locationError) throw locationError;

      if (!locationData && user.email) {
        const { data: fallbackLocation, error: fallbackError } = await supabase
          .from('locations')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (fallbackError) throw fallbackError;
        locationData = fallbackLocation;
      }

      if (!locationData) {
        alert('No location assigned to your account. Please contact an administrator.');
        return;
      }

      setLocation(locationData);

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('location_id', (locationData as any).id)
        .order('review_date', { ascending: false });

      if (reviewsError) throw reviewsError;

      setReviews(reviewsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterReviews = () => {
    let filtered = [...reviews];

    if (searchQuery) {
      filtered = filtered.filter(
        (review) =>
          review.reviewer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          review.review_text?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (ratingFilter !== null) {
      filtered = filtered.filter((review) => review.rating === ratingFilter);
    }

    setFilteredReviews(filtered);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const calculateStats = () => {
    if (reviews.length === 0) return { average: 0, total: 0, distribution: {} };

    const total = reviews.length;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / total;

    const distribution = reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return { average, total, distribution };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Location Assigned</h2>
          <p className="text-gray-600 mb-4">Please contact your administrator to assign a location to your account.</p>
          <Button onClick={handleLogout}>Sign Out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Star className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
                <p className="text-sm text-gray-600">Review Dashboard</p>
              </div>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut size={18} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900">{stats.average.toFixed(1)}</p>
              </div>
              <Star className="text-yellow-400" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageSquare className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-3">Rating Distribution</p>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-3">{rating}</span>
                  <Star size={14} className="text-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          stats.total > 0 ? ((stats.distribution[rating] || 0) / stats.total) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">
                    {stats.distribution[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRatingFilter(null)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  ratingFilter === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setRatingFilter(rating)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    ratingFilter === rating
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {rating}★
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {reviews.length === 0 ? 'No reviews yet' : 'No matching reviews'}
            </h3>
            <p className="text-gray-600">
              {reviews.length === 0
                ? 'Reviews will appear here once they are synced from Google'
                : 'Try adjusting your search or filter criteria'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {review.reviewer_profile_image ? (
                    <img
                      src={review.reviewer_profile_image}
                      alt={review.reviewer_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-lg">
                        {review.reviewer_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {review.reviewer_name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <StarRating rating={review.rating} size={16} />
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(review.review_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {review.review_text && (
                      <p className="text-gray-700 mb-4 leading-relaxed">{review.review_text}</p>
                    )}

                    {review.response_text && (
                      <div className="bg-gray-50 border-l-4 border-blue-500 p-4 rounded">
                        <p className="text-sm font-medium text-gray-900 mb-1">Business Response</p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {review.response_text}
                        </p>
                        {review.response_date && (
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(review.response_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
