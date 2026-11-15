import { BrowserRouter, Navigate, Routes, Route } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import { RequireAuth } from "./components/RequireAuth";
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { PatientsList } from "./components/PatientsList";
import { PatientsForm } from "./components/PatientsForm";
import { FoodsList } from "./components/FoodsList";
import { FoodsForm } from "./components/FoodsForm";
import { DietsList } from "./components/DietsList";
import { DietsForm } from "./components/DietsForm";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* Rotas internas: exigem login e usam o menu lateral (Layout) */}
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/pacientes" element={<PatientsList />} />
            <Route path="/pacientes/:id" element={<PatientsForm />} />

            <Route path="/alimentos" element={<FoodsList />} />
            <Route path="/alimentos/:id" element={<FoodsForm />} />

            <Route path="/dietas" element={<DietsList />} />
            <Route path="/dietas/:id" element={<DietsForm />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
