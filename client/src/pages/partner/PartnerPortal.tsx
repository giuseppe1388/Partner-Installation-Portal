import { useState, useEffect } from "react";
import PartnerLogin from "./Login";
import TimelineDashboard from "./TimelineDashboard";
import Installations from "./Installations";

export default function PartnerPortal() {
  const [partner, setPartner] = useState<any>(null);
  const [activeView, setActiveView] = useState<"planner" | "installations">("planner");

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
    <div className="w-full h-screen flex flex-col">
      <div className="flex gap-2 p-4 border-b bg-white">
        <button
          onClick={() => setActiveView("planner")}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            activeView === "planner"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Planner
        </button>
        <button
          onClick={() => setActiveView("installations")}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            activeView === "installations"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Installazioni
        </button>
        <div className="flex-1" />
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          Esci
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeView === "planner" ? (
          <TimelineDashboard partner={partner} onLogout={handleLogout} />
        ) : (
          <div className="h-full overflow-auto p-4">
            <Installations partner={partner} />
          </div>
        )}
      </div>
    </div>
  );
}

