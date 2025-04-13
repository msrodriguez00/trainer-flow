
import React from 'react';
import { Client, Trainer } from './types';
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ClientTableProps {
  clients: Client[];
  trainers: Trainer[];
  loading: boolean;
  onEditClient: (client: Client) => void;
}

const ClientTable = ({ clients, trainers, loading, onEditClient }: ClientTableProps) => {
  // Function to get trainer names from trainer IDs
  const getTrainerNames = (trainerIds: string[] | null): string[] => {
    if (!trainerIds || trainerIds.length === 0) return [];
    
    return trainerIds.map(id => {
      const trainer = trainers.find(t => t.id === id);
      return trainer ? trainer.name : 'Entrenador desconocido';
    });
  };

  if (loading) {
    return <div className="text-center py-6">Cargando clientes...</div>;
  }

  if (clients.length === 0) {
    return <div className="text-center py-6">No se encontraron clientes</div>;
  }

  console.log("Renderizando tabla de clientes:", { clients, trainers });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Entrenadores Asignados</TableHead>
          <TableHead className="w-[100px] text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="font-medium">{client.name}</TableCell>
            <TableCell>{client.email}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {client.trainers && client.trainers.length > 0 ? (
                  getTrainerNames(client.trainers).map((name, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50">
                      {name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-500">Sin entrenadores</span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditClient(client)}
                title="Editar entrenadores asignados"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ClientTable;
