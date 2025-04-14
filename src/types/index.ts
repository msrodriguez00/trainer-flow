
export type Session = {
  id: string;
  name: string;
  orderIndex: number;
  series: Series[];
  scheduledDate?: string;  // Make this optional to maintain backward compatibility
};
