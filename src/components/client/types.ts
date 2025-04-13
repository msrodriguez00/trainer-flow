
export interface TrainerInvitation {
  id: string;
  email: string;
  trainer_id: string;
  trainer_name: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface InvitationResponse {
  accepted: boolean;
  invitationId: string;
  trainerId: string;
}
