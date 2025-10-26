import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function InstallationsPage() {
  const { data: installations, isLoading } = trpc.installations.list.useQuery();
  const { data: partners } = trpc.partners.list.useQuery();
  const { data: teams } = trpc.teams.list.useQuery();

  const getPartnerName = (partnerId: number | null) => {
    if (!partnerId) return "-";
    return partners?.find((p) => p.id === partnerId)?.name || "N/A";
  };

  const getTeamName = (teamId: number | null) => {
    if (!teamId) return "-";
    return teams?.find((t) => t.id === teamId)?.name || "N/A";
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Installazioni</h1>
          <p className="text-muted-foreground mt-2">
            Visualizza tutte le installazioni ricevute da Salesforce
          </p>
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
                  <TableHead>Cliente</TableHead>
                  <TableHead>Service Appointment ID</TableHead>
                  <TableHead>Indirizzo Installazione</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Squadra</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data Schedulata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installations?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      Nessuna installazione trovata. Le installazioni verranno visualizzate qui quando Salesforce invierà i webhook.
                    </TableCell>
                  </TableRow>
                ) : (
                  installations?.map((installation) => (
                    <TableRow key={installation.id}>
                      <TableCell className="font-medium">{installation.customerName}</TableCell>
                      <TableCell className="font-mono text-sm">{installation.serviceAppointmentId}</TableCell>
                      <TableCell className="max-w-xs truncate">{installation.installationAddress}</TableCell>
                      <TableCell>{getPartnerName(installation.partnerId)}</TableCell>
                      <TableCell>{getTeamName(installation.teamId)}</TableCell>
                      <TableCell>{getStatusBadge(installation.status)}</TableCell>
                      <TableCell>
                        {installation.scheduledStart
                          ? new Date(installation.scheduledStart).toLocaleString("it-IT")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

