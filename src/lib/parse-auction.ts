import type { Auction, AuctionStatus, ShippingStatus } from "@/lib/database.types";

export function parseAuctionRow(row: Record<string, unknown>): Auction {
  const itemDetails = row.item_details;
  const shippingStatus = row.shipping_status as string | null | undefined;

  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    seller_wallet: row.seller_wallet as string,
    current_bid: Number(row.current_bid),
    start_price: Number(row.start_price),
    end_time: row.end_time as string,
    status: row.status as AuctionStatus,
    category: (row.category as string | null) ?? null,
    condition: (row.condition as string | null) ?? null,
    additional_images: Array.isArray(row.additional_images)
      ? (row.additional_images as string[])
      : [],
    item_details:
      itemDetails && typeof itemDetails === "object" && !Array.isArray(itemDetails)
        ? (itemDetails as Record<string, string>)
        : {},
    created_at: row.created_at as string,
    is_featured: Boolean(row.is_featured),
    reference_number: (row.reference_number as string | null) ?? null,
    tracking_courier: (row.tracking_courier as string | null) ?? null,
    tracking_number: (row.tracking_number as string | null) ?? null,
    tracking_uploaded_at: (row.tracking_uploaded_at as string | null) ?? null,
    shipping_status: (shippingStatus === "shipped" ||
    shippingStatus === "delivered"
      ? shippingStatus
      : "pending") as ShippingStatus,
  };
}
