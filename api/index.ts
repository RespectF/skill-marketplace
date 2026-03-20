// Simplest possible test - verify Vercel can invoke this function
export default function handler(req: any, res: any) {
  res.json({
    message: "API is working",
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    query: req.query,
    headers: req.headers
  });
}
