import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api.js";
import {
  getMyTenants,
  setCurrentTenant,
} from "../services/tenantService.js";

const AuthContext =
  createContext(null);

export const AuthProvider = ({
  children,
}) => {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    tenants,
    setTenants,
  ] = useState([]);

  const loadUser = async () => {
    try {
      const data =
        await api("/auth/me");

      setUser(data.user);

      if (data.user.role !== "admin") {
        const tenantData = await getMyTenants();
        setTenants(tenantData.tenants || []);
        const activeTenant = (tenantData.tenants || []).find(
          ({ tenant }) => String(tenant._id) === String(
            tenantData.currentTenantId || ""
          )
        )?.tenant || null;
        setUser((currentUser) => ({
          ...currentUser,
          tenant: activeTenant,
        }));
      } else {
        setTenants([]);
      }
    } catch (error) {
      setUser(null);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (
    email,
    password
  ) => {
    const data = await api(
      "/auth/login",
      {
        method: "POST",
        body: {
          email,
          password,
        },
      }
    );

    setUser(data.user);

    if (data.user.role !== "admin") {
      const tenantData = await getMyTenants();
      setTenants(tenantData.tenants || []);
      const activeTenant = (tenantData.tenants || []).find(
        ({ tenant }) => String(tenant._id) === String(
          tenantData.currentTenantId || ""
        )
      )?.tenant || null;
      setUser((currentUser) => ({
        ...currentUser,
        tenant: activeTenant,
      }));
    }

    return data;
  };

  const switchTenant = async (tenantId) => {
    const data = await setCurrentTenant(tenantId);
    setUser(data.user);
    setTenants((currentTenants) => currentTenants.map((entry) => ({
      ...entry,
      tenant: String(entry.tenant._id) === String(tenantId)
        ? data.tenant
        : entry.tenant,
    })));
    return data;
  };

  const logout = async () => {
    try {
      await api(
        "/auth/logout",
        {
          method: "POST",
        }
      );
      } finally {
        setUser(null);
        setTenants([]);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        setUser,
        refreshUser: loadUser,
        tenants,
        switchTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};
