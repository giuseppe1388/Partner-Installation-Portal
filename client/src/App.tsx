import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PartnersPage from "./pages/admin/Partners";
import TeamsPage from "./pages/admin/Teams";
import InstallationsPage from "./pages/admin/Installations";
import SettingsPage from "./pages/admin/Settings";
import PartnerPortal from "./pages/partner/PartnerPortal";
import TechnicianPortal from "./pages/technician/TechnicianPortal";

function Router() {
  return (
    <Switch>
      <Route path={"/"}>
        <Redirect to="/partner" />
      </Route>
      <Route path={"/partner"} component={PartnerPortal} />
      <Route path={"/technician"} component={TechnicianPortal} />
      <Route path={"/admin"}>
        <Redirect to="/admin/partners" />
      </Route>
      <Route path={"/admin/partners"} component={PartnersPage} />
      <Route path={"/admin/teams"} component={TeamsPage} />
      <Route path={"/admin/installations"} component={InstallationsPage} />
      <Route path={"/admin/settings"} component={SettingsPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

