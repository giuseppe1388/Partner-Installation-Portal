import { useState, useEffect } from "react";
import PartnerLogin from "./Login";
import TimelineDashboard from "./TimelineDashboard";
import Installations from "./Installations";
import { Button } from "@/components/ui/button";
import { Calendar, List, LogOut } from "lucide-react";
import { APP_TITLE, APP_LOGO } from "@/const";

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
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar Menu */}
      <div className="w-64 border-r bg-card flex flex-col flex-shrink-0">
        {/* Logo/Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="Logo" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="font-bold text-sm">{APP_TITLE}</h1>
              <p className="text-xs text-muted-foreground">{partner.name}</p>
            </div>
          </div>
        </div>
        {/* Navigation Menu */}
        <nav className="flex-1 p-3">
          <Button
            variant={activeView === "planner" ? "default" : "ghost"}
            className="w-full justify-start mb-2"
            onClick={() => setActiveView("planner")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Planner
          </Button>
          <Button
            variant={activeView === "installations" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveView("installations")}
          >
            <List className="w-4 h-4 mr-2" />
            Installazioni
          </Button>
        </nav>
        {/* Logout */}
        <div className="p-3 border-t">
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Esci
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeView === "planner" ? (
          <TimelineDashboard partner={partner} onLogout={handleLogout} />
        ) : (
          <div className="flex-1 overflow-auto p-6">
            <div className="container mx-auto max-w-6xl">
              <Installations partner={partner} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

