import { useState, useEffect } from "react";
import TechnicianLogin from "./Login";
import TechnicianDashboard from "./Dashboard";

export default function TechnicianPortal() {
  const [technician, setTechnician] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carica la sessione dal localStorage al mount
  useEffect(() => {
    const savedTechnician = localStorage.getItem('technicianSession');
    if (savedTechnician) {
      try {
        setTechnician(JSON.parse(savedTechnician));
      } catch (error) {
        console.error('Errore nel caricamento della sessione:', error);
        localStorage.removeItem('technicianSession');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (tech: any) => {
    setTechnician(tech);
    localStorage.setItem('technicianSession', JSON.stringify(tech));
  };

  const handleLogout = () => {
    setTechnician(null);
    localStorage.removeItem('technicianSession');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Caricamento...</div>;
  }

  if (!technician) {
    return <TechnicianLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <TechnicianDashboard technician={technician} onLogout={handleLogout} />;
}

