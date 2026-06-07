const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomSuffix(length = 6): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return result;
}

/** HA-[YEAR][MONTH]-[6 random uppercase alphanumeric chars], e.g. HA-202606-X7K2PQ */
export function generateReferenceNumber(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `HA-${year}${month}-${randomSuffix()}`;
}
