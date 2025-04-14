
import React from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";

export const EmptyPlanState: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <CardContent className="pt-6 px-6 pb-6">
      <div className="text-center py-12">
        <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Plan no encontrado</h3>
        <p className="text-gray-500 mb-6">
          El plan que buscas no existe o no tienes permiso para verlo
        </p>
        <Button onClick={() => navigate("/client-plans")}>
          Ver mis planes
        </Button>
      </div>
    </CardContent>
  );
};

export default EmptyPlanState;
