import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import { useLicenseStore } from "./store/licenseStore";
import { usePromptStore } from "./store/promptStore";
import Login from "./ui/Login";
import License from "./ui/License";
import TranscriptInput from "./ui/TranscriptInput";
import ResultsView from "./ui/ResultsView";
import Settings from "./ui/Settings";

function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0f0f0f",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid #333",
          borderTop: "3px solid #667eea",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: "#666", fontSize: 13 }}>読み込み中...</p>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LicenseGuard({ children }: { children: React.ReactNode }) {
  const { checked } = useLicenseStore();

  if (!checked) return <Navigate to="/license" replace />;
  return <>{children}</>;
}

export default function App() {
  const { initialize } = useAuthStore();
  const { loadFromStorage: loadPrompts } = usePromptStore();

  useEffect(() => {
    initialize();
    loadPrompts();
  }, [initialize, loadPrompts]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/license"
          element={
            <AuthGuard>
              <License />
            </AuthGuard>
          }
        />
        <Route
          path="/app"
          element={
            <AuthGuard>
              <LicenseGuard>
                <TranscriptInput />
              </LicenseGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/results"
          element={
            <AuthGuard>
              <LicenseGuard>
                <ResultsView />
              </LicenseGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <Settings />
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
