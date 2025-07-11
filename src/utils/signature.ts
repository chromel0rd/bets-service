import crypto from "crypto";

export function createSignature(body: any, secretKey: string): string {
  const payload = JSON.stringify(body || {});
  return crypto.createHmac("sha512", secretKey).update(payload).digest("hex");
}
