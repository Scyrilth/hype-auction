export type AuctionStatus = "draft" | "live" | "ended" | "cancelled";

export interface User {
  wallet_address: string;
  username: string | null;
  avatar_url: string | null;
  reputation: number;
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
  created_at: string;
}

export interface Bid {
  id: string;
  auction_id: string;
  bidder_wallet: string;
  amount: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "reputation" | "created_at"> & {
          reputation?: number;
          created_at?: string;
        };
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
        Relationships: [
          {
            foreignKeyName: "auctions_seller_wallet_fkey";
            columns: ["seller_wallet"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["wallet_address"];
          },
        ];
      };
      bids: {
        Row: Bid;
        Insert: Omit<Bid, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Bid, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "bids_auction_id_fkey";
            columns: ["auction_id"];
            isOneToOne: false;
            referencedRelation: "auctions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bids_bidder_wallet_fkey";
            columns: ["bidder_wallet"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["wallet_address"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      auction_status: AuctionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
