import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { format, addDays, startOfDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const ITEM_TYPE = "installation";
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 48;

interface Installation {
  id: number;
  customerName: string;
  installationAddress: string;
  durationMinutes?: number | null;
  status: string;
  teamId?: number | null;
  scheduledStart?: Date | string | null;
  scheduledEnd?: Date | string | null;
}

interface Team {
  id: number;
  name: string;
}

interface DashboardProps {
  partner: any;
  onLogout: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-400",
  scheduled: "bg-blue-500",
  in_progress: "bg-yellow-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
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
          className={`absolute h-[32px] ${colorInfo} text-white rounded px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity text-xs overflow-hidden ${
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
  const rowRef = useRef<HTMLDivElement>(null);
  const [dragPosition, setDragPosition] = useState<{ hour: number; minute: number; x: number; duration: number } | null>(null);
  const [draggedItem, setDraggedItem] = useState<Installation | null>(null);
  
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: { installation: Installation }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !rowRef.current) {
        onDrop(item.installation, team, date, hours[0], 0);
        return;
      }

      const rect = rowRef.current.getBoundingClientRect();
      const relativeX = clientOffset.x - rect.left;
      
      const hourOffset = relativeX / HOUR_WIDTH;
      let hour = Math.floor(hourOffset) + hours[0];
      let minute = Math.round((hourOffset - Math.floor(hourOffset)) * 60);
      
      const remainder = minute % 15;
      if (remainder < 7.5) {
        minute = minute - remainder;
      } else {
        minute = minute - remainder + 15;
      }
      
      if (minute >= 60) {
        minute = 0;
        hour += 1;
      }
      
      onDrop(item.installation, team, date, hour, minute);
      setDragPosition(null);
      setDraggedItem(null);
    },
    hover: (item: { installation: Installation }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (clientOffset && rowRef.current) {
        const rect = rowRef.current.getBoundingClientRect();
        const relativeX = clientOffset.x - rect.left;
        
        const hourOffset = relativeX / HOUR_WIDTH;
        let hour = Math.floor(hourOffset) + hours[0];
        let minute = Math.round((hourOffset - Math.floor(hourOffset)) * 60);
        
        const remainder = minute % 15;
        if (remainder < 7.5) {
          minute = minute - remainder;
        } else {
          minute = minute - remainder + 15;
        }
        
        if (minute >= 60) {
          minute = 0;
          hour += 1;
        }
        
        const duration = item.installation.durationMinutes || 120;
        setDragPosition({ hour, minute, x: relativeX, duration });
        setDraggedItem(item.installation);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));
  
  drop(rowRef);

  const teamInstallations = installations.filter((inst) => {
    if (inst.teamId !== team.id || !inst.scheduledStart || inst.status === 'cancelled') return false;
    const instDate = typeof inst.scheduledStart === 'string' ? parseISO(inst.scheduledStart) : inst.scheduledStart;
    return format(instDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  });

  // Calcolare l'ora di fine dal dragPosition
  const endTime = dragPosition ? new Date(date.getTime() + dragPosition.hour * 3600000 + dragPosition.minute * 60000 + dragPosition.duration * 60000) : null;

  return (
    <div
      ref={rowRef}
      className={`relative border-b border-r ${isOver ? "bg-blue-50 dark:bg-blue-950" : ""}`}
      style={{ height: `${ROW_HEIGHT}px`, minWidth: `${hours.length * HOUR_WIDTH}px` }}
      onMouseLeave={() => {
        setDragPosition(null);
        setDraggedItem(null);
      }}
    >
      {/* Indicatore visivo durante il drag */}
      {dragPosition && isOver && draggedItem && (
        <>
          {/* Anteprima del blocco */}
          <div
            className={`absolute h-[32px] ${STATUS_COLORS[draggedItem.status]} text-white rounded px-2 py-1 opacity-50`}
            style={{
              left: `${dragPosition.x}px`,
              width: `${(dragPosition.duration / 60) * HOUR_WIDTH}px`,
              top: "4px",
            }}
          />
          {/* Linea verticale che mostra dove stai trascinando */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none"
            style={{ left: `${dragPosition.x}px`, zIndex: 10 }}
          />
          {/* Tooltip con ora di inizio e fine */}
          <div
            className="absolute bg-gray-900 text-white px-3 py-2 rounded text-xs whitespace-nowrap pointer-events-none border border-gray-700"
            style={{
              left: `${dragPosition.x}px`,
              top: '-45px',
              transform: 'translateX(-50%)',
              zIndex: 20,
            }}
          >
            <div className="font-semibold">
              {String(dragPosition.hour).padStart(2, '0')}:{String(dragPosition.minute).padStart(2, '0')} - {String(endTime?.getHours()).padStart(2, '0')}:{String(endTime?.getMinutes()).padStart(2, '0')}
            </div>
          </div>
        </>
      )}
      
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

export default function TimelineDashboard({ partner, onLogout }: DashboardProps) {
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

  if (loadingInstallations || loadingTeams) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar - Unscheduled Installations */}
        <div className="w-64 border-r overflow-y-auto p-4 space-y-2">
          <h3 className="font-semibold text-sm">Da Schedulare</h3>
          <p className="text-xs text-gray-500">Trascina nel calendario</p>
          {unscheduledInstallations.map((inst) => (
            <div
              key={inst.id}
              className="p-3 bg-gray-100 dark:bg-gray-800 rounded cursor-move hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
            >
              <div className="font-medium">{inst.customerName}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{inst.installationAddress}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{inst.durationMinutes} min</div>
            </div>
          ))}

          <div className="mt-8 pt-4 border-t">
            <h3 className="font-semibold text-sm mb-2">Legenda</h3>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-400" />
                In Attesa
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                Schedulata
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                In Corso
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                Completata
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                Annullata
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Calendar */}
        <div className="flex-1 overflow-auto">
          <DndProvider backend={HTML5Backend}>
            <div className="p-4 space-y-4">
              {/* Date Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(addDays(currentDate, -1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(startOfDay(new Date()))}
                  >
                    Oggi
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(addDays(currentDate, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={daysToShow === 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDaysToShow(1)}
                  >
                    Oggi
                  </Button>
                  <Button
                    variant={daysToShow === 3 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDaysToShow(3)}
                  >
                    3gg
                  </Button>
                  <Button
                    variant={daysToShow === 7 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDaysToShow(7)}
                  >
                    1sett
                  </Button>
                </div>
                <div className="text-sm font-semibold">
                  {format(currentDate, "d MMM yyyy", { locale: it })}
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="border rounded-lg overflow-hidden">
                {/* Header with hours */}
                <div className="flex border-b bg-gray-50 dark:bg-gray-900">
                  <div className="w-32 border-r p-2 text-sm font-semibold">Squadre</div>
                  <div className="flex">
                    {dates.map((date) =>
                      hours.map((hour) => (
                        <div
                          key={`${format(date, 'yyyy-MM-dd')}-${hour}`}
                          className="border-r p-2 text-xs font-semibold text-center"
                          style={{ width: `${HOUR_WIDTH}px` }}
                        >
                          <div>{format(date, "dd MMM")}</div>
                          <div>{hour}:00</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Team rows */}
                {teams?.map((team) => (
                  <div key={team.id} className="flex border-b">
                    <div className="w-32 border-r p-2 text-sm font-semibold flex items-center">
                      {team.name}
                    </div>
                    <div className="flex">
                      {dates.map((date) => (
                        <TeamRow
                          key={`${team.id}-${format(date, 'yyyy-MM-dd')}`}
                          team={team}
                          date={date}
                          installations={scheduledInstallations}
                          hours={hours}
                          onDrop={handleDrop}
                          onBlockClick={(inst) => {
                            // Placeholder for future detail view
                          }}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DndProvider>
        </div>
      </div>
    </div>
  );
}

