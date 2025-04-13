
import React, { useState } from 'react';
import { Client, Trainer } from '@/pages/AdminDashboard';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClientTrainerEditDialogProps {
  client: Client;
  trainers: Trainer[];
  onCancel: () => void;
  onSave: (clientId: string, trainerIds: string[]) => void;
}

const ClientTrainerEditDialog = ({
  client,
  trainers,
  onCancel,
  onSave,
}: ClientTrainerEditDialogProps) => {
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>(
    client.trainers || []
  );

  console.log("Dialog inicializado con:", { 
    clientName: client.name, 
    clientTrainers: client.trainers, 
    availableTrainers: trainers.length,
    selectedTrainers
  });

  const handleTrainerToggle = (trainerId: string) => {
    setSelectedTrainers((prev) =>
      prev.includes(trainerId)
        ? prev.filter((id) => id !== trainerId)
        : [...prev, trainerId]
    );
  };

  const handleSave = () => {
    console.log("Guardando entrenadores:", selectedTrainers);
    onSave(client.id, selectedTrainers);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Editar Entrenadores Asignados</DialogTitle>
        <DialogDescription>
          Selecciona los entrenadores para {client.name}
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4">
        <h3 className="mb-2 font-medium">Entrenadores disponibles:</h3>
        <ScrollArea className="h-72 rounded-md border p-4">
          {trainers.length === 0 ? (
            <p className="text-sm text-gray-500">No hay entrenadores disponibles</p>
          ) : (
            <div className="space-y-3">
              {trainers.map((trainer) => (
                <div key={trainer.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`trainer-${trainer.id}`}
                    checked={selectedTrainers.includes(trainer.id)}
                    onCheckedChange={() => handleTrainerToggle(trainer.id)}
                  />
                  <label
                    htmlFor={`trainer-${trainer.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {trainer.name || trainer.id}
                  </label>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSave}>
          Guardar Cambios
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ClientTrainerEditDialog;
