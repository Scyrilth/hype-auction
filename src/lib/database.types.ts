export type AuctionStatus = "draft" | "live" | "ended" | "cancelled";

export interface User {
  wallet_address: string;
  username: string | null;
  avatar_url: string | null;
  reputation: number;
  created_at: string;
  shop_name: string | null;
  banner_image: string | null;
  bio: string | null;
  shop_description: string | null;
  social_twitter: string | null;
  social_instagram: string | null;
  is_vendor: boolean;
  is_verified: boolean;
  followers_count: number;
  total_sales: number;
  total_volume: number;
  average_rating: number;
  show_copy_wallet: boolean;
  show_won_auctions: boolean;
}

export interface WatchlistEntry {
  id: string;
  wallet_address: string;
  auction_id: string;
  created_at: string;
}

export interface Auction {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  seller_wallet: string;
  current_bid: number;
  start_price: number;
  end_time: string;
  status: AuctionStatus;
  category: string | null;
  condition: string | null;
  additional_images: string[];
  item_details: Record<string, string>;
  created_at: string;
}

export interface Bid {
  id: string;
  auction_id: string;
  bidder_wallet: string;
  amount: number;
  created_at: string;
}

export interface Message {
  id: string;
  auction_id: string;
  wallet_address: string;
  username: string;
  content: string;
  created_at: string;
}

export interface Follow {
  follower_wallet: string;
  following_wallet: string;
  created_at: string;
}

export interface Review {
  id: string;
  vendor_wallet: string;
  reviewer_wallet: string;
  auction_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ShippingAddress {
  id: string;
  wallet_address: string;
  nickname: string;
  full_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
  used_for_auction_id: string | null;
  created_at: string;
}

export interface ShippingAddressInput {
  nickname: string;
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default?: boolean;
}

export type VendorProfile = User;

export interface VendorShopStats {
  total_sales: number;
  total_volume: number;
  followers_count: number;
  average_rating: number;
}

export interface ReviewWithReviewer extends Review {
  reviewer_username: string | null;
  reviewer_avatar: string | null;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<User> & { wallet_address: string };
        Update: Partial<Omit<User, "wallet_address">>;
        Relationships: [];
      };
      auctions: {
        Row: Auction;
        Insert: Omit<Auction, "id" | "current_bid" | "created_at"> & {
          id?: string;
          current_bid?: number;
          created_at?: string;
        };
        Update: Partial<Omit<Auction, "id" | "created_at">>;
        Relationships: [];
      };
      bids: {
        Row: Bid;
        Insert: Omit<Bid, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Bid, "id" | "created_at">>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Message, "id" | "created_at">>;
        Relationships: [];
      };
      follows: {
        Row: Follow;
        Insert: Omit<Follow, "created_at"> & { created_at?: string };
        Update: Partial<Omit<Follow, "follower_wallet" | "following_wallet">>;
        Relationships: [];
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Review, "id" | "created_at">>;
        Relationships: [];
      };
      shipping_addresses: {
        Row: ShippingAddress;
        Insert: Omit<ShippingAddress, "id" | "created_at" | "used_for_auction_id"> & {
          id?: string;
          created_at?: string;
          used_for_auction_id?: string | null;
        };
        Update: Partial<Omit<ShippingAddress, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      toggle_follow: {
        Args: { p_follower: string; p_following: string };
        Returns: boolean;
      };
      refresh_vendor_stats: {
        Args: { p_wallet: string };
        Returns: void;
      };
    };
    Enums: {
      auction_status: AuctionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
