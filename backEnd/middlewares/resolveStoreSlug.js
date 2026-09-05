// Resolves the storefront slug from a wildcard subdomain (shopname.tenantcart.com)
// when APP_ROOT_DOMAIN is configured, otherwise falls back to the :slug path param.
// This keeps controllers domain-agnostic: they only ever read req.storeSlug.

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "app",
  "admin",
  "dashboard",
]);

export const resolveStoreSlug = (req, res, next) => {
  const rootDomain = process.env.APP_ROOT_DOMAIN;

  if (rootDomain) {
    const hostname = req.hostname || "";

    if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
      req.storeSlug = req.params.slug;
      return next();
    }

    if (hostname.endsWith(`.${rootDomain}`)) {
      const subdomain = hostname
        .slice(0, hostname.length - rootDomain.length - 1)
        .toLowerCase();

      if (subdomain && !subdomain.includes(".") && !RESERVED_SUBDOMAINS.has(subdomain)) {
        req.storeSlug = subdomain;
        return next();
      }
    }
  }

  req.storeSlug = req.params.slug;
  next();
};

export default resolveStoreSlug;
