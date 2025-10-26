import { useState } from "react";
import TechnicianLogin from "./Login";
import TechnicianDashboard from "./Dashboard";

export default function TechnicianPortal() {
  const [technician, setTechnician] = useState<any>(null);

  const handleLogout = () => {
    setTechnician(null);
  };

  if (!technician) {
    return <TechnicianLogin onLoginSuccess={setTechnician} />;
  }

  return <TechnicianDashboard technician={technician} onLogout={handleLogout} />;
}

