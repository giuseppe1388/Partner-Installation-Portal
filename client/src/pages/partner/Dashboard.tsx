import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addHours } from "date-fns";
import { it } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LogOut, Loader2, Calendar as CalendarIcon, Clock, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

const locales = {
  "it": it,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface DashboardProps {
  partner: any;
  onLogout: () => void;
}

export default function PartnerDashboard({ partner, onLogout }: DashboardProps) {
  const [selectedInstallation, setSelectedInstallation] = useState<any>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [view, setView] = useState<View>("week");

  const utils = trpc.useUtils();
  
  const { data: installations, isLoading: loadingInstallations } = trpc.partner.myInstallations.useQuery({
    partnerId: partner.id,
  });

  const { data: teams, isLoading: loadingTeams } = trpc.partner.myTeams.useQuery({
    partnerId: partner.id,
  });

  const scheduleMutation = trpc.partner.scheduleInstallation.useMutation({
    onSuccess: () => {
      utils.partner.myInstallations.invalidate();
      setIsScheduleDialogOpen(false);
      setSelectedInstallation(null);
      setSelectedTeamId("");
      setSelectedSlot(null);
      toast.success("Installazione schedulata con successo");
    },
    onError: (error) => {
      toast.error(error.message || "Errore nella schedulazione");
    },
  });

  // Prepare events for calendar
  const events = useMemo(() => {
    if (!installations) return [];
    
    return installations
      .filter((inst) => inst.scheduledStart && inst.scheduledEnd)
      .map((inst) => ({
        id: inst.id,
        title: inst.customerName,
        start: new Date(inst.scheduledStart!),
        end: new Date(inst.scheduledEnd!),
        resource: inst,
      }));
  }, [installations]);

  // Pending installations (not scheduled yet)
  const pendingInstallations = useMemo(() => {
    if (!installations) return [];
    return installations.filter((inst) => inst.status === "pending");
  }, [installations]);

  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      setSelectedSlot(slotInfo);
    },
    []
  );

  const handleSelectEvent = useCallback((event: any) => {
    setSelectedInstallation(event.resource);
  }, []);

  const handleSchedule = () => {
    if (!selectedInstallation || !selectedTeamId || !selectedSlot) {
      toast.error("Seleziona un'installazione, una squadra e uno slot temporale");
      return;
    }

    const durationMinutes = selectedInstallation.durationMinutes || 120;
    const endTime = addHours(selectedSlot.start, durationMinutes / 60);

    scheduleMutation.mutate({
      installationId: selectedInstallation.id,
      partnerId: partner.id,
      teamId: parseInt(selectedTeamId),
      scheduledStart: selectedSlot.start.toISOString(),
      scheduledEnd: endTime.toISOString(),
    });
  };

  const handleDragInstallationToCalendar = (installation: any, slotInfo: { start: Date; end: Date }) => {
    setSelectedInstallation(installation);
    setSelectedSlot(slotInfo);
    setIsScheduleDialogOpen(true);
  };

  if (loadingInstallations || loadingTeams) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
            <p className="text-sm text-muted-foreground">Benvenuto, {partner.name}</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Esci
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Pending Installations */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Installazioni in Attesa</CardTitle>
                <CardDescription>
                  Trascina le installazioni sul calendario per schedulare
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingInstallations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nessuna installazione in attesa
                  </p>
                ) : (
                  pendingInstallations.map((installation) => (
                    <div
                      key={installation.id}
                      className="p-3 border rounded-lg cursor-move hover:bg-accent transition-colors"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("installation", JSON.stringify(installation));
                      }}
                      onClick={() => {
                        setSelectedInstallation(installation);
                        setIsScheduleDialogOpen(true);
                      }}
                    >
                      <div className="font-medium text-sm">{installation.customerName}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {installation.installationAddress.substring(0, 30)}...
                      </div>
                      {installation.durationMinutes && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {installation.durationMinutes} min
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Teams */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Le Tue Squadre</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {teams?.map((team) => (
                  <div key={team.id} className="flex items-center gap-2 p-2 border rounded">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{team.name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Planner Installazioni
                </CardTitle>
                <CardDescription>
                  Visualizza e gestisci le installazioni schedulate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  style={{ height: "600px" }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const installationData = e.dataTransfer.getData("installation");
                    if (installationData) {
                      const installation = JSON.parse(installationData);
                      // Calculate drop position as date/time
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const hour = Math.floor((y / rect.height) * 24);
                      const dropDate = new Date();
                      dropDate.setHours(hour, 0, 0, 0);
                      
                      handleDragInstallationToCalendar(installation, {
                        start: dropDate,
                        end: addHours(dropDate, 2),
                      });
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%" }}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    view={view}
                    onView={setView}
                    messages={{
                      next: "Avanti",
                      previous: "Indietro",
                      today: "Oggi",
                      month: "Mese",
                      week: "Settimana",
                      day: "Giorno",
                      agenda: "Agenda",
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedula Installazione</DialogTitle>
            <DialogDescription>
              Seleziona la squadra e conferma l'orario per schedulare l'installazione
            </DialogDescription>
          </DialogHeader>
          {selectedInstallation && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <div className="font-medium">{selectedInstallation.customerName}</div>
              </div>
              <div className="space-y-2">
                <Label>Indirizzo Installazione</Label>
                <div className="text-sm text-muted-foreground">{selectedInstallation.installationAddress}</div>
              </div>
              {selectedSlot && (
                <div className="space-y-2">
                  <Label>Orario Schedulato</Label>
                  <div className="text-sm">
                    {format(selectedSlot.start, "dd/MM/yyyy HH:mm", { locale: it })} -{" "}
                    {format(addHours(selectedSlot.start, (selectedInstallation.durationMinutes || 120) / 60), "HH:mm")}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="team">Squadra *</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona una squadra" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSchedule} disabled={scheduleMutation.isPending || !selectedTeamId}>
              {scheduleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Conferma Schedulazione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

