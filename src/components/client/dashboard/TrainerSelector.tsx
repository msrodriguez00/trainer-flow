
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trainer } from "./types";

interface TrainerSelectorProps {
  trainers: Trainer[];
  selectedTrainerId: string;
  loading: boolean;
  onTrainerSelect: (trainerId: string) => void;
}

const TrainerSelector = ({
  trainers,
  selectedTrainerId,
  loading,
  onTrainerSelect,
}: TrainerSelectorProps) => {
  if (trainers.length <= 0) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-600">
        {trainers.length > 1 ? "Selecciona tu entrenador:" : "Tu entrenador:"}
      </p>
      
      {trainers.length > 1 ? (
        <Select
          value={selectedTrainerId}
          onValueChange={onTrainerSelect}
          disabled={loading}
        >
          <SelectTrigger className="w-full sm:w-[250px] bg-white border-gray-300">
            <SelectValue placeholder="Selecciona un entrenador" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {trainers.map((trainer) => (
              <SelectItem key={trainer.id} value={trainer.id}>
                {trainer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-gray-600 font-medium p-2 bg-white/50 rounded">
          {trainers[0]?.name || "Sin entrenador asignado"}
        </p>
      )}
      
      {loading && (
        <div className="text-sm text-gray-500">
          Cargando entrenadores...
        </div>
      )}
    </div>
  );
};

export default TrainerSelector;
