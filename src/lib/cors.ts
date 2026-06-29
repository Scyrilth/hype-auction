export function corsHeaders(origin: string | null) {
  const allowed = [
    "https://www.hypeauction.com",
    "https://hypeauction.com",
    "http://localhost:3000",
  ];
  const isAllowed = origin && allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed
      ? origin
      : "https://www.hypeauction.com",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-wallet-address",
  };
}
