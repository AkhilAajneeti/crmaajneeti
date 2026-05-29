import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import Settings from "./pages/settings";
import IntegrationsPage from "./pages/integrations";
import DealsPage from "./pages/deals";
// import ContactsPage from "./pages/contacts";
import LoginPage from "./pages/login";
import AccountsPage from "./pages/accounts";
import Dashboard from "./pages/dashboard";
import Reports from "./pages/reports";
import Activities from "./pages/activities";
import Profile from "pages/profile";
import Login from "./pages/login";
import ProtectedRoute from "routes/ProtectedRoute";
import EntityRouter from "routes/EntityRouter";
import TaskPage from "pages/tasks";
import MeetingPage from "pages/meeting";
import CallPage from "./pages/call";
import Pipeline from "pages/pipeline";

import SalesTeam from "pages/sales-team";
import Attendance from "pages/attendance";
import WorkPlace from "pages/workplaceNotes";
import Complaints from "pages/complaints";
import KnowledgeBase from "pages/knowledgeBase";
const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Define your route here */}
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute permission="userPermission">
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/integrations"
            element={
              <ProtectedRoute>
                <IntegrationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leads"
            element={
              <ProtectedRoute entity="Lead">
                <DealsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales-team"
            element={
              <ProtectedRoute entity="Contact">
                <SalesTeam />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/accounts"
            element={
              <ProtectedRoute entity="Account">
                <AccountsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute entity="Task">
                <TaskPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <ProtectedRoute>
                <Activities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meeting"
            element={
              <ProtectedRoute entity="Meeting">
                <MeetingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <CallPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pipeline"
            element={
              <ProtectedRoute entity="Lead">
                <Pipeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute entity="CAttendanceRequest">
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Pipeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workplace"
            element={
              <ProtectedRoute entity="CWorkplaceNotes">
                <WorkPlace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaints"
            element={
              <ProtectedRoute entity="Case">
                <Complaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge-base"
            element={
              <ProtectedRoute entity="KnowledgeBaseArticle">
                <KnowledgeBase />
              </ProtectedRoute>
            }
          />
          {/* EspoCRM-style deep links: /<EntityName>/<action>[/:id] */}
          <Route
            path="/:entity/:action/:id"
            element={
              <ProtectedRoute>
                <EntityRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:entity/:action"
            element={
              <ProtectedRoute>
                <EntityRouter />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
