import { useState } from "react";
import ReportsGate from "../components/reports/ReportsGate";
import ReportsDashboard from "../components/reports/ReportsDashboard";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

export default function ReportsPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleUnlock = (password) => {
    // temporary password (we'll secure later)
    if (password === "1234") {
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsUnlocked(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {isUnlocked ? (
        <div className="flex min-h-screen overflow-hidden">

          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full max-w-[1800px] mx-auto">
            <ReportsDashboard onLogout={handleLogout} />
            <Footer />
          </div>

        </div>
      ) : (
        <ReportsGate onUnlock={handleUnlock} />
      )}
    </div>
  );
}