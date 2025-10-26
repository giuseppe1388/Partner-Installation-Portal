import { useState, useEffect } from "react";
import PartnerLogin from "./Login";
import TimelineDashboard from "./TimelineDashboard";
import Installations from "./Installations";

export default function PartnerPortal() {
  const [partner, setPartner] = useState<any>(null);

  useEffect(() => {
    // Check if partner is already logged in
    const storedPartner = localStorage.getItem("partner");
    if (storedPartner) {
      try {
        setPartner(JSON.parse(storedPartner));
      } catch (error) {
        localStorage.removeItem("partner");
      }
    }
  }, []);

  const handleLoginSuccess = (partnerData: any) => {
    setPartner(partnerData);
  };

  const handleLogout = () => {
    localStorage.removeItem("partner");
    setPartner(null);
  };

  if (!partner) {
    return <PartnerLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div>
      <TimelineDashboard partner={partner} onLogout={handleLogout} />
      <Installations partner={partner} />
    </div>
  );
}

