import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';

interface Location {
  id: number;
  name: string;
  address?: string;
}

interface Review {
  id: number;
  author_name: string;
  rating: number;
  text: string;
  review_date: string;
}

export default function LocationDashboard() {
  const user = useUser();
  const [location, setLocation] = useState<Location | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLocationAndReviews();
    }
  }, [user]);

  const fetchLocationAndReviews = async () => {
    if (!user) return;

    try {
      // 🔹 Step 1: Get the user's profile to find their assigned location_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('location_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile || !profile.location_id) {
        alert('No Location Assigned. Please contact your administrator.');
        return;
      }

      // 🔹 Step 2: Fetch the location data
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .eq('id', profile.location_id)
        .maybeSingle();

      if (locationError) throw locationError;

      if (!locationData) {
        alert('Could not find location in the database.');
        return;
      }

      setLocation(locationData);

      // 🔹 Step 3: Fetch the reviews for this location
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('location_id', locationData.id)
        .order('review_date', { asce_
