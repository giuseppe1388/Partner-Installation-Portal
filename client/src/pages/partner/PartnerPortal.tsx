import { useState, useEffect } from "react";
import PartnerLogin from "./Login";
import TimelineDashboard from "./TimelineDashboard";
import Installations from "./Installations";
import { Button } from "@/components/ui/button";
import { Calendar, List, LogOut, Menu, X } from "lucide-react";
import { APP_TITLE, APP_LOGO } from "@/const";

export default function PartnerPortal() {
  const [partner, setPartner] = useState<any>(null);
  const [activeView, setActiveView] = useState<"planner" | "installations">("planner");
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header with Menu Toggle */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <img src={APP_LOGO} alt="Logo" className="w-8 h-8 rounded-lg" />
          <h1 className="font-bold text-sm">{APP_TITLE}</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Left Sidebar Menu */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-64 border-r bg-card flex flex-col flex-shrink-0 absolute md:relative top-16 md:top-0 left-0 right-0 md:h-auto h-screen z-50`}>
        {/* Logo/Header - Hidden on mobile */}
        <div className="hidden md:block p-4 border-b">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="Logo" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="font-bold text-sm">{APP_TITLE}</h1>
              <p className="text-xs text-muted-foreground">{partner.name}</p>
            </div>
          </div>
        </div>
        {/* Mobile Partner Name */}
        <div className="md:hidden p-4 border-b">
          <p className="text-sm font-semibold">{partner.name}</p>
        </div>
        {/* Navigation Menu */}
        <nav className="flex-1 p-3 flex flex-col">
          <div className="flex-1">
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
          </div>
          {/* Logout at bottom */}
          <div className="border-t pt-3">
            <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Esci
            </Button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full md:w-auto">
        {activeView === "planner" ? (
          <div className="flex-1 overflow-auto">
            <TimelineDashboard partner={partner} onLogout={handleLogout} />
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="container mx-auto max-w-6xl">
              <Installations partner={partner} />
            </div>
          </div>
        )}
        {/* Close sidebar on mobile when clicking content */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 md:hidden z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

