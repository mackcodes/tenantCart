import DashboardSidebar from "./DashboardSidebar.js";
import DashboardHeader from "./DashboardHeader.js";
import VerifyEmailBanner from "./VerifyEmailBanner.js";

import "../../styles/dashboard.css";

const DashboardLayout = ({
  children,
}) => {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar />

      <div className="dashboard-main">
        <DashboardHeader />

        <VerifyEmailBanner />

        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;