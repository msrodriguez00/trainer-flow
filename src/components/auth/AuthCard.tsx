
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AuthCardProps {
  type: "sign-in" | "sign-up";
  onTypeChange: (type: "sign-in" | "sign-up") => void;
  children: React.ReactNode;
  from?: string;
}

export const AuthCard = ({ type, onTypeChange, children, from }: AuthCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="w-[400px]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">
          {type === "sign-in" ? "Iniciar sesión" : "Crear una cuenta"}
        </CardTitle>
        <CardDescription>
          {type === "sign-in"
            ? "Inicia sesión con tu correo electrónico y contraseña"
            : "Crea una cuenta para acceder a la plataforma"}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Tabs defaultValue={type} className="space-y-4">
          <TabsList>
            <TabsTrigger value="sign-in" onClick={() => onTypeChange("sign-in")}>
              Iniciar sesión
            </TabsTrigger>
            <TabsTrigger value="sign-up" onClick={() => onTypeChange("sign-up")}>
              Crear cuenta
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in">
            {children}
          </TabsContent>
          <TabsContent value="sign-up">
            {children}
          </TabsContent>
        </Tabs>
        
        <div className="text-center border-t pt-4 mt-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/client-login")}
            className="w-full"
          >
            <Users className="mr-2 h-4 w-4" />
            Acceso para clientes
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Usa esta opción si eres cliente de un entrenador
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {from && (
          <Button variant="ghost" onClick={() => navigate(from)}>
            Volver
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
