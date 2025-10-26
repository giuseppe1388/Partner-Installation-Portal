import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { format, addDays, startOfDay, isSameDay, differenceInMinutes } from "date-fns";
import { it } from "date-fns/locale";
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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogOut, Loader2, Clock, MapPin, Users, FileText, Phone, Mail, User, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

const ITEM_TYPE = "INSTALLATION";

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

// Draggable Installation Card
function DraggableInstallation({ installation, onClick }: { installation: Installation; onClick: () => void }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { installation },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      className={`p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
        isDragging ? "opacity-50" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{installation.customerName}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{installation.installationAddress.substring(0, 30)}...</span>
          </div>
          {installation.durationMinutes && (
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {installation.durationMinutes} min
            </div>
          )}
        </div>
        <Badge variant="secondary">In Attesa</Badge>
      </div>
    </div>
  );
}

// Time Slot Drop Zone
function TimeSlot({
  team,
  date,
  hour,
  installation,
  onDrop,
  onClick,
}: {
  team: Team;
  date: Date;
  hour: number;
  installation?: Installation;
  onDrop: (installation: Installation, team: Team, date: Date, hour: number) => void;
  onClick?: () => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: { installation: Installation }) => {
      onDrop(item.installation, team, date, hour);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const slotDate = new Date(date);
  slotDate.setHours(hour, 0, 0, 0);

  return (
    <div
      ref={drop as any}
      className={`min-h-[60px] border-r border-b p-1 text-xs transition-colors ${
        isOver ? "bg-primary/10" : installation ? "bg-blue-50 dark:bg-blue-950" : "hover:bg-accent/50"
      }`}
      onClick={onClick}
    >
      {installation && (
        <div className="bg-blue-500 text-white p-2 rounded text-xs cursor-pointer hover:bg-blue-600">
          <div className="font-medium truncate">{installation.customerName}</div>
          <div className="text-[10px] opacity-90 truncate">{installation.installationAddress.substring(0, 25)}...</div>
          <div className="text-[10px] opacity-90 mt-1">
            {installation.scheduledStart && format(new Date(installation.scheduledStart), "HH:mm")} -{" "}
            {installation.scheduledEnd && format(new Date(installation.scheduledEnd), "HH:mm")}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimelineDashboard({ partner, onLogout }: DashboardProps) {
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [daysToShow, setDaysToShow] = useState(3);

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

  const getInstallationForSlot = (team: Team, date: Date, hour: number) => {
    return scheduledInstallations.find((inst) => {
      if (inst.teamId !== team.id) return false;
      if (!inst.scheduledStart) return false;

      const instStart = new Date(inst.scheduledStart);
      return isSameDay(instStart, date) && instStart.getHours() === hour;
    });
  };

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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">Benvenuto, {partner.name}</p>
            </div>
            <div className="flex items-center gap-4">
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
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={daysToShow === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDaysToShow(1)}
                >
                  1 Giorno
                </Button>
                <Button
                  variant={daysToShow === 2 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDaysToShow(2)}
                >
                  2 Giorni
                </Button>
                <Button
                  variant={daysToShow === 3 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDaysToShow(3)}
                >
                  3 Giorni
                </Button>
              </div>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Esci
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Sidebar - Pending Installations */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Installazioni in Attesa</CardTitle>
                  <CardDescription>Trascina nel calendario per schedulare</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                      {pendingInstallations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Nessuna installazione in attesa
                        </p>
                      ) : (
                        pendingInstallations.map((installation) => (
                          <DraggableInstallation
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
                </CardContent>
              </Card>
            </div>

            {/* Timeline Grid */}
            <div className="lg:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Planner Multi-Squadra
                  </CardTitle>
                  <CardDescription>
                    Trascina le installazioni negli slot per assegnarle alle squadre
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full">
                      {/* Header Row */}
                      <div className="flex border-t border-l">
                        <div className="w-40 border-r border-b bg-muted p-2 font-semibold sticky left-0 z-10">
                          Squadra
                        </div>
                        {dates.map((date) => (
                          <div key={date.toISOString()} className="flex-1 min-w-[200px]">
                            <div className="border-r border-b bg-muted p-2 text-center font-semibold">
                              {format(date, "EEE dd/MM", { locale: it })}
                            </div>
                            <div className="flex">
                              {hours.map((hour) => (
                                <div
                                  key={hour}
                                  className="flex-1 border-r border-b bg-muted/50 p-1 text-center text-xs"
                                >
                                  {hour}:00
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Team Rows */}
                      {teams?.map((team) => (
                        <div key={team.id} className="flex border-l">
                          <div className="w-40 border-r border-b bg-card p-2 font-medium sticky left-0 z-10 flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {team.name}
                          </div>
                          {dates.map((date) => (
                            <div key={date.toISOString()} className="flex-1 min-w-[200px] flex">
                              {hours.map((hour) => {
                                const installation = getInstallationForSlot(team, date, hour);
                                return (
                                  <div key={hour} className="flex-1">
                                    <TimeSlot
                                      team={team}
                                      date={date}
                                      hour={hour}
                                      installation={installation}
                                      onDrop={handleDrop}
                                      onClick={
                                        installation
                                          ? () => {
                                              setSelectedInstallation(installation);
                                              setIsDetailDialogOpen(true);
                                            }
                                          : undefined
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                          {format(new Date(selectedInstallation.scheduledStart), "dd/MM/yyyy HH:mm", { locale: it })}
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Data/Ora Fine</Label>
                        <div className="text-sm">
                          {selectedInstallation.scheduledEnd &&
                            format(new Date(selectedInstallation.scheduledEnd), "dd/MM/yyyy HH:mm", { locale: it })}
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

