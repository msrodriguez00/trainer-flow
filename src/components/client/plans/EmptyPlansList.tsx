
import React from "react";
import { ClipboardList } from "lucide-react";

const EmptyPlansList: React.FC = () => {
  return (
    <div className="text-center py-6 px-4">
      <ClipboardList className="mx-auto h-10 w-10 text-gray-400 mb-2" />
      <p className="text-gray-500">
        No tienes planes asignados todavía.
      </p>
      <p className="text-sm text-gray-400 mt-1">
        Los planes de entrenamiento aparecerán aquí cuando tu entrenador los asigne.
      </p>
    </div>
  );
};

export default EmptyPlansList;
