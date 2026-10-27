import "server-only";
import { headers } from "next/headers";

export interface RequestContext {
  ip: string | null;
  userAgent: string | null;
}

export async function getRequestContext(): Promise<RequestContext> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || headerList.get("x-real-ip");

  return {
    ip: ip && ip.length > 0 ? ip : null,
    userAgent: headerList.get("user-agent"),
  };
}
