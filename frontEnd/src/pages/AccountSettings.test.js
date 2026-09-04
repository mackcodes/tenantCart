import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AccountSettings from "./AccountSettings.js";
import { useAuth } from "../context/AuthContext.js";
import {
  deleteCurrentTenant,
  exportCurrentTenant,
} from "../services/tenantService.js";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("../components/dashboard/DashboardLayout.js", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../context/AuthContext.js", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../services/tenantService.js", () => ({
  deleteCurrentTenant: jest.fn(),
  exportCurrentTenant: jest.fn(),
}));

const tenant = {
  _id: "tenant-1",
  slug: "sunrise-market",
  storeName: "Sunrise Market",
};

const renderSettings = () => {
  useAuth.mockReturnValue({
    user: { tenant },
    tenants: [{ tenant, role: "owner" }],
    refreshUser: jest.fn().mockResolvedValue(undefined),
  });

  return render(
    <AccountSettings />
  );
};

describe("AccountSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
    jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    global.URL.createObjectURL = jest.fn(() => "blob:test");
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("downloads an export for the active tenant", async () => {
    const user = userEvent.setup();
    exportCurrentTenant.mockResolvedValue({ tenant });
    renderSettings();

    await user.click(screen.getByRole("button", { name: /download export/i }));

    await waitFor(() => {
      expect(exportCurrentTenant).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText(/export has been downloaded/i)).toBeInTheDocument();
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  test("requires the exact store slug before deleting", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.type(screen.getByLabelText(/type sunrise-market/i), "wrong-store");
    await user.click(screen.getByRole("button", { name: /^delete store$/i }));

    expect(deleteCurrentTenant).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /exact store address/i
    );
  });

  test("deletes the tenant and redirects to store setup after confirmation", async () => {
    const user = userEvent.setup();
    deleteCurrentTenant.mockResolvedValue({
      message: "Tenant and all tenant-owned data deleted",
    });
    renderSettings();

    await user.type(
      screen.getByLabelText(/type sunrise-market/i),
      "sunrise-market"
    );
    await user.click(screen.getByRole("button", { name: /^delete store$/i }));

    await waitFor(() => {
      expect(deleteCurrentTenant).toHaveBeenCalledWith("sunrise-market");
    });
    expect(mockNavigate).toHaveBeenCalledWith("/register-store", { replace: true });
  });
});
