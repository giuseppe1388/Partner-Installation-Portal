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
import { LogOut, Loader2, Calendar as CalendarIcon, Clock, MapPin, Users, FileText, Phone, Mail, User } from "lucide-react";
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
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
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
    setIsDetailDialogOpen(true);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      scheduled: "default",
      in_progress: "outline",
      completed: "default",
      cancelled: "destructive",
    };

    const labels: Record<string, string> = {
      pending: "In Attesa",
      scheduled: "Schedulata",
      in_progress: "In Corso",
      completed: "Completata",
      cancelled: "Annullata",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
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
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - All Installations List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tutte le Installazioni</CardTitle>
                <CardDescription>
                  Click per visualizzare i dettagli
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {installations?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nessuna installazione disponibile
                  </p>
                ) : (
                  installations?.map((installation) => (
                    <div
                      key={installation.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => {
                        setSelectedInstallation(installation);
                        setIsDetailDialogOpen(true);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{installation.customerName}</div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{installation.installationAddress.substring(0, 30)}...</span>
                          </div>
                          {installation.scheduledStart && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              {format(new Date(installation.scheduledStart), "dd/MM HH:mm", { locale: it })}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(installation.status)}
                        </div>
                      </div>
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

            {/* Logout Button */}
            <Button variant="outline" onClick={onLogout} className="w-full mt-6 justify-start">
              <LogOut className="w-4 h-4 mr-2" />
              Esci
            </Button>
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
                  Click su uno slot vuoto per schedulare un'installazione
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: "600px" }}>
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%" }}
                    selectable
                    onSelectSlot={(slotInfo) => {
                      // Show list of pending installations to schedule
                      if (pendingInstallations.length > 0) {
                        setSelectedSlot(slotInfo);
                        setSelectedInstallation(pendingInstallations[0]);
                        setIsScheduleDialogOpen(true);
                      } else {
                        toast.info("Nessuna installazione in attesa da schedulare");
                      }
                    }}
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

      {/* Detail Dialog (Read-only) */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dettaglio Installazione</DialogTitle>
            <DialogDescription>
              Visualizzazione completa dei dati dell'installazione (sola lettura)
            </DialogDescription>
          </DialogHeader>
          {selectedInstallation && (
            <div className="space-y-4 py-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <Label>Stato:</Label>
                {getStatusBadge(selectedInstallation.status)}
              </div>

              {/* Customer Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Dati Cliente
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nome</Label>
                    <div className="font-medium">{selectedInstallation.customerName}</div>
                  </div>
                  {selectedInstallation.customerCF && (
                    <div>
                      <Label className="text-muted-foreground">Codice Fiscale</Label>
                      <div className="font-medium font-mono text-sm">{selectedInstallation.customerCF}</div>
                    </div>
                  )}
                  {selectedInstallation.customerEmail && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email
                      </Label>
                      <div className="text-sm">{selectedInstallation.customerEmail}</div>
                    </div>
                  )}
                  {selectedInstallation.customerPhone && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Telefono
                      </Label>
                      <div className="text-sm">{selectedInstallation.customerPhone}</div>
                    </div>
                  )}
                </div>
                {selectedInstallation.customerAddress && (
                  <div className="mt-3">
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Indirizzo Residenza
                    </Label>
                    <div className="text-sm">{selectedInstallation.customerAddress}</div>
                  </div>
                )}
              </div>

              {/* Installation Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Dati Installazione</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Indirizzo Installazione
                    </Label>
                    <div className="text-sm">{selectedInstallation.installationAddress}</div>
                  </div>
                  {selectedInstallation.durationMinutes && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Durata Stimata
                      </Label>
                      <div className="text-sm">{selectedInstallation.durationMinutes} minuti</div>
                    </div>
                  )}
                  {selectedInstallation.travelTimeMinutes && (
                    <div>
                      <Label className="text-muted-foreground">Tempo di Viaggio</Label>
                      <div className="text-sm">{selectedInstallation.travelTimeMinutes} minuti</div>
                    </div>
                  )}
                  {selectedInstallation.technicalNotes && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Note Tecniche
                      </Label>
                      <div className="text-sm bg-muted p-3 rounded">{selectedInstallation.technicalNotes}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule Info */}
              {selectedInstallation.scheduledStart && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Schedulazione</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Data/Ora Inizio</Label>
                      <div className="text-sm">
                        {format(new Date(selectedInstallation.scheduledStart), "dd/MM/yyyy HH:mm", { locale: it })}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Data/Ora Fine</Label>
                      <div className="text-sm">
                        {format(new Date(selectedInstallation.scheduledEnd), "dd/MM/yyyy HH:mm", { locale: it })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Salesforce Link */}
              {selectedInstallation.completionLink && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Link Completamento (Digital Experience)</Label>
                  <a
                    href={selectedInstallation.completionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline block mt-1"
                  >
                    Apri Digital Experience Salesforce
                  </a>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedula Installazione</DialogTitle>
            <DialogDescription>
              Seleziona l'installazione e la squadra per schedulare
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Select Installation */}
            <div className="space-y-2">
              <Label htmlFor="installation">Installazione *</Label>
              <Select
                value={selectedInstallation?.id.toString()}
                onValueChange={(value) => {
                  const inst = pendingInstallations.find((i) => i.id === parseInt(value));
                  setSelectedInstallation(inst);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un'installazione" />
                </SelectTrigger>
                <SelectContent>
                  {pendingInstallations.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id.toString()}>
                      {inst.customerName} - {inst.installationAddress.substring(0, 30)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSlot && (
              <div className="space-y-2">
                <Label>Orario Schedulato</Label>
                <div className="text-sm">
                  {format(selectedSlot.start, "dd/MM/yyyy HH:mm", { locale: it })} -{" "}
                  {format(addHours(selectedSlot.start, (selectedInstallation?.durationMinutes || 120) / 60), "HH:mm")}
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSchedule} disabled={scheduleMutation.isPending || !selectedTeamId || !selectedInstallation}>
              {scheduleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Conferma Schedulazione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

