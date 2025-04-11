import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInvitation, setIsInvitation] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<any | null>(null);
  const [trainers, setTrainers] = useState<{id: string, name: string}[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [defaultTab, setDefaultTab] = useState("login");
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    
    if (token && email) {
      setIsInvitation(true);
      setInvitationToken(token);
      setInvitationEmail(email);
      setEmail(email);
      setDefaultTab("register"); // Set to register tab for clients
      
      const fetchInvitationData = async () => {
        try {
          const { data, error } = await supabase
            .from("client_invitations")
            .select("*, profiles:trainer_id(name)")
            .eq("token", token)
            .eq("email", email)
            .single();
          
          if (error) throw error;
          
          if (data) {
            setInvitationData(data);
            
            const { data: clients } = await supabase
              .from("clients")
              .select("trainers")
              .eq("email", email);
              
            if (clients && clients.length > 0) {
              const trainerIds = clients[0].trainers || [];
              if (trainerIds.length > 0) {
                const { data: trainerProfiles } = await supabase
                  .from("profiles")
                  .select("id, name")
                  .in("id", trainerIds);
                  
                if (trainerProfiles) {
                  setTrainers(trainerProfiles);
                  if (!trainerIds.includes(data.trainer_id)) {
                    setTrainers(prev => [...prev, {
                      id: data.trainer_id,
                      name: data.profiles?.name || "Entrenador"
                    }]);
                  }
                  setSelectedTrainer(data.trainer_id);
                  setDefaultTab("login"); // Set to login tab since client exists
                }
              }
            }
          }
        } catch (error) {
          console.error("Error fetching invitation:", error);
        }
      };
      
      fetchInvitationData();
    }
  }, [searchParams]);
  
  useEffect(() => {
    if (user && !isLoading) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, location]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message,
      });
    } else {
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo.",
      });
      
      if (isInvitation && selectedTrainer && invitationToken) {
        // This will be handled on the profile setup after logging in
        // We'll update the invitation status in the onAuthStateChange handler
      }
      
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          role: isInvitation ? 'client' : 'trainer',  // Set role based on invitation status
          tier: 'base',      // Set default tier to base
          registration_type: isInvitation ? 'invitation' : 'direct',
        }
      }
    });

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message,
      });
    } else {
      if (isInvitation && invitationToken && invitationData) {
        try {
          await supabase.from("clients").insert({
            email,
            name: name || email.split('@')[0],
            trainer_id: invitationData.trainer_id,
            trainers: [invitationData.trainer_id]
          });
          
          await supabase
            .from("client_invitations")
            .update({ accepted: true })
            .eq("id", invitationData.id);
            
          toast({
            title: "Registro exitoso",
            description: "Tu cuenta ha sido creada y vinculada a tu entrenador.",
          });
        } catch (err) {
          console.error("Error handling invitation acceptance:", err);
        }
      } else {
        toast({
          title: "Registro exitoso",
          description: "Por favor verifica tu correo electrónico para confirmar tu cuenta.",
        });
      }
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Dumbbell className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {isInvitation ? "ElevateFit Clientes" : "ElevateFit Entrenadores"}
          </CardTitle>
          <CardDescription>
            {isInvitation 
              ? `Invitado por ${invitationData?.profiles?.name || "un entrenador"}`
              : "Plataforma exclusiva para entrenadores personales"
            }
          </CardDescription>
        </CardHeader>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
            <TabsTrigger value="register">
              {isInvitation ? "Registrarse como cliente" : "Registrarse como entrenador"}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isInvitation && invitationEmail !== null}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                {isInvitation && trainers.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="trainer">Entrenador</Label>
                    <Select 
                      value={selectedTrainer || undefined} 
                      onValueChange={setSelectedTrainer}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu entrenador" />
                      </SelectTrigger>
                      <SelectContent>
                        {trainers.map(trainer => (
                          <SelectItem key={trainer.id} value={trainer.id}>
                            {trainer.name || "Entrenador"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Selecciona con cuál entrenador quieres iniciar sesión
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Procesando..." : "Iniciar sesión"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isInvitation && invitationEmail !== null}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    {isInvitation
                      ? "Al registrarte, estarás vinculado con el entrenador que te invitó."
                      : "Al registrarse, obtendrás acceso como entrenador con plan básico. Podrás actualizar a planes superiores más tarde."
                    }
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Procesando..." : (isInvitation ? "Registrarse como cliente" : "Registrarse como entrenador")}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
