
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import IndexRedirect from "./IndexRedirect";

// Pages
import Auth from "@/pages/Auth";
import ClientLogin from "@/pages/ClientLogin";
import Profile from "@/pages/Profile";
import Exercises from "@/pages/Exercises";
import ExerciseLibrary from "@/pages/ExerciseLibrary";
import Clients from "@/pages/Clients";
import ClientDetails from "@/pages/ClientDetails";
import ClientInvite from "@/pages/ClientInvite";
import Plans from "@/pages/Plans";
import PlanDetails from "@/pages/PlanDetails";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientPlans from "@/pages/ClientPlans";
import ClientPlanDetail from "@/pages/ClientPlanDetail";
import AdminDashboard from "@/pages/AdminDashboard";
import TrainerDashboard from "@/pages/TrainerDashboard";
import NotFound from "@/pages/NotFound";
import NewPlanPage from "@/pages/NewPlanPage";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/client-login" element={<ClientLogin />} />
        <Route path="/" element={
          <ProtectedRoute>
            <IndexRedirect />
          </ProtectedRoute>
        } />
        <Route path="/trainer-dashboard" element={
          <ProtectedRoute trainerOnly>
            <TrainerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/exercises" element={
          <ProtectedRoute trainerOnly>
            <Exercises />
          </ProtectedRoute>
        } />
        <Route path="/library" element={
          <ProtectedRoute trainerOnly>
            <ExerciseLibrary />
          </ProtectedRoute>
        } />
        <Route path="/clients" element={
          <ProtectedRoute trainerOnly>
            <Clients />
          </ProtectedRoute>
        } />
        <Route path="/clients/:id" element={
          <ProtectedRoute trainerOnly>
            <ClientDetails />
          </ProtectedRoute>
        } />
        <Route path="/client-invite" element={
          <ProtectedRoute trainerOnly>
            <ClientInvite />
          </ProtectedRoute>
        } />
        <Route path="/plans" element={
          <ProtectedRoute trainerOnly>
            <Plans />
          </ProtectedRoute>
        } />
        <Route path="/plans/new" element={
          <ProtectedRoute trainerOnly>
            <NewPlanPage />
          </ProtectedRoute>
        } />
        <Route path="/plans/:id" element={
          <ProtectedRoute trainerOnly>
            <PlanDetails />
          </ProtectedRoute>
        } />
        <Route path="/client-dashboard" element={
          <ProtectedRoute clientOnly>
            <ClientDashboard />
          </ProtectedRoute>
        } />
        <Route path="/client-plans" element={
          <ProtectedRoute clientOnly>
            <ClientPlans />
          </ProtectedRoute>
        } />
        <Route path="/client-plan/:id" element={
          <ProtectedRoute clientOnly>
            <ClientPlanDetail />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
