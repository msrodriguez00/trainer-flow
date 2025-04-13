
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface SignupFormProps {
  onSignup: (name: string, email: string, password: string, trainerId: string | null) => Promise<void>;
  loading: boolean;
  trainers: { id: string; name: string }[];
  initialEmail?: string;
  preselectedTrainer?: string | null;
  isInvitation?: boolean;
}

export const SignupForm = ({
  onSignup,
  loading,
  trainers,
  initialEmail = "",
  preselectedTrainer = null,
  isInvitation = false,
}: SignupFormProps) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState(preselectedTrainer);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
      });
      return;
    }
    
    if (!selectedTrainer && trainers.length > 0 && !isInvitation) {
      toast({
        variant: "destructive",
        title: "Entrenador requerido",
        description: "Por favor selecciona un entrenador",
      });
      return;
    }
    
    await onSignup(name, email, password, selectedTrainer);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <div className="grid gap-1">
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            placeholder="Nombre completo"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            placeholder="correo@ejemplo.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={!!isInvitation}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {trainers.length > 0 && !preselectedTrainer && (
          <div className="grid gap-1">
            <Label htmlFor="trainer">Entrenador</Label>
            <Select onValueChange={setSelectedTrainer}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un entrenador" />
              </SelectTrigger>
              <SelectContent>
                {trainers.map((trainer) => (
                  <SelectItem key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            "Crear cuenta"
          )}
        </Button>
      </div>
    </form>
  );
};
