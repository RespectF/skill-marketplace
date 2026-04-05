// 移除 express 的 import，使用标准的 Request
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string | null) {
  if (!host) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  const url = new URL(req.url);
  if (url.protocol === "https:") return true;

  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (!forwardedProto) return false;

  const protoList = forwardedProto.split(",");
  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(req: Request) {
  const url = new URL(req.url);
  const isSecure = isSecureRequest(req);
  const isLocalhost = LOCAL_HOSTS.has(url.hostname) || isIpAddress(url.hostname);

  return {
    httpOnly: true,
    path: "/",
    sameSite: isLocalhost ? "lax" : "none",
    secure: isSecure,
  };
}