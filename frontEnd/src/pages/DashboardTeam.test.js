import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DashboardTeam from "./DashboardTeam.js";
import { useAuth } from "../context/AuthContext.js";
import {
  addTenantMember,
  getTenantAuditLogs,
  getTenantMembers,
  updateTenantMember,
} from "../services/tenantService.js";

jest.mock("../components/dashboard/DashboardLayout.js", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../context/AuthContext.js", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../services/tenantService.js", () => ({
  addTenantMember: jest.fn(),
  getTenantAuditLogs: jest.fn(),
  getTenantMembers: jest.fn(),
  updateTenantMember: jest.fn(),
}));

const tenant = {
  _id: "tenant-1",
  slug: "sunrise-market",
  storeName: "Sunrise Market",
};

const ownerMember = {
  _id: "membership-owner",
  role: "owner",
  status: "active",
  user: { _id: "user-owner", name: "Owner Person", email: "owner@example.com" },
};

const staffMember = {
  _id: "membership-staff",
  role: "staff",
  status: "active",
  user: { _id: "user-staff", name: "Staff Person", email: "staff@example.com" },
};

const renderTeamPage = (role = "owner") => {
  useAuth.mockReturnValue({
    user: { tenant },
    tenants: [{ tenant, role }],
  });

  return render(<DashboardTeam />);
};

describe("DashboardTeam", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTenantMembers.mockResolvedValue({
      members: [ownerMember, staffMember],
    });
    getTenantAuditLogs.mockResolvedValue({ logs: [] });
  });

  test("loads and displays members and audit log", async () => {
    renderTeamPage("owner");

    await waitFor(() => {
      expect(getTenantMembers).toHaveBeenCalledTimes(1);
    });
    expect(getTenantAuditLogs).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("staff@example.com")).toBeInTheDocument();
    expect(screen.getByText(/no activity recorded yet/i)).toBeInTheDocument();
  });

  test("owners can invite a new member", async () => {
    const user = userEvent.setup();
    addTenantMember.mockResolvedValue({ message: "Tenant member added" });
    renderTeamPage("owner");

    await screen.findByText("staff@example.com");

    await user.type(
      screen.getByPlaceholderText(/email address/i),
      "new@example.com"
    );
    await user.click(screen.getByRole("button", { name: /add member/i }));

    await waitFor(() => {
      expect(addTenantMember).toHaveBeenCalledWith("new@example.com", "staff");
    });
    expect(getTenantMembers).toHaveBeenCalledTimes(2);
  });

  test("owners can suspend a non-owner member", async () => {
    const user = userEvent.setup();
    updateTenantMember.mockResolvedValue({ message: "Tenant member updated" });
    renderTeamPage("owner");

    await screen.findByText("staff@example.com");

    await user.click(screen.getByRole("button", { name: /^suspend$/i }));

    await waitFor(() => {
      expect(updateTenantMember).toHaveBeenCalledWith("user-staff", {
        status: "suspended",
      });
    });
  });

  test("non-owner/non-admin members see a read-only list", async () => {
    renderTeamPage("staff");

    await screen.findByText("staff@example.com");

    expect(
      screen.queryByPlaceholderText(/email address/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^suspend$/i })
    ).not.toBeInTheDocument();
  });
});
