/**
 * Utility functions for subdomain and host domain parsing across
 * localhost, Vercel deployments (*.vercel.app), multi-part TLDs (*.co.za, *.com.au),
 * and standard custom domains.
 */

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "admin",
  "app",
  "dashboard",
  "mail",
  "smtp",
  "ftp",
  "localhost",
  "subscribe",
  "login",
  "bookings",
  "estimate"
]);

const MULTI_PART_TLDS = [
  ".co.za",
  ".org.za",
  ".ac.za",
  ".net.za",
  ".gov.za",
  ".co.uk",
  ".org.uk",
  ".com.au",
  ".net.au",
  ".org.au",
  ".co.nz",
  ".com.br",
  ".co.in",
  ".com.ng"
];

const PLATFORM_DOMAINS = [
  ".vercel.app",
  ".vercel.dev",
  ".vercel.run",
  ".now.sh",
  ".amplifyapp.com",
  ".netlify.app",
  ".pages.dev",
  ".onrender.com",
  ".fly.dev",
  ".herokuapp.com"
];

/**
 * Extracts a tenant subdomain from the given hostname if one exists.
 * Returns null if the hostname is a root domain or reserved.
 */
export function getSubdomain(hostname: string | null | undefined): string | null {
  if (!hostname) return null;
  const host = hostname.toLowerCase().split(":")[0].trim();

  // Localhost cases: localhost, 127.0.0.1, [::1]
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") {
    return null;
  }
  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }

  // Cloud platform deployment domains (e.g., schoolofphilosophy.vercel.app is root, tenant.schoolofphilosophy.vercel.app has tenant)
  for (const plat of PLATFORM_DOMAINS) {
    if (host.endsWith(plat)) {
      const withoutPlat = host.slice(0, -plat.length); // e.g. "schoolofphilosophy" or "tenant.schoolofphilosophy"
      const parts = withoutPlat.split(".");
      if (parts.length > 1) {
        const sub = parts[0];
        if (!RESERVED_SUBDOMAINS.has(sub)) return sub;
      }
      return null;
    }
  }

  // Multi-part TLDs (e.g. schoolofphilosophy.co.za is root, tenant.schoolofphilosophy.co.za has tenant)
  for (const tld of MULTI_PART_TLDS) {
    if (host.endsWith(tld)) {
      const withoutTld = host.slice(0, -tld.length);
      const parts = withoutTld.split(".");
      if (parts.length > 1) {
        const sub = parts[0];
        if (!RESERVED_SUBDOMAINS.has(sub)) return sub;
      }
      return null;
    }
  }

  // Standard domains (e.g., schoolofphilosophy.com has 2 parts -> root, tenant.schoolofphilosophy.com has 3 parts -> tenant)
  const domainParts = host.split(".");
  if (domainParts.length > 2) {
    const sub = domainParts[0];
    if (!RESERVED_SUBDOMAINS.has(sub)) return sub;
  }

  return null;
}

/**
 * Returns the base root host (domain + port if applicable) for redirection purposes.
 */
export function getBaseHost(hostname: string | null | undefined): string {
  if (!hostname) return "";
  const host = hostname.toLowerCase().split(":")[0].trim();

  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) {
    return "localhost:3000";
  }

  for (const plat of PLATFORM_DOMAINS) {
    if (host.endsWith(plat)) {
      const withoutPlat = host.slice(0, -plat.length);
      const parts = withoutPlat.split(".");
      if (parts.length > 1) {
        return `${parts.slice(1).join(".")}${plat}`;
      }
      return host;
    }
  }

  for (const tld of MULTI_PART_TLDS) {
    if (host.endsWith(tld)) {
      const withoutTld = host.slice(0, -tld.length);
      const parts = withoutTld.split(".");
      if (parts.length > 1) {
        return `${parts.slice(1).join(".")}${tld}`;
      }
      return host;
    }
  }

  const parts = host.split(".");
  if (parts.length > 2) {
    return parts.slice(-2).join(".");
  }

  return host;
}
