import DashboardLayout from "./dashboard/DashboardLayout.js";

const ComingSoon = ({
  title,
}) => {
  return (
    <DashboardLayout>
      <main className="dashboard-home">
        <p className="dashboard-eyebrow">
          Dashboard
        </p>

        <h1>{title}</h1>

        <p>
          This section is being prepared.
        </p>
      </main>
    </DashboardLayout>
  );
};

export default ComingSoon;
