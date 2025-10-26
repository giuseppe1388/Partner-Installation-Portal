import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { format, addDays, startOfDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { LogOut, Loader2, Clock, MapPin, FileText, Phone, Mail, User, ChevronLeft, ChevronRight, Calendar, List } from "lucide-react";
import { toast } from "sonner";
import { APP_TITLE, APP_LOGO } from "@/const";

const ITEM_TYPE = "INSTALLATION";
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 40;

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

const STATUS_COLORS: Record<string, { bg: string; label: string; color: string }> = {
  pending: { bg: "bg-gray-500", label: "In Attesa", color: "#6B7280" },
  scheduled: { bg: "bg-blue-500", label: "Schedulata", color: "#3B82F6" },
  in_progress: { bg: "bg-yellow-500", label: "In Corso", color: "#EAB308" },
  completed: { bg: "bg-green-500", label: "Completata", color: "#22C55E" },
  cancelled: { bg: "bg-red-500", label: "Annullata", color: "#EF4444" },
};

// Installation Block Component
function InstallationBlock({
  installation,
  onClick,
  onStatusChange,
}: {
  installation: Installation;
  onClick: () => void;
  onStatusChange?: (status: string) => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { installation },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const durationHours = (installation.durationMinutes || 120) / 60;
  const width = durationHours * HOUR_WIDTH;
  const colorInfo = STATUS_COLORS[installation.status] || STATUS_COLORS.pending;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={drag as any}
          className={`absolute h-[32px] ${colorInfo.bg} text-white rounded px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity text-xs overflow-hidden ${
            isDragging ? "opacity-50" : ""
          }`}
          style={{ width: `${width}px`, top: "4px" }}
          onClick={onClick}
        >
          <div className="font-medium truncate">{installation.customerName}</div>
          <div className="text-[10px] opacity-90 truncate">{installation.installationAddress.substring(0, 30)}...</div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onStatusChange?.("pending")}>
          <span className="w-2 h-2 rounded-full mr-2 bg-gray-500" />
          In Attesa
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onStatusChange?.("scheduled")}>
          <span className="w-2 h-2 rounded-full mr-2 bg-blue-500" />
          Schedulata
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onStatusChange?.("in_progress")}>
          <span className="w-2 h-2 rounded-full mr-2 bg-yellow-500" />
          In Corso
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onStatusChange?.("completed")}>
          <span className="w-2 h-2 rounded-full mr-2 bg-green-500" />
          Completata
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onStatusChange?.("cancelled")}>
          <span className="w-2 h-2 rounded-full mr-2 bg-red-500" />
          Annullata
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Team Row Component
function TeamRow({
  team,
  date,
  installations,
  hours,
  onDrop,
  onBlockClick,
  onStatusChange,
}: {
  team: Team;
  date: Date;
  installations: Installation[];
  hours: number[];
  onDrop: (installation: Installation, team: Team, date: Date, hour: number, minute: number) => void;
  onBlockClick: (installation: Installation) => void;
  onStatusChange?: (installationId: number, status: string) => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: { installation: Installation }, monitor) => {
      // Ottenere le coordinate del drop
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        onDrop(item.installation, team, date, hours[0], 0);
        return;
      }

      // Ottenere la posizione dell'elemento drop (il contenitore della riga)
      const dropElement = (drop as any).getHandlerId?.();
      const dropNode = document.querySelector('[data-team-row]');
      
      if (!dropNode) {
        onDrop(item.installation, team, date, hours[0], 0);
        return;
      }

      const rect = dropNode.getBoundingClientRect();
      const relativeX = clientOffset.x - rect.left;
      
      // Calcolare l'ora e i minuti basati sulla posizione X
      // HOUR_WIDTH = 80px per ora
      const hourOffset = relativeX / HOUR_WIDTH;
      let hour = Math.floor(hourOffset) + hours[0];
      let minute = Math.round((hourOffset - Math.floor(hourOffset)) * 60);
      
      // Snap a 15 minuti
      const remainder = minute % 15;
      if (remainder < 7.5) {
        minute = minute - remainder;
      } else {
        minute = minute - remainder + 15;
      }
      
      // Gestire il caso in cui minute >= 60
      if (minute >= 60) {
        minute = 0;
        hour += 1;
      }
      
      onDrop(item.installation, team, date, hour, minute);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const teamInstallations = installations.filter((inst) => {
    if (inst.teamId !== team.id || !inst.scheduledStart || inst.status === 'cancelled') return false;
    const instDate = typeof inst.scheduledStart === 'string' ? parseISO(inst.scheduledStart) : inst.scheduledStart;
    return format(instDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  });

  return (
    <div
      ref={drop as any}
      data-team-row
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
              onClick={() => onBlockClick(inst)}
              onStatusChange={(newStatus) => {
                onStatusChange?.(inst.id, newStatus);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// Pending Installation Component
function PendingInstallation({ installation, onClick }: { installation: Installation; onClick: () => void }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { installation },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const colorInfo = STATUS_COLORS[installation.status] || STATUS_COLORS.pending;

  return (
    <div
      ref={drag as any}
      className={`p-2 border rounded-lg cursor-pointer hover:bg-accent transition-colors text-xs ${
        isDragging ? "opacity-50" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="font-medium truncate flex-1">{installation.customerName}</div>
        <div
          className="w-3 h-3 rounded-full flex-shrink-0 ml-1"
          style={{ backgroundColor: colorInfo.color }}
          title={colorInfo.label}
        />
      </div>
      <div className="text-muted-foreground flex items-center gap-1">
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
  const [isEditDateDialogOpen, setIsEditDateDialogOpen] = useState(false);
  const [editStartDate, setEditStartDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [daysToShow, setDaysToShow] = useState(1);
  const [activeView, setActiveView] = useState<"planner" | "installations">("planner");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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
    onError: (error: any) => {
      toast.error(error.message || "Errore nella schedulazione");
    },
  });

  const changeStatusMutation = trpc.partner.changeStatus.useMutation({
    onSuccess: () => {
      utils.partner.myInstallations.invalidate();
      toast.success("Stato aggiornato");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore nell'aggiornamento dello stato");
    },
  });

  // Installazioni da schedulare (pending + cancelled)
  const unscheduledInstallations = useMemo(() => {
    if (!installations) return [];
    return installations.filter((inst) => inst.status === "pending" || inst.status === "cancelled");
  }, [installations]);

  // Installazioni schedulate
  const scheduledInstallations = useMemo(() => {
    if (!installations) return [];
    return installations.filter((inst) => inst.status !== "pending" && inst.scheduledStart);
  }, [installations]);

  // Installazioni filtrate per la lista completa
  const filteredInstallations = useMemo(() => {
    if (!installations) return [];
    if (filterStatus === "all") return installations;
    return installations.filter((inst) => inst.status === filterStatus);
  }, [installations, filterStatus]);

  const dates = useMemo(() => {
    const result = [];
    for (let i = 0; i < daysToShow; i++) {
      result.push(addDays(currentDate, i));
    }
    return result;
  }, [currentDate, daysToShow]);

  const hours = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 8);
  }, []);

  const handleDrop = (installation: Installation, team: Team, date: Date, hour: number, minute: number = 0) => {
    const startTime = new Date(date);
    startTime.setHours(hour, minute, 0, 0);

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

  const handleStatusChange = (installationId: number, status: string) => {
    changeStatusMutation.mutate({
      installationId,
      status: status as any,
    });
  };

  const handleEditDates = () => {
    if (!selectedInstallation || !editStartDate || !editStartTime || !editEndDate || !editEndTime) {
      toast.error("Compila tutti i campi");
      return;
    }

    const startDateTime = new Date(`${editStartDate}T${editStartTime}`);
    const endDateTime = new Date(`${editEndDate}T${editEndTime}`);

    if (startDateTime >= endDateTime) {
      toast.error("L'ora di inizio deve essere prima dell'ora di fine");
      return;
    }

    scheduleMutation.mutate({
      installationId: selectedInstallation.id,
      partnerId: partner.id,
      teamId: selectedInstallation.teamId || 0,
      scheduledStart: startDateTime.toISOString(),
      scheduledEnd: endDateTime.toISOString(),
    });

    setIsEditDateDialogOpen(false);
    setIsDetailDialogOpen(false);
  };

  const openDetailDialog = (installation: Installation) => {
    setSelectedInstallation(installation);
    setIsDetailDialogOpen(true);
  };

  const openEditDateDialog = () => {
    if (!selectedInstallation) return;

    const startDate = selectedInstallation.scheduledStart
      ? typeof selectedInstallation.scheduledStart === 'string'
        ? parseISO(selectedInstallation.scheduledStart)
        : selectedInstallation.scheduledStart
      : new Date();

    const endDate = selectedInstallation.scheduledEnd
      ? typeof selectedInstallation.scheduledEnd === 'string'
        ? parseISO(selectedInstallation.scheduledEnd)
        : selectedInstallation.scheduledEnd
      : new Date();

    setEditStartDate(format(startDate, 'yyyy-MM-dd'));
    setEditStartTime(format(startDate, 'HH:mm'));
    setEditEndDate(format(endDate, 'yyyy-MM-dd'));
    setEditEndTime(format(endDate, 'HH:mm'));
    setIsDetailDialogOpen(false);
    setIsEditDateDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const colorInfo = STATUS_COLORS[status] || STATUS_COLORS.pending;
    return <Badge style={{ backgroundColor: colorInfo.color }}>{colorInfo.label}</Badge>;
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
            <Button variant="outline" className="w-full justify-start" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Esci
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Planner View */}
          {activeView === "planner" && (
            <div className="flex flex-1 overflow-hidden">
              {/* Left Sidebar - Pending Installations */}
              <div className="w-64 border-r bg-card flex-shrink-0 flex flex-col">
                <div className="p-3 border-b bg-muted">
                  <h2 className="font-semibold text-sm">Da Schedulare</h2>
                  <p className="text-xs text-muted-foreground">Trascina nel calendario</p>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-2">
                    {unscheduledInstallations.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        Nessuna installazione da schedulare
                      </p>
                    ) : (
                      unscheduledInstallations.map((installation) => (
                        <PendingInstallation
                          key={installation.id}
                          installation={installation}
                          onClick={() => openDetailDialog(installation)}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
                {/* Legend */}
                <div className="p-3 border-t bg-muted">
                  <h3 className="font-semibold text-xs mb-2">Legenda</h3>
                  <div className="space-y-1">
                    {Object.entries(STATUS_COLORS).map(([status, info]) => (
                      <div key={status} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: info.color }} />
                        <span>{info.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Center - Team Names */}
              <div className="w-48 border-r bg-card flex-shrink-0 flex flex-col">
                <div className="p-3 border-b bg-muted flex items-center justify-between" style={{ height: "100px" }}>
                  <div>
                    <h2 className="font-semibold text-sm">Squadre</h2>
                    <div className="flex gap-1 mt-2">
                      <Button
                        variant={daysToShow === 1 ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => setDaysToShow(1)}
                      >
                        Oggi
                      </Button>
                      <Button
                        variant={daysToShow === 3 ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => setDaysToShow(3)}
                      >
                        3gg
                      </Button>
                      <Button
                        variant={daysToShow === 7 ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => setDaysToShow(7)}
                      >
                        1sett
                      </Button>
                    </div>
                  </div>
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
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-2 border-b bg-muted flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, -daysToShow))}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(startOfDay(new Date()))}>
                      Oggi
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, daysToShow))}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <div className="text-sm font-medium px-2">
                      {format(currentDate, "dd MMM yyyy", { locale: it })}
                      {daysToShow > 1 && ` - ${format(addDays(currentDate, daysToShow - 1), "dd MMM yyyy", { locale: it })}`}
                    </div>
                  </div>
                </div>

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
                              onBlockClick={openDetailDialog}
                              onStatusChange={handleStatusChange}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Installations List View */}
          {activeView === "installations" && (
            <div className="flex-1 overflow-auto p-6">
              <div className="container mx-auto max-w-6xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Tutte le Installazioni</h2>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtra per stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli stati</SelectItem>
                      {Object.entries(STATUS_COLORS).map(([status, info]) => (
                        <SelectItem key={status} value={status}>
                          {info.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4">
                  {filteredInstallations.map((installation) => {
                    const team = teams?.find((t) => t.id === installation.teamId);
                    return (
                      <Card
                        key={installation.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => openDetailDialog(installation)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{installation.customerName}</CardTitle>
                              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {installation.installationAddress}
                              </div>
                            </div>
                            {getStatusBadge(installation.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {installation.customerPhone && (
                              <div>
                                <div className="text-muted-foreground text-xs">Telefono</div>
                                <div className="font-medium">{installation.customerPhone}</div>
                              </div>
                            )}
                            {installation.durationMinutes && (
                              <div>
                                <div className="text-muted-foreground text-xs">Durata</div>
                                <div className="font-medium">{installation.durationMinutes} min</div>
                              </div>
                            )}
                            {team && (
                              <div>
                                <div className="text-muted-foreground text-xs">Squadra</div>
                                <div className="font-medium">{team.name}</div>
                              </div>
                            )}
                            {installation.scheduledStart && (
                              <div>
                                <div className="text-muted-foreground text-xs">Schedulata</div>
                                <div className="font-medium">
                                  {format(
                                    typeof installation.scheduledStart === 'string'
                                      ? parseISO(installation.scheduledStart)
                                      : installation.scheduledStart,
                                    "dd/MM/yyyy HH:mm",
                                    { locale: it }
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dettaglio Installazione</DialogTitle>
              <DialogDescription>Visualizzazione completa dei dati</DialogDescription>
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
              {selectedInstallation?.scheduledStart && (
                <Button onClick={openEditDateDialog}>
                  Modifica Date
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Date Dialog */}
        <Dialog open={isEditDateDialogOpen} onOpenChange={setIsEditDateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Modifica Data e Ora</DialogTitle>
              <DialogDescription>Modifica la data e l'ora di inizio e fine</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="start-date">Data Inizio</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="start-time">Ora Inizio</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Data Fine</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-time">Ora Fine</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDateDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleEditDates}>
                Salva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}

