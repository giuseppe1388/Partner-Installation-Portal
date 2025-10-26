import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, Mail, MapPin, FileText } from "lucide-react";
import { toast } from "sonner";

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

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-500", text: "text-white", label: "In Attesa" },
  scheduled: { bg: "bg-blue-600", text: "text-white", label: "Schedulato" },
  confirmed: { bg: "bg-purple-600", text: "text-white", label: "Confermato" },
  in_progress: { bg: "bg-orange-600", text: "text-white", label: "In Corso" },
  completed: { bg: "bg-green-600", text: "text-white", label: "Completato" },
  cancelled: { bg: "bg-red-600", text: "text-white", label: "Annullato" },
};

interface InstallationsProps {
  partner: any;
}

export default function Installations({ partner }: InstallationsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const utils = trpc.useUtils();

  const { data: installations = [], isLoading } = trpc.partner.getInstallations.useQuery(
    { partnerId: partner.id },
    { enabled: !!partner.id }
  );

  const changeStatusMutation = trpc.partner.changeStatus.useMutation({
    onSuccess: () => {
      toast.success("Stato aggiornato con successo");
      setSelectedInstallation(null);
      setNewStatus("");
    },
    onError: (error) => {
      toast.error(error.message || "Errore nell'aggiornamento dello stato");
    },
  });

  const rejectMutation = trpc.partner.rejectInstallation.useMutation({
    onSuccess: () => {
      utils.partner.getInstallations.invalidate();
      toast.success("Incarico rifiutato con successo");
      setShowRejectDialog(false);
      setSelectedInstallation(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore nel rifiuto dell'incarico");
    },
  });

  // Filtra e ricerca installazioni
  const filteredInstallations = useMemo(() => {
    return installations.filter((inst: Installation) => {
      const matchesStatus = statusFilter === "all" || inst.status === statusFilter;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        inst.customerName.toLowerCase().includes(searchLower) ||
        inst.customerPhone?.toLowerCase().includes(searchLower) ||
        inst.customerEmail?.toLowerCase().includes(searchLower) ||
        inst.installationAddress.toLowerCase().includes(searchLower) ||
        inst.customerCF?.toLowerCase().includes(searchLower);

      return matchesStatus && matchesSearch;
    });
  }, [installations, statusFilter, searchQuery]);

  const handleChangeStatus = (installation: Installation) => {
    setSelectedInstallation(installation);
    setNewStatus(installation.status);
  };

  const handleView = (installation: Installation) => {
    setSelectedInstallation(installation);
    setShowViewDialog(true);
  };

  const handleEdit = (installation: Installation) => {
    setSelectedInstallation(installation);
    setShowEditDialog(true);
  };

  const handleReject = (installation: Installation) => {
    setSelectedInstallation(installation);
    setShowRejectDialog(true);
  };

  const handleSaveStatus = () => {
    if (!selectedInstallation || !newStatus) return;

    changeStatusMutation.mutate({
      installationId: selectedInstallation.id,
      status: newStatus as any,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label className="text-sm font-medium">Ricerca</Label>
          <Input
            placeholder="Cerca per nome, telefono, email, indirizzo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="w-48">
          <Label className="text-sm font-medium">Filtro Stato</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="pending">In Attesa</SelectItem>
                <SelectItem value="scheduled">Schedulato</SelectItem>
                <SelectItem value="confirmed">Confermato</SelectItem>
                <SelectItem value="in_progress">In Corso</SelectItem>
                <SelectItem value="completed">Completato</SelectItem>
                <SelectItem value="cancelled">Annullato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="w-[150px]">Cliente</TableHead>
              <TableHead className="w-[120px]">Telefono</TableHead>
              <TableHead className="w-[200px]">Indirizzo</TableHead>
              <TableHead className="w-[80px]">Durata</TableHead>
              <TableHead className="w-[140px]">Inizio</TableHead>
              <TableHead className="w-[140px]">Fine</TableHead>
              <TableHead className="w-[100px]">Stato</TableHead>
              <TableHead className="w-[280px]">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInstallations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nessuna installazione trovata
                </TableCell>
              </TableRow>
            ) : (
              filteredInstallations.map((inst: Installation) => (
                <TableRow key={inst.id}>
                  <TableCell className="font-medium">{inst.customerName}</TableCell>
                  <TableCell>
                    {inst.customerPhone ? (
                      <a href={`tel:${inst.customerPhone}`} className="text-primary underline flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {inst.customerPhone}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{inst.installationAddress}</TableCell>
                  <TableCell>{inst.durationMinutes ? `${inst.durationMinutes} min` : "-"}</TableCell>
                  <TableCell className="text-sm">
                    {inst.scheduledStart ? new Date(inst.scheduledStart).toLocaleString('it-IT') : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {inst.scheduledEnd ? new Date(inst.scheduledEnd).toLocaleString('it-IT') : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${STATUS_COLORS[inst.status]?.bg || "bg-gray-100"} ${STATUS_COLORS[inst.status]?.text || "text-black"}`}>
                      {STATUS_COLORS[inst.status]?.label || inst.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(inst)}
                      >
                        Visualizza
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(inst)}
                      >
                        Modifica
                      </Button>
                      {inst.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(inst)}
                        >
                          Rifiuta
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Cambio Stato */}
      <Dialog open={!!selectedInstallation} onOpenChange={(open) => !open && setSelectedInstallation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambia Stato Installazione</DialogTitle>
            <DialogDescription>
              {selectedInstallation?.customerName} - {selectedInstallation?.installationAddress}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nuovo Stato</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">In Attesa</SelectItem>
                  <SelectItem value="scheduled">Schedulato</SelectItem>
                  <SelectItem value="confirmed">Confermato</SelectItem>
                  <SelectItem value="in_progress">In Corso</SelectItem>
                  <SelectItem value="completed">Completato</SelectItem>
                  <SelectItem value="cancelled">Annullato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newStatus === 'scheduled' || newStatus === 'confirmed') && (
              <>
                <div>
                  <Label>Data e Ora di Inizio</Label>
                  <input
                    type="datetime-local"
                    className="w-full mt-2 px-3 py-2 border rounded-md"
                    value={selectedInstallation?.scheduledStart ? new Date(selectedInstallation.scheduledStart).toISOString().slice(0, 16) : ""}
                    onChange={(e) => {
                      if (selectedInstallation) {
                        setSelectedInstallation({
                          ...selectedInstallation,
                          scheduledStart: new Date(e.target.value).toISOString()
                        });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>Data e Ora di Fine</Label>
                  <input
                    type="datetime-local"
                    className="w-full mt-2 px-3 py-2 border rounded-md"
                    value={selectedInstallation?.scheduledEnd ? new Date(selectedInstallation.scheduledEnd).toISOString().slice(0, 16) : ""}
                    onChange={(e) => {
                      if (selectedInstallation) {
                        setSelectedInstallation({
                          ...selectedInstallation,
                          scheduledEnd: new Date(e.target.value).toISOString()
                        });
                      }
                    }}
                  />
                </div>
              </>
            )}

            {selectedInstallation && (
              <div className="bg-muted p-3 rounded space-y-2 text-sm">
                <div>
                  <span className="font-medium">Cliente:</span> {selectedInstallation.customerName}
                </div>
                {selectedInstallation.customerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    <a href={`tel:${selectedInstallation.customerPhone}`} className="text-primary underline">
                      {selectedInstallation.customerPhone}
                    </a>
                  </div>
                )}
                {selectedInstallation.customerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    <a href={`mailto:${selectedInstallation.customerEmail}`} className="text-primary underline">
                      {selectedInstallation.customerEmail}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  {selectedInstallation.installationAddress}
                </div>
                {selectedInstallation.technicalNotes && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-3 h-3 mt-1" />
                    <span>{selectedInstallation.technicalNotes}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInstallation(null)}>
              Annulla
            </Button>
            <Button onClick={handleSaveStatus} disabled={changeStatusMutation.isPending}>
              {changeStatusMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                "Salva"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualizza */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dettagli Installazione</DialogTitle>
            <DialogDescription>
              {selectedInstallation?.customerName} - {selectedInstallation?.installationAddress}
            </DialogDescription>
          </DialogHeader>
          {selectedInstallation && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Cliente:</span>
                <p>{selectedInstallation.customerName}</p>
              </div>
              <div>
                <span className="font-semibold">Stato:</span>
                <Badge className={`${STATUS_COLORS[selectedInstallation.status]?.bg || "bg-gray-100"} ${STATUS_COLORS[selectedInstallation.status]?.text || "text-black"}`}>
                  {STATUS_COLORS[selectedInstallation.status]?.label || selectedInstallation.status}
                </Badge>
              </div>
              <div className="col-span-2">
                <span className="font-semibold">Indirizzo Installazione:</span>
                <p>{selectedInstallation.installationAddress}</p>
              </div>
              {selectedInstallation.customerPhone && (
                <div>
                  <span className="font-semibold">Telefono:</span>
                  <p>{selectedInstallation.customerPhone}</p>
                </div>
              )}
              {selectedInstallation.customerEmail && (
                <div>
                  <span className="font-semibold">Email:</span>
                  <p>{selectedInstallation.customerEmail}</p>
                </div>
              )}
              {selectedInstallation.technicalNotes && (
                <div className="col-span-2">
                  <span className="font-semibold">Note Tecniche:</span>
                  <p>{selectedInstallation.technicalNotes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Installazione</DialogTitle>
            <DialogDescription>
              Modifica i dettagli dell'installazione
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Funzionalità in sviluppo...</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Annulla</Button>
            <Button onClick={() => setShowEditDialog(false)}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rifiuta */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rifiuta Incarico</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler rifiutare l'incarico per {selectedInstallation?.customerName}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivazione (obbligatoria, minimo 10 caratteri):</Label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full mt-2 px-3 py-2 border rounded-md"
                rows={4}
                placeholder="Inserisci la motivazione del rifiuto..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {rejectionReason.length}/10 caratteri minimi
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectDialog(false);
              setRejectionReason('');
            }}>Annulla</Button>
            <Button 
              variant="destructive"
              disabled={rejectionReason.trim().length < 10 || rejectMutation.isPending}
              onClick={() => {
                if (selectedInstallation && rejectionReason.trim().length >= 10) {
                  rejectMutation.mutate({
                    installationId: selectedInstallation.id,
                    rejectionReason: rejectionReason.trim(),
                  });
                }
              }}
            >
              {rejectMutation.isPending ? 'Rifiuto in corso...' : 'Conferma Rifiuto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

