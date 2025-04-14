
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePlanForm } from "@/hooks/plan/usePlanForm";
import { SessionAccordion } from "./SessionAccordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlanFormProps {
  initialClientId?: string;
  onSubmit: (plan: any) => void;
}

// Array of months in Spanish
const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const PlanForm = ({ initialClientId, onSubmit }: PlanFormProps) => {
  const navigate = useNavigate();
  const {
    name,
    setName,
    clientId,
    setClientId,
    month,
    setMonth,
    clients,
    exercises,
    sessions,
    loading,
    
    addSession,
    removeSession,
    updateSessionName,
    
    addSeries,
    removeSeries,
    updateSeriesName,
    
    addExerciseToSeries,
    removeExerciseFromSeries,
    handleExerciseChange,
    handleLevelChange,
    
    handleSubmit
  } = usePlanForm(initialClientId, onSubmit);

  if (loading) {
    return <div className="text-center py-10">Cargando...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Crear Nuevo Plan</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Plan</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Plan de Fuerza Básico"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger id="client">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="month">Mes</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger id="month">
                <SelectValue placeholder="Seleccionar mes (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {months.map((monthName) => (
                  <SelectItem key={monthName} value={monthName}>
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SessionAccordion
          sessions={sessions}
          exercises={exercises}
          onSessionNameChange={updateSessionName}
          onRemoveSession={removeSession}
          onAddSeries={addSeries}
          onRemoveSeries={removeSeries}
          onSeriesNameChange={updateSeriesName}
          onAddExercise={addExerciseToSeries}
          onExerciseChange={handleExerciseChange}
          onLevelChange={handleLevelChange}
          onRemoveExercise={removeExerciseFromSeries}
          onAddSession={addSession}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit">Crear Plan</Button>
        </div>
      </form>
    </div>
  );
};

export default PlanForm;
