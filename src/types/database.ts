export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ReviewRating = "again" | "hard" | "good" | "easy";
export type ReviewMode = "flashcard" | "en_to_zh" | "zh_to_en" | "mistake_review";

export type Database = {
  public: {
    Tables: {
      vocabulary: {
        Row: {
          id: string;
          word: string;
          normalized_word: string;
          part_of_speech: string | null;
          chinese_meaning: string;
          english_definition: string | null;
          example_sentence: string | null;
          synonyms: string[];
          antonyms: string[];
          memory_hint: string | null;
          difficulty_level: number;
          frequency_level: number;
          source_book_chapter: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          word: string;
          part_of_speech?: string | null;
          chinese_meaning: string;
          english_definition?: string | null;
          example_sentence?: string | null;
          synonyms?: string[];
          antonyms?: string[];
          memory_hint?: string | null;
          difficulty_level?: number;
          frequency_level?: number;
          source_book_chapter?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          word?: string;
          part_of_speech?: string | null;
          chinese_meaning?: string;
          english_definition?: string | null;
          example_sentence?: string | null;
          synonyms?: string[];
          antonyms?: string[];
          memory_hint?: string | null;
          difficulty_level?: number;
          frequency_level?: number;
          source_book_chapter?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          daily_new_words: number;
          daily_review_limit: number;
          dark_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          daily_new_words?: number;
          daily_review_limit?: number;
          dark_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          daily_new_words?: number;
          daily_review_limit?: number;
          dark_mode?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_progress: {
        Row: {
          user_id: string;
          word_id: string;
          familiarity_level: number;
          correct_count: number;
          wrong_count: number;
          last_reviewed_at: string | null;
          next_review_at: string;
          review_interval: number;
          is_starred: boolean;
          is_mastered: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          word_id: string;
          familiarity_level?: number;
          correct_count?: number;
          wrong_count?: number;
          last_reviewed_at?: string | null;
          next_review_at?: string;
          review_interval?: number;
          is_starred?: boolean;
          is_mastered?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          familiarity_level?: number;
          correct_count?: number;
          wrong_count?: number;
          last_reviewed_at?: string | null;
          next_review_at?: string;
          review_interval?: number;
          is_starred?: boolean;
          is_mastered?: boolean;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_progress_word_id_fkey";
            columns: ["word_id"];
            isOneToOne: false;
            referencedRelation: "vocabulary";
            referencedColumns: ["id"];
          }
        ];
      };
      review_logs: {
        Row: {
          id: string;
          user_id: string;
          word_id: string;
          review_time: string;
          review_mode: ReviewMode;
          answer_result: ReviewRating;
          response_time: number | null;
          confidence_level: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          word_id: string;
          review_time?: string;
          review_mode?: ReviewMode;
          answer_result: ReviewRating;
          response_time?: number | null;
          confidence_level?: number | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "review_logs_word_id_fkey";
            columns: ["word_id"];
            isOneToOne: false;
            referencedRelation: "vocabulary";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      v_due_reviews: {
        Row: {
          user_id: string;
          word_id: string;
          word: string;
          part_of_speech: string | null;
          chinese_meaning: string;
          english_definition: string | null;
          example_sentence: string | null;
          synonyms: string[];
          antonyms: string[];
          memory_hint: string | null;
          difficulty_level: number;
          frequency_level: number;
          source_book_chapter: string | null;
          familiarity_level: number;
          correct_count: number;
          wrong_count: number;
          last_reviewed_at: string | null;
          next_review_at: string;
          review_interval: number;
          is_starred: boolean;
          is_mastered: boolean;
          notes: string | null;
        };
        Relationships: [];
      };
    };
    Enums: {
      review_rating: ReviewRating;
      review_mode: ReviewMode;
    };
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
