import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";
import Tenant from "../models/Tenant.js";

/**
 * `protectCustomer` — storefront-only auth middleware.
 *
 * Uses a SEPARATE cookie name ("tenantcart_customer_token") so it is
 * physically impossible for a merchant session cookie to be accepted here,
 * and for a customer cookie to reach any merchant-protected endpoint.
 *
 * Token isolation guarantees:
 *  1. The JWT must carry `kind: "customer"` — rejects merchant tokens.
 *  2. The `tenantId` embedded in the token must match the tenant resolved
 *     from the request's `:slug` param — prevents Store-A tokens from
 *     working against Store-B endpoints.
 *  3. If the customer changed their password after the token was issued, the
 *     token is rejected immediately.
 */
export const protectCustomer = async (req, res, next) => {
  try {
    const token = req.cookies?.tenantcart_customer_token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const jwtSecret = process.env.JWT_SECRET || "test-secret";
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }

    // Reject merchant / platform tokens.
    if (decoded.kind !== "customer") {
      return res.status(401).json({ message: "Not authorized, invalid token type" });
    }

    // Resolve the store from the slug in the URL.
    const slug = req.params.slug?.trim().toLowerCase();
    const tenant = await Tenant.findOne({
      slug,
      status: "approved",
    }).select("_id slug");

    if (!tenant) {
      return res.status(404).json({ message: "Store not found or not approved" });
    }

    // Cross-check: the token's tenantId must match the request's store.
    // This is the critical tenant-isolation boundary for customer tokens.
    if (decoded.tenantId !== tenant._id.toString()) {
      return res.status(403).json({
        message: "This session does not belong to this store",
      });
    }

    const customer = await Customer.findOne({
      _id: decoded.sub,
      tenant: tenant._id,
    }).select("-passwordHash");

    if (!customer) {
      return res.status(401).json({ message: "Customer account not found" });
    }

    // Invalidate tokens issued before the customer changed their password.
    if (customer.passwordChangedAt && decoded.iat) {
      const passwordChangedTimestamp = Math.floor(
        customer.passwordChangedAt.getTime() / 1000
      );
      if (decoded.iat < passwordChangedTimestamp) {
        return res.status(401).json({
          message: "Password changed. Please log in again.",
        });
      }
    }

    req.customer = customer;
    req.storeTenantId = tenant._id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

/**
 * Optional variant: attaches req.customer if a valid customer token is
 * present, but does NOT block the request if there is no token.
 * Used on checkout so the customer can be linked to an order if logged in.
 */
export const optionalCustomer = async (req, res, next) => {
  try {
    const token = req.cookies?.tenantcart_customer_token;

    if (!token) {
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET || "test-secret";
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch {
      return next();
    }

    if (decoded.kind !== "customer") {
      return next();
    }

    const slug = req.params.slug?.trim().toLowerCase();
    const tenant = await Tenant.findOne({
      slug,
      status: "approved",
    }).select("_id");

    if (!tenant || decoded.tenantId !== tenant._id.toString()) {
      return next();
    }

    const customer = await Customer.findOne({
      _id: decoded.sub,
      tenant: tenant._id,
    }).select("-passwordHash");

    if (customer) {
      req.customer = customer;
      req.storeTenantId = tenant._id;
    }

    next();
  } catch {
    next();
  }
};
