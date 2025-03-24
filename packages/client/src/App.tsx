import { Route, BrowserRouter, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./AuthContext";
import Home from "./Home";
import AuthLayout from "./AuthLayout";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthLayout />}>
            <Route path="/" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
