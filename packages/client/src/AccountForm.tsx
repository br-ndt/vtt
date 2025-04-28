import React, { useState } from "react";
import { useAuth } from "./AuthContext";

function LoginForm() {
  const { login, register } = useAuth();
  const [forLogin, setForLogin] = useState<boolean>(true);
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      if (username === "") {
        setError("No username entered");
        return;
      }
      if (password === "") {
        setError("No password entered");
        return;
      }
      if (forLogin) {
        await login(username, password);
      } else {
        if (password === passwordConfirm) {
          const res = await register(username, email, password);
          setForLogin(true);
          setMessage(res.message);
          setEmail("");
          setPasswordConfirm("");
        } else {
          setError("Password fields must match");
          return;
        }
      }
    } catch (err) {
      if (typeof err === "object") {
        setError(`Error logging in: ${(err as Error).message}`);
      } else {
        setError("Error logging in");
      }
      console.error(err);
    }
  };

  return (
    <div
      style={{ alignItems: "center", display: "flex", flexDirection: "column" }}
    >
      <h1>WONKGABE</h1>
      <h3>{forLogin ? "Login" : "Register"}</h3>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          height: "280px",
          width: "320px",
        }}
      >
        <div>
          <div style={{ display: "flex", gap: "8px" }}>
            <label style={{ flexGrow: 1, textAlign: "left" }}>Username</label>
            <input
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              value={username}
            />
          </div>
          {!forLogin && (
            <div style={{ display: "flex", gap: "8px" }}>
              <label style={{ flexGrow: 1, textAlign: "left" }}>Email</label>
              <input
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                value={email}
              />
            </div>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <label style={{ flexGrow: 1, textAlign: "left" }}>Password</label>
            <input
              autoComplete={forLogin ? "current-password" : "new-password"}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              value={password}
            />
          </div>
          {forLogin ? (
            <div style={{ height: "24px" }} />
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <label style={{ flexGrow: 1, textAlign: "left" }}>
                Password Confirm
              </label>
              <input
                onChange={(e) => setPasswordConfirm(e.target.value)}
                type="password"
                value={passwordConfirm}
              />
            </div>
          )}
          {forLogin && <div style={{ height: "24px" }} />}
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", margin: "0 60px" }}
        >
          <button type="submit">{forLogin ? "Login" : "Register"}</button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setForLogin(!forLogin);
            }}
          >
            {forLogin ? "Register" : "Login"}
          </button>
          {error ? (
            <p style={{ color: "red" }}>{error ?? "\u00A0"}</p>
          ) : (
            <p style={{ color: "green" }}>{message ?? "\u00A0"}</p>
          )}
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
