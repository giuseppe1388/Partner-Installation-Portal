import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { format, startOfDay, parseISO, isSameDay } from "date-fns";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LogOut, Loader2, Clock, MapPin, FileText, Phone, Mail, User, Calendar as CalendarIcon, ExternalLink, Image as ImageIcon, FileIcon } from "lucide-react";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";
import PDFViewer from "@/components/PDFViewer";

interface DashboardProps {
  technician: any;
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
  installationType?: string | null;
  technicalNotes?: string | null;
  imagesToView?: string | null;
  completionLink?: string | null;
  pdfUrl?: string | null;
  durationMinutes?: number | null;
  travelTimeMinutes?: number | null;
  status: string;
  teamId?: number | null;
  partnerId?: number | null;
  scheduledStart?: Date | string | null;
  scheduledEnd?: Date | string | null;
}

const STATUS_COLORS: Record<string, { bg: string; label: string }> = {
  pending: { bg: "bg-gray-500", label: "In Attesa" },
  scheduled: { bg: "bg-blue-500", label: "Schedulata" },
  in_progress: { bg: "bg-yellow-500", label: "In Corso" },
  completed: { bg: "bg-green-500", label: "Completata" },
  cancelled: { bg: "bg-red-500", label: "Annullata" },
};

export default function TechnicianDashboard({ technician, onLogout }: DashboardProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);

  const utils = trpc.useUtils();

  const { data: installations, isLoading } = trpc.technician.myInstallations.useQuery({
    teamId: technician.teamId,
  });

  const updateStatusMutation = trpc.technician.updateStatus.useMutation({
    onSuccess: () => {
      utils.technician.myInstallations.invalidate();
      toast.success("Stato aggiornato con successo");
    },
    onError: (error) => {
      toast.error(error.message || "Errore nell'aggiornamento dello stato");
    },
  });

  // Filter installations for selected date
  const todayInstallations = useMemo(() => {
    if (!installations) return [];
    return installations
      .filter((inst) => {
        if (!inst.scheduledStart) return false;
        const instDate = typeof inst.scheduledStart === 'string' ? parseISO(inst.scheduledStart) : inst.scheduledStart;
        return isSameDay(instDate, selectedDate);
      })
      .sort((a, b) => {
        const dateA = typeof a.scheduledStart === 'string' ? parseISO(a.scheduledStart!) : new Date(a.scheduledStart!);
        const dateB = typeof b.scheduledStart === 'string' ? parseISO(b.scheduledStart!) : new Date(b.scheduledStart!);
        return dateA.getTime() - dateB.getTime();
      });
  }, [installations, selectedDate]);

  const handleCallCustomer = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleStartWork = (installationId: number) => {
    updateStatusMutation.mutate({
      installationId,
      status: 'in_progress',
    });
  };

  const handleCompleteWork = (installationId: number) => {
    updateStatusMutation.mutate({
      installationId,
      status: 'completed',
    });
  };

  const getStatusBadge = (status: string) => {
    const colorInfo = STATUS_COLORS[status] || STATUS_COLORS.pending;
    return <Badge className={colorInfo.bg}>{colorInfo.label}</Badge>;
  };

  const parseImages = (imagesToView: string | null): string[] => {
    if (!imagesToView) return [];
    try {
      return JSON.parse(imagesToView);
    } catch {
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold">{APP_TITLE}</h1>
          <p className="text-xs text-muted-foreground">Tecnico: {technician.name}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="w-4 h-4" />
        </Button>
      </header>

      {/* Date Selector */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">
            {format(selectedDate, "EEEE, dd MMMM yyyy", { locale: it })}
          </span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Cambia Data
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(startOfDay(date))}
              initialFocus
              locale={it}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Installations List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {todayInstallations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nessun intervento programmato per questa data</p>
              </CardContent>
            </Card>
          ) : (
            todayInstallations.map((installation) => {
              const startTime = typeof installation.scheduledStart === 'string' 
                ? parseISO(installation.scheduledStart) 
                : new Date(installation.scheduledStart!);
              
              return (
                <Card
                  key={installation.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedInstallation(installation);
                    setIsDetailDialogOpen(true);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-bold text-lg">
                            {format(startTime, "HH:mm")}
                          </span>
                        </div>
                        <CardTitle className="text-base">{installation.customerName}</CardTitle>
                      </div>
                      {getStatusBadge(installation.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {installation.installationType && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="font-medium text-blue-600 dark:text-blue-400">{installation.installationType}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{installation.installationAddress}</span>
                    </div>
                    {installation.customerPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{installation.customerPhone}</span>
                      </div>
                    )}
                    {installation.durationMinutes && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Durata: {installation.durationMinutes} min</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dettaglio Intervento</DialogTitle>
            <DialogDescription>
              {selectedInstallation && format(
                typeof selectedInstallation.scheduledStart === 'string'
                  ? parseISO(selectedInstallation.scheduledStart!)
                  : new Date(selectedInstallation.scheduledStart!),
                "EEEE, dd MMMM yyyy 'alle' HH:mm",
                { locale: it }
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedInstallation && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Label>Stato:</Label>
                {getStatusBadge(selectedInstallation.status)}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                {selectedInstallation.customerPhone && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleCallCustomer(selectedInstallation.customerPhone!)}
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Chiama Cliente
                  </Button>
                )}
                {selectedInstallation.status === 'scheduled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartWork(selectedInstallation.id)}
                    className="flex-1"
                  >
                    Inizia Lavoro
                  </Button>
                )}
                {selectedInstallation.status === 'in_progress' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCompleteWork(selectedInstallation.id)}
                    className="flex-1"
                  >
                    Completa
                  </Button>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Dati Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div className="text-sm">
                        <a href={`tel:${selectedInstallation.customerPhone}`} className="text-primary underline">
                          {selectedInstallation.customerPhone}
                        </a>
                      </div>
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
                    <div className="text-sm mb-2">{selectedInstallation.installationAddress}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(selectedInstallation.installationAddress)}`;
                          window.open(mapsUrl, '_blank');
                        }}
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Google Maps
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(selectedInstallation.installationAddress)}`;
                          window.open(wazeUrl, '_blank');
                        }}
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Waze
                      </Button>
                    </div>
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
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Tempo di Viaggio
                      </Label>
                      <div className="text-sm">{selectedInstallation.travelTimeMinutes} minuti</div>
                    </div>
                  )}
                  {selectedInstallation.technicalNotes && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Note Tecniche
                      </Label>
                      <div className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">
                        {selectedInstallation.technicalNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Images to View */}
              {selectedInstallation.imagesToView && parseImages(selectedInstallation.imagesToView).length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Immagini di Riferimento
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {parseImages(selectedInstallation.imagesToView).map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border rounded overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        <img src={url} alt={`Riferimento ${index + 1}`} className="w-full h-32 object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* PDF Viewer */}
              {selectedInstallation.pdfUrl && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileIcon className="w-4 h-4" />
                    Documentazione
                  </h3>
                  <Button
                    onClick={() => setShowPDFViewer(true)}
                    className="w-full mb-3"
                  >
                    <FileIcon className="w-4 h-4 mr-2" />
                    Visualizza PDF
                  </Button>
                </div>
              )}

              {/* Completion Link */}
              {selectedInstallation.completionLink && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Caricamento Documenti</h3>
                  <Button
                    onClick={() => selectedInstallation.completionLink && window.open(selectedInstallation.completionLink, '_blank')}
                    className="w-full mb-3"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Carica Moduli
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Clicca il link per accedere alla piattaforma Salesforce e caricare i documenti dell'intervento
                  </p>
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

      {/* PDF Viewer */}
      <PDFViewer
        isOpen={showPDFViewer}
        onClose={() => setShowPDFViewer(false)}
        pdfUrl={selectedInstallation?.pdfUrl}
        fileName={`installazione-${selectedInstallation?.serviceAppointmentId}.pdf`}
      />
    </div>
  );
}

