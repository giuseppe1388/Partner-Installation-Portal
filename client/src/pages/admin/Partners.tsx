import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PartnersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: partners, isLoading } = trpc.partners.list.useQuery();

  const createMutation = trpc.partners.create.useMutation({
    onSuccess: () => {
      utils.partners.list.invalidate();
      setIsCreateDialogOpen(false);
      toast.success("Partner creato con successo");
    },
    onError: (error) => {
      toast.error(error.message || "Errore nella creazione del partner");
    },
  });

  const updateMutation = trpc.partners.update.useMutation({
    onSuccess: () => {
      utils.partners.list.invalidate();
      setIsEditDialogOpen(false);
      setSelectedPartner(null);
      toast.success("Partner aggiornato con successo");
    },
    onError: (error) => {
      toast.error(error.message || "Errore nell'aggiornamento del partner");
    },
  });

  const deleteMutation = trpc.partners.delete.useMutation({
    onSuccess: () => {
      utils.partners.list.invalidate();
      toast.success("Partner eliminato con successo");
    },
    onError: (error) => {
      toast.error(error.message || "Errore nell'eliminazione del partner");
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      salesforcePartnerId: formData.get("salesforcePartnerId") as string,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      startingAddress: formData.get("startingAddress") as string,
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPartner) return;
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    updateMutation.mutate({
      id: selectedPartner.id,
      salesforcePartnerId: formData.get("salesforcePartnerId") as string,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      startingAddress: formData.get("startingAddress") as string,
      username: formData.get("username") as string,
      ...(password ? { password } : {}),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questo partner?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Partner</h1>
            <p className="text-muted-foreground mt-2">
              Gestisci i partner e le loro credenziali di accesso
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Partner
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Salesforce ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      Nessun partner trovato. Crea il primo partner per iniziare.
                    </TableCell>
                  </TableRow>
                ) : (
                  partners?.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell className="font-mono text-sm">{partner.salesforcePartnerId}</TableCell>
                      <TableCell>{partner.username}</TableCell>
                      <TableCell>{partner.email || "-"}</TableCell>
                      <TableCell>{partner.phone || "-"}</TableCell>
                      <TableCell>
                        {partner.isActive ? (
                          <Badge variant="default">Attivo</Badge>
                        ) : (
                          <Badge variant="secondary">Inattivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPartner(partner);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(partner.id)}
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
            <DialogTitle>Crea Nuovo Partner</DialogTitle>
            <DialogDescription>
              Inserisci i dati del partner e le credenziali di accesso
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salesforcePartnerId">Salesforce Partner ID *</Label>
                  <Input
                    id="salesforcePartnerId"
                    name="salesforcePartnerId"
                    placeholder="es. 001XXXXXXXX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Nome azienda"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@esempio.it"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+39 123 456 7890"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startingAddress">Indirizzo di Partenza</Label>
                <Input
                  id="startingAddress"
                  name="startingAddress"
                  placeholder="Via, Città, CAP"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crea Partner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifica Partner</DialogTitle>
            <DialogDescription>
              Aggiorna i dati del partner (lascia la password vuota per non modificarla)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-salesforcePartnerId">Salesforce Partner ID *</Label>
                  <Input
                    id="edit-salesforcePartnerId"
                    name="salesforcePartnerId"
                    defaultValue={selectedPartner?.salesforcePartnerId}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={selectedPartner?.name}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={selectedPartner?.email}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefono</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    defaultValue={selectedPartner?.phone}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-startingAddress">Indirizzo di Partenza</Label>
                <Input
                  id="edit-startingAddress"
                  name="startingAddress"
                  defaultValue={selectedPartner?.startingAddress}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username">Username *</Label>
                  <Input
                    id="edit-username"
                    name="username"
                    defaultValue={selectedPartner?.username}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">Nuova Password (opzionale)</Label>
                  <Input
                    id="edit-password"
                    name="password"
                    type="password"
                    placeholder="Lascia vuoto per non modificare"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
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

