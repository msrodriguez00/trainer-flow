import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [type, setType] = useState<"sign-in" | "sign-up">("sign-in");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    
    if (token && email) {
      setType("sign-up");
      setEmail(email);
      
      const fetchInvitationData = async () => {
        try {
          // Fix the relation query to correctly fetch trainer name
          const { data, error } = await supabase
            .from("client_invitations")
            .select("*, trainer:trainer_id(name)")
            .eq("token", token)
            .eq("email", email)
            .single();
            
          if (error) throw error;
          
          if (data) {
            setInvitationData(data);
            
            // Check if client already exists
            const { data: existingClients, error: existingClientsError } = await supabase
              .from("clients")
              .select("*")
              .eq("email", email);
              
            if (existingClientsError) throw existingClientsError;
            
            if (existingClients && existingClients.length > 0) {
              toast({
                title: "Cliente ya registrado",
                description: "Ya estás registrado en el sistema. Por favor, inicia sesión.",
              });
              navigate("/sign-in");
              return;
            }
            
            // Fetch trainer profiles to display in the select
            const { data: trainerProfiles, error: trainerProfilesError } = await supabase
              .from("profiles")
              .select("id, name")
              .in("id", [data.trainer_id]);
              
            if (trainerProfilesError) throw trainerProfilesError;
            
            const trainerIds = trainers.map(trainer => trainer.id);
                
                if (trainerProfiles) {
                  setTrainers(trainerProfiles);
                  if (!trainerIds.includes(data.trainer_id)) {
                    setTrainers(prev => [...prev, {
                      id: data.trainer_id,
                      name: data.trainer?.name || "Entrenador"
                    }]);
                  }
                }
              
            setSelectedTrainer(data.trainer_id);
          }
        } catch (error) {
          console.error("Error fetching invitation:", error);
        }
      };
      
      fetchInvitationData();
    }
  }, [searchParams]);
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn({ email, password });
      toast({
        title: "Inicio de sesión exitoso",
        description: "¡Bienvenido de nuevo!",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!selectedTrainer && trainers.length > 0) {
        throw new Error("Por favor, selecciona un entrenador.");
      }
      
      await signUp({ email, password, name, trainerId: selectedTrainer || invitationData?.trainer_id });
      
      // Mark invitation as accepted
      if (invitationData) {
        const { error: acceptError } = await supabase
          .from("client_invitations")
          .update({ accepted: true })
          .eq("token", invitationData.token);
          
        if (acceptError) throw acceptError;
      }
      
      toast({
        title: "Registro exitoso",
        description: "¡Te has registrado correctamente!",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid h-screen place-items-center bg-gray-100">
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
              <TabsTrigger value="sign-in" onClick={() => setType("sign-in")}>
                Iniciar sesión
              </TabsTrigger>
              <TabsTrigger value="sign-up" onClick={() => setType("sign-up")}>
                Crear cuenta
              </TabsTrigger>
            </TabsList>
            <TabsContent value="sign-in">
              <form onSubmit={handleSignIn}>
                <div className="grid gap-2">
                  <div className="grid gap-1">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      placeholder="correo@ejemplo.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
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
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      "Iniciar sesión"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="sign-up">
              <form onSubmit={handleSignUp}>
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
                      disabled={!!invitationData}
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
                  {trainers.length > 0 && (
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
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          {location.state?.from && (
            <Button variant="ghost" onClick={() => navigate(location.state.from)}>
              Volver
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
