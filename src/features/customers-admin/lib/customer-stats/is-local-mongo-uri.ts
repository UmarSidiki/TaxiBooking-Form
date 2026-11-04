const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function hostFromAuthority(authority: string): string {
  const hostPort = authority.slice(authority.lastIndexOf("@") + 1);
  if (hostPort.startsWith("[")) {
    const end = hostPort.indexOf("]");
    return end === -1 ? hostPort : hostPort.slice(0, end + 1);
  }
  const colon = hostPort.lastIndexOf(":");
  return colon === -1 ? hostPort : hostPort.slice(0, colon);
}

/**
 * Backfill safety gate: only a plain local mongodb:// URI is accepted.
 * mongodb+srv, remote hosts, and missing URIs are refused outright.
 */
export function isLocalMongoUri(uri: string | null | undefined): boolean {
  const trimmed = (uri ?? "").trim().toLowerCase();
  if (!trimmed.startsWith("mongodb://")) return false;
  const rest = trimmed.slice("mongodb://".length);
  const authority = rest.split("/")[0] ?? "";
  return LOCAL_HOSTS.has(hostFromAuthority(authority));
}
