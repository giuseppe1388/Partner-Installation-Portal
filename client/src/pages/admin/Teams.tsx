import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TeamsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: teams, isLoading } = trpc.teams.list.useQuery();
  const { data: partners } = trpc.partners.list.useQuery();

  const createMutation = trpc.teams.create.useMutation({
    onSuccess: () => {
      utils.teams.list.invalidate();
      setIsCreateDialogOpen(false);
      setSelectedPartnerId("");
      toast.success("Squadra creata con successo");
    },
    onError: (error) => {
      toast.error(error.message || "Errore nella creazione della squadra");
    },
  });

  const updateMutation = trpc.teams.update.useMutation({
    onSuccess: () => {
      utils.teams.list.invalidate();
      setIsEditDialogOpen(false);
      setSelectedTeam(null);
      toast.success("Squadra aggiornata con successo");
    },
    onError: (error) => {
      toast.error(error.message || "Errore nell'aggiornamento della squadra");
    },
  });

  const deleteMutation = trpc.teams.delete.useMutation({
    onSuccess: () => {
      utils.teams.list.invalidate();
      toast.success("Squadra eliminata con successo");
    },
    onError: (error) => {
      toast.error(error.message || "Errore nell'eliminazione della squadra");
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      salesforceTeamId: formData.get("salesforceTeamId") as string,
      partnerId: parseInt(selectedPartnerId),
      name: formData.get("name") as string,
      description: formData.get("description") as string,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTeam) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedTeam.id,
      salesforceTeamId: formData.get("salesforceTeamId") as string,
      partnerId: parseInt(selectedPartnerId),
      name: formData.get("name") as string,
      description: formData.get("description") as string,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questa squadra?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getPartnerName = (partnerId: number) => {
    return partners?.find((p) => p.id === partnerId)?.name || "N/A";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Squadre</h1>
            <p className="text-muted-foreground mt-2">
              Gestisci le squadre di installazione per ogni partner
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuova Squadra
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Squadra</TableHead>
                  <TableHead>Salesforce Team ID</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Descrizione</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      Nessuna squadra trovata. Crea la prima squadra per iniziare.
                    </TableCell>
                  </TableRow>
                ) : (
                  teams?.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell className="font-mono text-sm">{team.salesforceTeamId}</TableCell>
                      <TableCell>{getPartnerName(team.partnerId)}</TableCell>
                      <TableCell className="max-w-xs truncate">{team.description || "-"}</TableCell>
                      <TableCell>
                        {team.isActive ? (
                          <Badge variant="default">Attiva</Badge>
                        ) : (
                          <Badge variant="secondary">Inattiva</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTeam(team);
                              setSelectedPartnerId(team.partnerId.toString());
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(team.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crea Nuova Squadra</DialogTitle>
            <DialogDescription>
              Inserisci i dati della squadra e associala a un partner
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salesforceTeamId">Salesforce Team ID *</Label>
                  <Input
                    id="salesforceTeamId"
                    name="salesforceTeamId"
                    placeholder="es. T001XXXXXXXX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Squadra *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Squadra 1"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner">Partner *</Label>
                <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners?.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id.toString()}>
                        {partner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Descrizione della squadra"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !selectedPartnerId}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crea Squadra
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifica Squadra</DialogTitle>
            <DialogDescription>
              Aggiorna i dati della squadra
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-salesforceTeamId">Salesforce Team ID *</Label>
                  <Input
                    id="edit-salesforceTeamId"
                    name="salesforceTeamId"
                    defaultValue={selectedTeam?.salesforceTeamId}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome Squadra *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={selectedTeam?.name}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-partner">Partner *</Label>
                <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners?.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id.toString()}>
                        {partner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrizione</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={selectedTeam?.description}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !selectedPartnerId}>
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salva Modifiche
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

