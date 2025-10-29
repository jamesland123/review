export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Location = {
  id: string;
  place_id: string;
  telegram_chat_id: string;
  name: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  location_id: string;
  review_id: string;
  reviewer_name: string;
  reviewer_profile_image: string | null;
  rating: number;
  review_text: string | null;
  review_date: string;
  response_text: string | null;
  response_date: string | null;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      locations: {
        Row: Location;
        Insert: {
          id?: string;
          place_id: string;
          telegram_chat_id: string;
          name: string;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          place_id?: string;
          telegram_chat_id?: string;
          name?: string;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: Review;
        Insert: {
          id?: string;
          location_id: string;
          review_id: string;
          reviewer_name: string;
          reviewer_profile_image?: string | null;
          rating: number;
          review_text?: string | null;
          review_date: string;
          response_text?: string | null;
          response_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          review_id?: string;
          reviewer_name?: string;
          reviewer_profile_image?: string | null;
          rating?: number;
          review_text?: string | null;
          review_date?: string;
          response_text?: string | null;
          response_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
