import { useState } from "react";

import DashboardSidebar from "./DashboardSidebar.js";
import DashboardHeader from "./DashboardHeader.js";
import VerifyEmailBanner from "./VerifyEmailBanner.js";

import "../../styles/dashboard.css";

const DashboardLayout = ({
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="dashboard-layout">
      <DashboardSidebar
        mobileMenuOpen={mobileMenuOpen}
        onNavigate={closeMobileMenu}
      />

      <div className="dashboard-main">
        <DashboardHeader
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen((isOpen) => !isOpen)}
        />

        <VerifyEmailBanner />

        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;