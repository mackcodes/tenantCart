import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  getCustomerMe,
  customerLogout as apiCustomerLogout,
} from "../services/storefrontCustomerService.js";

/**
 * CustomerAuthContext — per-store customer session.
 *
 * This context is deliberately separate from AuthContext (merchant session).
 * It is instantiated per-slug via CustomerAuthProvider so each store's
 * storefront has its own isolated session state.
 */
const CustomerAuthContext = createContext(null);

export const CustomerAuthProvider = ({ slug, children }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCustomer = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }
    try {
      const data = await getCustomerMe(slug);
      setCustomer(data.customer);
    } catch {
      // 401 is expected when no session exists — treat as logged out.
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const logout = async () => {
    try {
      await apiCustomerLogout(slug);
    } finally {
      setCustomer(null);
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        loading,
        setCustomer,
        refreshCustomer: loadCustomer,
        logout,
        slug,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used inside CustomerAuthProvider");
  }
  return context;
};
