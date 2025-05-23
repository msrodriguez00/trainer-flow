
import { useNavigate, useLocation } from "react-router-dom";
import { Dumbbell, Users, ClipboardList, Home, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isClient, isAdmin, isTrainer, profile } = useAuth();
  
  // Definir las rutas específicas para planes según el tipo de usuario
  const plansPath = isClient ? "/client-plans" : "/plans";
  
  // Definir los elementos de navegación según el rol del usuario
  const navItems = [
    { 
      path: isClient ? "/client-dashboard" : isTrainer ? "/trainer-dashboard" : isAdmin ? "/admin" : "/", 
      icon: Home, 
      label: "Dashboard", 
      showFor: "all" 
    },
    { path: "/exercises", icon: Dumbbell, label: "Ejercicios", showFor: "trainer" },
    { path: "/library", icon: BookOpen, label: "Biblioteca", showFor: "trainer" },
    { path: "/clients", icon: Users, label: "Clientes", showFor: "trainer" },
    { 
      path: plansPath,
      icon: ClipboardList, 
      label: "Planes", 
      showFor: "all" 
    },
  ];

  // Filtrar los elementos de navegación según el rol del usuario
  const filteredNavItems = navItems.filter(item => {
    if (item.showFor === "all") return true;
    if (item.showFor === "trainer" && (isTrainer || isAdmin)) return true;
    return false;
  });

  // Function to check if a nav item is active
  const isNavItemActive = (path: string) => {
    // Para el cliente, considerar tanto /client-dashboard como / como la misma página
    if (isClient && path === "/client-dashboard" && location.pathname === "/") {
      return true;
    }
    
    // Para el tab de planes de clientes, considerar equivalentes client-plans y client-dashboard
    if (isClient && path === "/client-plans" && location.pathname === "/client-plans") {
      return true;
    }
    
    // Comparación exacta de rutas para todos los demás casos
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Dumbbell className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-gray-800">ElevateFit</span>
              {isTrainer && profile?.tier && (
                <span className={cn(
                  "ml-2 text-xs px-2 py-1 rounded-full",
                  profile.tier === "pro" ? "bg-red-100 text-red-800" : 
                  profile.tier === "light" ? "bg-blue-100 text-blue-800" : 
                  "bg-gray-100 text-gray-800"
                )}>
                  {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}
                </span>
              )}
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {filteredNavItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                    isNavItemActive(item.path)
                      ? "border-primary text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  )}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center">
            <UserMenu />
          </div>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-around">
          {filteredNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center py-2 px-3",
                isNavItemActive(item.path)
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
