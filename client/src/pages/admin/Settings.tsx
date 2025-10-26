import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Key, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [googleMapsKey, setGoogleMapsKey] = useState("");
  const [salesforceWebhookUrl, setSalesforceWebhookUrl] = useState("");

  const utils = trpc.useUtils();
  const { data: configs, isLoading } = trpc.apiConfig.list.useQuery();

  const setConfigMutation = trpc.apiConfig.set.useMutation({
    onSuccess: () => {
      utils.apiConfig.list.invalidate();
      toast.success("Configurazione salvata con successo");
    },
    onError: (error) => {
      toast.error(error.message || "Errore nel salvataggio della configurazione");
    },
  });

  useEffect(() => {
    if (configs) {
      const googleMaps = configs.find((c) => c.configKey === "google_maps_api_key");
      const salesforce = configs.find((c) => c.configKey === "salesforce_webhook_url");

      if (googleMaps) setGoogleMapsKey(googleMaps.configValue);
      if (salesforce) setSalesforceWebhookUrl(salesforce.configValue);
    }
  }, [configs]);

  const handleSaveGoogleMaps = () => {
    setConfigMutation.mutate({
      configKey: "google_maps_api_key",
      configValue: googleMapsKey,
      description: "Google Maps API Key for calculating travel times",
    });
  };

  const handleSaveSalesforce = () => {
    setConfigMutation.mutate({
      configKey: "salesforce_webhook_url",
      configValue: salesforceWebhookUrl,
      description: "Salesforce Webhook URL for sending scheduled installation data",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurazione</h1>
          <p className="text-muted-foreground mt-2">
            Gestisci le chiavi API e le configurazioni di integrazione
          </p>
        </div>

        <div className="grid gap-6">
          {/* Google Maps API Key */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Google Maps API Key
              </CardTitle>
              <CardDescription>
                Chiave API di Google Maps per calcolare i tempi di viaggio tra l'indirizzo di partenza del partner e il luogo dell'installazione.
                Puoi ottenere questa chiave dalla{" "}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google Cloud Console
                </a>{" "}
                attivando le API "Distance Matrix API" e "Geocoding API".
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleMapsKey">API Key</Label>
                <Input
                  id="googleMapsKey"
                  type="password"
                  placeholder="AIzaSy..."
                  value={googleMapsKey}
                  onChange={(e) => setGoogleMapsKey(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSaveGoogleMaps}
                disabled={setConfigMutation.isPending || !googleMapsKey}
              >
                {setConfigMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Salva Google Maps API Key
              </Button>
            </CardContent>
          </Card>

          {/* Salesforce Webhook URL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Salesforce Webhook URL
              </CardTitle>
              <CardDescription>
                URL dell'endpoint Salesforce dove il portale invierà i dati di schedulazione (data inizio, data fine, team ID, partner ID) quando un partner schedula un'installazione.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salesforceWebhookUrl">Webhook URL</Label>
                <Input
                  id="salesforceWebhookUrl"
                  type="url"
                  placeholder="https://your-salesforce-instance.com/services/apexrest/..."
                  value={salesforceWebhookUrl}
                  onChange={(e) => setSalesforceWebhookUrl(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSaveSalesforce}
                disabled={setConfigMutation.isPending || !salesforceWebhookUrl}
              >
                {setConfigMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Salva Salesforce Webhook URL
              </Button>
            </CardContent>
          </Card>

          {/* Webhook Endpoint Info */}
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Webhook (Salesforce → Portale)</CardTitle>
              <CardDescription>
                Configura Salesforce per inviare i dati delle installazioni al seguente endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Endpoint URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/api/webhook/salesforce`}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/webhook/salesforce`);
                      toast.success("URL copiato negli appunti");
                    }}
                  >
                    Copia
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Metodo: <span className="font-mono">POST</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

