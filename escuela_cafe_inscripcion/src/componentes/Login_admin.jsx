import React, { useState } from "react";
import "./login_admin.css";
import AdminPanel from "./AdminPanel";
import AsistenciaPanel from "./AsistenciaPanel";

const Login_admin = () => {
  const [documento, setDocumento] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleLogin = async () => {
    if (!documento.trim()) {
      setMensaje({ texto: "Por favor ingrese su número de documento", tipo: "error" });
      return;
    }

    setLoading(true);
    setMensaje({ texto: "", tipo: "" });
    
    try {
      const response = await fetch(
        `https://apialohav2.crepesywaffles.com/buk/empleados2/${documento}`
      );


      if (response.ok) {
        const data = await response.json();
        setMensaje({ texto: "Documento validado correctamente", tipo: "success" });


        setTimeout(() => {
          setUserData(data);
          setIsAuthenticated(true);
        }, 1500);
        
      } else {
        const errorText = await response.text();
        setMensaje({ 
          texto: `Documento no autorizado (Error ${response.status})`, 
          tipo: "error" 
        });
      }
    } catch (error) {
      setMensaje({ texto: "Error de conexión al validar el documento", tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserData(null);
    setDocumento("");
    setMensaje({ texto: "", tipo: "" });
  };


  if (isAuthenticated) {
    const cargoUsuario = userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '';
    

    if (cargoUsuario === 'INSTRUCTOR') {
      return <AsistenciaPanel userData={userData} onLogout={handleLogout} />;
    }
    

    return <AdminPanel userData={userData} onLogout={handleLogout} />;
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="decoration-circle circle-1"></div>
      <div className="decoration-circle circle-2"></div>
      <div className="decoration-circle circle-3"></div>
      
      <div className="login-card">
        
        <p className="login-subtitle">PORTAL LINEAS DE PRODUCTO C&W </p>
        
        <div className="login-form">
          <label className="login-label">NÚMERO DE DOCUMENTO</label>
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Ingresa tu documento"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              onKeyPress={handleKeyPress}
              className="login-input"
            />
            <span className="input-icon"> </span>
          </div>
          
          {mensaje.texto && (
            <div className={`mensaje ${mensaje.tipo}`}>
              {mensaje.texto}
            </div>
          )}
          
          <button
            className="login-button"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "VALIDANDO..." : "INGRESAR"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login_admin;



