import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { APP_TITLE, APP_LOGO } from "@/const";

interface LoginProps {
  onLoginSuccess: (partner: any) => void;
}

export default function PartnerLogin({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.partner.login.useMutation({
    onSuccess: (partner) => {
      toast.success(`Benvenuto, ${partner.name}!`);
      // Store partner data in localStorage
      localStorage.setItem("partner", JSON.stringify(partner));
      onLoginSuccess(partner);
    },
    onError: (error) => {
      toast.error(error.message || "Credenziali non valide");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            {APP_LOGO && (
              <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 rounded-lg" />
            )}
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">{APP_TITLE}</CardTitle>
            <CardDescription className="mt-2">
              Accedi al portale partner per gestire le tue installazioni
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Inserisci il tuo username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Inserisci la tua password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Accedi
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

