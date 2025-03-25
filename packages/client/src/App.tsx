import { Route, BrowserRouter, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./AuthContext";
import AuthLayout from "./AuthLayout";
import RoomLayout from "./RoomLayout";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthLayout />}>
            <Route path="/" element={<RoomLayout />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
