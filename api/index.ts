import type { VercelRequest, VercelResponse } from "@vercel/node";

console.log("[API] Handler loaded");

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[API] Request:", req.url, req.method);
  res.status(200).json({
    success: true,
    message: "API is working",
    url: req.url,
    method: req.method
  });
}
