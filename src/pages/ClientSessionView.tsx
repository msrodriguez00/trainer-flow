
import { useParams, useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/client/session/useSession";
import SessionView from "@/components/client/session/SessionView";
import ClientAuthError from "@/components/client/common/ClientAuthError";
import MainLayout from "@/components/client/layout/MainLayout";
import LoadingScreen from "@/components/client/common/LoadingScreen";
import { useEffect } from "react";

const ClientSessionView = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  // Redirect if no sessionId
  useEffect(() => {
    if (!sessionId) {
      navigate("/client-dashboard");
    }
  }, [sessionId, navigate]);
  
  // Use our session hook
  const session = useSession(sessionId || "");
  
  const handleExit = () => {
    navigate("/client-dashboard");
  };
  
  if (session.sessionState.loading) {
    return <LoadingScreen />;
  }
  
  if (session.sessionState.error) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="bg-destructive/10 border border-destructive rounded-md p-4">
            <h3 className="text-destructive font-medium mb-2">Error</h3>
            <p>{session.sessionState.error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <SessionView session={session} onExit={handleExit} />
    </MainLayout>
  );
};

export default ClientSessionView;
