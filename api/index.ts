import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    message: "API is working",
    path: req.path,
    method: req.method,
  });
}
