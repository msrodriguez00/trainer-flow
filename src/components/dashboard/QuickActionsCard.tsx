
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, BookOpen, ClipboardList, UserPlus, Mail } from "lucide-react";

interface QuickActionsCardProps {
  onCreateExercise: () => void;
  onGoToLibrary: () => void;
  onCreatePlan: () => void;
  onAddClient: () => void;
  onManageInvites: () => void;
}

const QuickActionsCard = ({
  onCreateExercise,
  onGoToLibrary,
  onCreatePlan,
  onAddClient,
  onManageInvites,
}: QuickActionsCardProps) => {
  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button
            onClick={onCreateExercise}
            variant="outline"
            className="w-full justify-start"
          >
            <Dumbbell className="mr-2 h-4 w-4" />
            Añadir ejercicio nuevo
          </Button>
          <Button
            onClick={onGoToLibrary}
            variant="outline"
            className="w-full justify-start"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Explorar biblioteca de ejercicios
          </Button>
          <Button
            onClick={onCreatePlan}
            variant="outline"
            className="w-full justify-start"
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Crear nuevo plan
          </Button>
          <Button
            onClick={onAddClient}
            variant="outline"
            className="w-full justify-start"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Añadir cliente
          </Button>
          <Button
            onClick={onManageInvites}
            variant="outline"
            className="w-full justify-start"
          >
            <Mail className="mr-2 h-4 w-4" />
            Gestionar invitaciones
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;
