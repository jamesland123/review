/*
  # Create locations and reviews tables for Google Reviews Management System

  1. New Tables
    - `locations`
      - `id` (uuid, primary key)
      - `place_id` (text, unique) - Google Place ID for the location
      - `telegram_chat_id` (text) - Telegram chat ID for notifications
      - `name` (text) - Location name
      - `user_id` (uuid, nullable) - Reference to auth.users for location user access
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `reviews`
      - `id` (uuid, primary key)
      - `location_id` (uuid, foreign key to locations)
      - `review_id` (text, unique) - External review identifier from Google
      - `reviewer_name` (text) - Name of the reviewer
      - `reviewer_profile_image` (text, nullable) - URL to reviewer profile image
      - `rating` (int) - Star rating (1-5)
      - `review_text` (text, nullable) - Review content
      - `review_date` (timestamptz) - Date the review was posted
      - `response_text` (text, nullable) - Business response to the review
      - `response_date` (timestamptz, nullable) - Date of business response
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Admin users can manage all locations (identified by checking if user has admin role in metadata)
    - Location users can only view their assigned location and its reviews
    - Public users have no access
*/

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text UNIQUE NOT NULL,
  telegram_chat_id text NOT NULL,
  name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  review_id text UNIQUE NOT NULL,
  reviewer_name text NOT NULL,
  reviewer_profile_image text,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  review_date timestamptz NOT NULL,
  response_text text,
  response_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_location_id ON reviews(location_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_review_date ON reviews(review_date DESC);
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Locations policies
-- Admin users (identified by app_metadata role = 'admin') can view all locations
CREATE POLICY "Admins can view all locations"
  ON locations FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Admin users can insert locations
CREATE POLICY "Admins can insert locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Admin users can update locations
CREATE POLICY "Admins can update locations"
  ON locations FOR UPDATE
  TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Admin users can delete locations
CREATE POLICY "Admins can delete locations"
  ON locations FOR DELETE
  TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Location users can view their own assigned location
CREATE POLICY "Location users can view their location"
  ON locations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Reviews policies
-- Admin users can view all reviews
CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Location users can view reviews for their assigned location
CREATE POLICY "Location users can view their reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = reviews.location_id
      AND locations.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
