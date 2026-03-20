import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log("Test API called");
  res.status(200).json({ success: true, message: "Test works!" });
}
