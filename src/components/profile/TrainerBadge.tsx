
import { Badge } from "@/components/ui/badge";

type TrainerBadgeProps = {
  isTrainer: boolean;
  trainerTier?: string | null;
};

const TrainerBadge = ({ isTrainer, trainerTier }: TrainerBadgeProps) => {
  if (!isTrainer || !trainerTier) return null;
  
  const tierVariant = {
    'base': 'default',
    'light': 'secondary',
    'pro': 'destructive'
  }[trainerTier] as 'default' | 'secondary' | 'destructive';
  
  return (
    <Badge variant={tierVariant} className="ml-2">
      {trainerTier.charAt(0).toUpperCase() + trainerTier.slice(1)}
    </Badge>
  );
};

export default TrainerBadge;
