import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { format, addDays, startOfDay, addHours, differenceInMinutes, isSameDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogOut, Loader2, Clock, MapPin, FileText, Phone, Mail, User, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

const ITEM_TYPE = "INSTALLATION";
const HOUR_WIDTH = 80; // pixels per hour
const ROW_HEIGHT = 40; // pixels per team row

interface DashboardProps {
  partner: any;
  onLogout: () => void;
}

interface Installation {
  id: number;
  serviceAppointmentId: string;
  customerName: string;
  customerCF?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  installationAddress: string;
  technicalNotes?: string | null;
  imagesToView?: string | null;
  completionLink?: string | null;
  durationMinutes?: number | null;
  travelTimeMinutes?: number | null;
  status: string;
  teamId?: number | null;
  partnerId?: number | null;
  scheduledStart?: Date | string | null;
  scheduledEnd?: Date | string | null;
}

interface Team {
  id: number;
  name: string;
  salesforceTeamId: string;
}

// Draggable Installation Block
function InstallationBlock({
  installation,
  team,
  startHour,
  onClick,
  onReassign,
}: {
  installation: Installation;
  team: Team;
  startHour: number;
  onClick: () => void;
  onReassign: (installation: Installation, newTeam: Team, newStartHour: number) => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { installation, currentTeam: team, currentStartHour: startHour },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const durationHours = (installation.durationMinutes || 120) / 60;
  const width = durationHours * HOUR_WIDTH;

  // Color based on status
  const colors: Record<string, string> = {
    pending: "bg-gray-400",
    scheduled: "bg-blue-500",
    in_progress: "bg-yellow-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
  };

  return (
    <div
      ref={drag as any}
      className={`absolute h-[32px] ${colors[installation.status] || "bg-blue-500"} text-white rounded px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity text-xs overflow-hidden ${
        isDragging ? "opacity-50" : ""
      }`}
      style={{
        width: `${width}px`,
        top: "4px",
      }}
      onClick={onClick}
    >
      <div className="font-medium truncate">{installation.customerName}</div>
      <div className="text-[10px] opacity-90 truncate">{installation.installationAddress.substring(0, 30)}...</div>
    </div>
  );
}

// Team Row with Drop Zone
function TeamRow({
  team,
  date,
  installations,
  hours,
  onDrop,
  onBlockClick,
  onReassign,
}: {
  team: Team;
  date: Date;
  installations: Installation[];
  hours: number[];
  onDrop: (installation: Installation, team: Team, date: Date, hour: number) => void;
  onBlockClick: (installation: Installation) => void;
  onReassign: (installation: Installation, newTeam: Team, newStartHour: number) => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: { installation: Installation; currentTeam: Team; currentStartHour: number }, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset) return;

      const dropTarget = monitor.getDropResult();
      // Calculate which hour slot based on drop position
      // For now, use the first hour as default
      onDrop(item.installation, team, date, hours[0]);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  // Filter installations for this team and date
  const teamInstallations = installations.filter((inst) => {
    if (inst.teamId !== team.id || !inst.scheduledStart) return false;
    const instDate = typeof inst.scheduledStart === 'string' ? parseISO(inst.scheduledStart) : inst.scheduledStart;
    return isSameDay(instDate, date);
  });

  return (
    <div
      ref={drop as any}
      className={`relative border-b border-r ${isOver ? "bg-blue-50 dark:bg-blue-950" : ""}`}
      style={{ height: `${ROW_HEIGHT}px`, minWidth: `${hours.length * HOUR_WIDTH}px` }}
    >
      {teamInstallations.map((inst) => {
        const instStart = typeof inst.scheduledStart === 'string' ? parseISO(inst.scheduledStart) : new Date(inst.scheduledStart!);
        const startHour = instStart.getHours() + instStart.getMinutes() / 60;
        const offsetHours = startHour - hours[0];
        const left = offsetHours * HOUR_WIDTH;

        return (
          <div key={inst.id} style={{ position: 'absolute', left: `${left}px` }}>
            <InstallationBlock
              installation={inst}
              team={team}
              startHour={startHour}
              onClick={() => onBlockClick(inst)}
              onReassign={onReassign}
            />
          </div>
        );
      })}
    </div>
  );
}

// Draggable Pending Installation
function PendingInstallation({ installation, onClick }: { installation: Installation; onClick: () => void }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { installation, currentTeam: null, currentStartHour: null },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      className={`p-2 border rounded-lg cursor-pointer hover:bg-accent transition-colors text-xs ${
        isDragging ? "opacity-50" : ""
      }`}
      onClick={onClick}
    >
      <div className="font-medium truncate">{installation.customerName}</div>
      <div className="text-muted-foreground mt-1 flex items-center gap-1">
        <MapPin className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{installation.installationAddress.substring(0, 25)}...</span>
      </div>
      {installation.durationMinutes && (
        <div className="text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3 flex-shrink-0" />
          {installation.durationMinutes} min
        </div>
      )}
    </div>
  );
}

export default function TimelineDashboard({ partner, onLogout }: DashboardProps) {
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [daysToShow, setDaysToShow] = useState(1);

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
      toast.success("Installazione schedulata con successo");
    },
    onError: (error) => {
      toast.error(error.message || "Errore nella schedulazione");
    },
  });

  const pendingInstallations = useMemo(() => {
    if (!installations) return [];
    return installations.filter((inst) => inst.status === "pending");
  }, [installations]);

  const scheduledInstallations = useMemo(() => {
    if (!installations) return [];
    return installations.filter((inst) => inst.status === "scheduled" && inst.scheduledStart);
  }, [installations]);

  const dates = useMemo(() => {
    const result = [];
    for (let i = 0; i < daysToShow; i++) {
      result.push(addDays(currentDate, i));
    }
    return result;
  }, [currentDate, daysToShow]);

  const hours = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00
  }, []);

  const handleDrop = (installation: Installation, team: Team, date: Date, hour: number) => {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);

    const durationMinutes = installation.durationMinutes || 120;
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    scheduleMutation.mutate({
      installationId: installation.id,
      partnerId: partner.id,
      teamId: team.id,
      scheduledStart: startTime.toISOString(),
      scheduledEnd: endTime.toISOString(),
    });
  };

  const handleReassign = (installation: Installation, newTeam: Team, newStartHour: number) => {
    // Reassign logic (same as drop)
    const startTime = new Date(currentDate);
    startTime.setHours(newStartHour, 0, 0, 0);

    const durationMinutes = installation.durationMinutes || 120;
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    scheduleMutation.mutate({
      installationId: installation.id,
      partnerId: partner.id,
      teamId: newTeam.id,
      scheduledStart: startTime.toISOString(),
      scheduledEnd: endTime.toISOString(),
    });
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
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b bg-card px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold">{APP_TITLE}</h1>
            <p className="text-xs text-muted-foreground">Benvenuto, {partner.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, -1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(startOfDay(new Date()))}>
                Oggi
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <div className="text-sm font-medium px-2">
                {format(currentDate, "EEE dd MMM yyyy", { locale: it })}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-1" />
              Esci
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Pending Installations */}
          <div className="w-64 border-r bg-card flex-shrink-0">
            <div className="p-3 border-b bg-muted">
              <h2 className="font-semibold text-sm">Installazioni in Attesa</h2>
              <p className="text-xs text-muted-foreground">Trascina nel calendario</p>
            </div>
            <ScrollArea className="h-full">
              <div className="p-2 space-y-2">
                {pendingInstallations.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Nessuna installazione in attesa
                  </p>
                ) : (
                  pendingInstallations.map((installation) => (
                    <PendingInstallation
                      key={installation.id}
                      installation={installation}
                      onClick={() => {
                        setSelectedInstallation(installation);
                        setIsDetailDialogOpen(true);
                      }}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Center - Team Names */}
          <div className="w-48 border-r bg-card flex-shrink-0 flex flex-col">
            <div className="p-3 border-b bg-muted" style={{ height: "60px" }}>
              <h2 className="font-semibold text-sm">Squadre</h2>
            </div>
            <ScrollArea className="flex-1">
              <div>
                {teams?.map((team) => (
                  <div
                    key={team.id}
                    className="border-b px-3 flex items-center font-medium text-sm"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {team.name}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right - Timeline */}
          <div className="flex-1 overflow-auto bg-background">
            <div className="inline-block min-w-full">
              {/* Time Header */}
              <div className="sticky top-0 z-10 bg-muted border-b flex" style={{ height: "60px" }}>
                {dates.map((date) => (
                  <div key={date.toISOString()} className="flex border-r">
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="border-r text-center text-xs font-medium flex items-center justify-center"
                        style={{ width: `${HOUR_WIDTH}px` }}
                      >
                        <div>
                          <div className="text-[10px] text-muted-foreground">
                            {format(date, "dd MMM", { locale: it })}
                          </div>
                          <div>{hour}:00</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Team Rows */}
              <div>
                {teams?.map((team) => (
                  <div key={team.id} className="flex">
                    {dates.map((date) => (
                      <TeamRow
                        key={date.toISOString()}
                        team={team}
                        date={date}
                        installations={scheduledInstallations}
                        hours={hours}
                        onDrop={handleDrop}
                        onBlockClick={(inst) => {
                          setSelectedInstallation(inst);
                          setIsDetailDialogOpen(true);
                        }}
                        onReassign={handleReassign}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dettaglio Installazione</DialogTitle>
              <DialogDescription>Visualizzazione completa dei dati (sola lettura)</DialogDescription>
            </DialogHeader>
            {selectedInstallation && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <Label>Stato:</Label>
                  {getStatusBadge(selectedInstallation.status)}
                </div>

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

                {selectedInstallation.scheduledStart && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Schedulazione</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Data/Ora Inizio</Label>
                        <div className="text-sm">
                          {format(
                            typeof selectedInstallation.scheduledStart === 'string' 
                              ? parseISO(selectedInstallation.scheduledStart) 
                              : selectedInstallation.scheduledStart,
                            "dd/MM/yyyy HH:mm",
                            { locale: it }
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Data/Ora Fine</Label>
                        <div className="text-sm">
                          {selectedInstallation.scheduledEnd &&
                            format(
                              typeof selectedInstallation.scheduledEnd === 'string'
                                ? parseISO(selectedInstallation.scheduledEnd)
                                : selectedInstallation.scheduledEnd,
                              "dd/MM/yyyy HH:mm",
                              { locale: it }
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
      </div>
    </DndProvider>
  );
}

