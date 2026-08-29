import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AnalysisResultPage from "./pages/AnalysisResultPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import NewScreeningPage from "./pages/NewScreeningPage";
import ResourcePlanningPage from "./pages/ResourcePlanningPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SidebarProvider } from "./context/SidebarContext";
import { LanguageProvider } from "./context/LanguageContext";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <SidebarProvider>
            <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/new-screening" element={<NewScreeningPage />} />
                  <Route
                    path="/analysis-result/:id"
                    element={<AnalysisResultPage />}
                  />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route
                    element={<ProtectedRoute allowedRoles={['admin', 'clinician']} />}
                  >
                    <Route path="/resource-planning" element={<ResourcePlanningPage />} />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SidebarProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
