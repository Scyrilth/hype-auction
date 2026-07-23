export type AuctionStatus =
  | "draft"
  | "live"
  | "ended"
  | "cancelled"
  | "completed";

export type ShippingStatus = "pending" | "shipped" | "delivered";

export type EscrowState =
  | "none"
  | "pending"
  | "funded"
  | "shipped"
  | "released"
  | "complete"
  | "disputed"
  | "refunded"
  | "cancelled"
  | "expired";

export type ListingType = "auction" | "auction_buy_now" | "fixed_price";

export type PurchaseType = "auction" | "buy_now";

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
  country: string | null;
  ships_internationally: boolean;
  age_confirmed_at: string | null;
  tos_accepted_at: string | null;
  tos_version: string | null;
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
  is_featured: boolean;
  reference_number: string | null;
  tracking_courier: string | null;
  tracking_number: string | null;
  tracking_uploaded_at: string | null;
  shipping_status: ShippingStatus;
  escrow_pda: string | null;
  escrow_tx_signature: string | null;
  escrow_funded: boolean;
  escrow_funded_at: string | null;
  escrow_amount_lamports: number | null;
  escrow_attempt_number: number;
  escrow_state: EscrowState;
  escrow_expired_at: string | null;
  sol_usd_rate_at_payment: number | null;
  payment_completed_at: string | null;
  domestic_shipping_usd: number;
  international_shipping_usd: number;
  is_dummy: boolean;
  next_bidder_offered_at: string | null;
  next_bidder_response_deadline: string | null;
  next_bidder_wallet: string | null;
  relisted_auction_id: string | null;
  payment_excluded_wallets: string[];
  ended_early: boolean;
  early_end_reason: string | null;
  early_end_at: string | null;
  early_end_by: string | null;
  winner_wallet: string | null;
  buy_now_price: number | null;
  purchase_type: PurchaseType;
  listing_type: ListingType;
  good_till_cancelled: boolean;
  ship_reminder_sent: boolean;
  shipment_group_id: string | null;
}

export interface ShipmentGroup {
  id: string;
  bundle_reference: string;
  seller_wallet: string;
  buyer_wallet: string;
  tracking_courier: string | null;
  tracking_number: string | null;
  created_at: string;
  refund_sent_at: string | null;
  refund_nudge_dismissed_at: string | null;
  refund_tx_signature: string | null;
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
  tags: string[] | null;
  seller_reply: string | null;
  seller_reply_at: string | null;
  is_flagged: boolean;
  is_dummy: boolean;
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

export interface ShippingProfile {
  id: string;
  seller_wallet: string;
  name: string;
  category: string;
  domestic_shipping_usd: number;
  international_shipping_usd: number;
  ships_internationally: boolean;
  created_at: string;
}

export interface ShippingProfileInput {
  name: string;
  category: string;
  domestic_shipping_usd: number;
  international_shipping_usd: number;
  ships_internationally: boolean;
}

export type VendorProfile = User;

export interface VendorShopStats {
  total_sales: number;
  total_volume: number;
  followers_count: number;
  average_rating: number;
  review_count: number;
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
      shipping_profiles: {
        Row: ShippingProfile;
        Insert: Omit<ShippingProfile, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ShippingProfile, "id" | "created_at" | "seller_wallet">>;
        Relationships: [];
      };
      shipment_groups: {
        Row: ShipmentGroup;
        Insert: Omit<ShipmentGroup, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ShipmentGroup, "id" | "created_at" | "seller_wallet">>;
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
