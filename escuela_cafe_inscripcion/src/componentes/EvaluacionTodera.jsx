import React, { useState } from "react";
import "./evaluacion_todera.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { message } from "antd";

const EvaluacionTodera = ({ onBack, onSubmit, coordinadoraData }) => {
  const [documento, setDocumento] = useState("");
  const [loading, setLoading] = useState(false);
  const [empleado, setEmpleado] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [categoria, setCategoria] = useState("");
  
  const cargoCoordinadora = coordinadoraData?.data?.cargo_general || coordinadoraData?.data?.position || "";
  const puntoVentaCoordinadora = coordinadoraData?.data?.area_nombre || "";
  
  const nombreLider = coordinadoraData?.data?.nombre || 
    coordinadoraData?.data?.name ||
    (coordinadoraData?.data?.first_name && coordinadoraData?.data?.last_name 
      ? `${coordinadoraData.data.first_name} ${coordinadoraData.data.last_name}`.trim()
      : coordinadoraData?.data?.full_name || '');
  
  const [formData, setFormData] = useState({
    fotoBuk: "",
    nombres: "",
    telefono: "",
    cargo: cargoCoordinadora,
    puntoVenta: puntoVentaCoordinadora,
    nombreLider: nombreLider
  });

  const buscarEmpleado = async () => {
    if (documento.trim().length < 6) {
      setMensaje({ texto: "Por favor ingrese al menos 6 dígitos del documento", tipo: "error" });
      return;
    }

    setLoading(true);
    setMensaje({ texto: "", tipo: "" });
    
    try {
      const response = await fetch(
        `https://apialohav2.crepesywaffles.com/buk/empleados3?document_number=${documento}`,
        {
          headers: {
            Accept: "application/json",
            auth_token: "tmMC1o7cUovQvWoKhvbdhYxx",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        let empleadoData = null;
        
        if (data && data.ok && Array.isArray(data.data) && data.data.length > 0) {
          empleadoData = data.data.find(emp => emp.document_number == documento);
        } else if (Array.isArray(data) && data.length > 0) {
          empleadoData = data.find(emp => emp.document_number == documento);
        }
        
        if (empleadoData) {
          setEmpleado(empleadoData);
          
          if (empleadoData.foto) {
            localStorage.setItem("picture", empleadoData.foto);
          }
          
          setFormData({
            fotoBuk: empleadoData.foto || "",
            nombres: empleadoData.nombre || "",
            telefono: empleadoData.Celular || "",
            cargo: empleadoData.cargo || "",
            puntoVenta: empleadoData.area_nombre || puntoVentaCoordinadora,
            nombreLider: nombreLider
          });
          
          setMensaje({ texto: "✓ Empleado encontrado", tipo: "success" });
        } else {
          setEmpleado(null);
          setMensaje({ texto: "No se encontró empleado con ese documento", tipo: "error" });
        }
      } else {
        setEmpleado(null);
        setMensaje({ texto: "Error al buscar el empleado", tipo: "error" });
      }
    } catch (error) {
      setEmpleado(null);
      setMensaje({ texto: "Error de conexión con la API", tipo: "error" });
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!empleado) {
      message.error("Por favor busque un empleado válido");
      return;
    }

    if (!categoria) {
      message.error("Por favor seleccione una categoría");
      return;
    }

    // Validar que tenemos todos los datos necesarios
    console.log("=== DATOS DEL FORMULARIO ===");
    console.log("Documento:", documento);
    console.log("Nombre:", formData.nombres);
    console.log("Teléfono:", formData.telefono);
    console.log("Cargo:", formData.cargo);
    console.log("Foto URL:", formData.fotoBuk);
    console.log("PDV:", formData.puntoVenta);
    console.log("Líder:", formData.nombreLider);
    console.log("Categoría:", categoria);
    console.log("===========================");

    const dataToSend = {
      data: {
        documento: String(documento),
        nombre: String(formData.nombres),
        telefono: String(formData.telefono),
        cargo: String(formData.cargo),
        foto: String(formData.fotoBuk || ""),
        pdv: String(formData.puntoVenta),
        lider: String(formData.nombreLider),
        categoria: String(categoria)
      }
    };

    console.log("=== DATOS A ENVIAR (JSON) ===");
    console.log(JSON.stringify(dataToSend, null, 2));
    console.log("============================");

    try {
      const response = await fetch('https://macfer.crepesywaffles.com/api/cap-toderas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      console.log("=== RESPUESTA DEL SERVIDOR ===");
      console.log("Status:", response.status);
      console.log("Status Text:", response.statusText);
      console.log("==============================");

      if (response.ok) {
        const result = await response.json();
        console.log("=== RESPUESTA EXITOSA ===");
        console.log(result);
        console.log("========================");
        message.success('¡Evaluación registrada exitosamente!');
    
        // Limpiar formulario
        setDocumento("");
        setEmpleado(null);
        setCategoria("");
        setFormData({
          fotoBuk: "",
          nombres: "",
          telefono: "",
          cargo: cargoCoordinadora,
          puntoVenta: puntoVentaCoordinadora,
          nombreLider: nombreLider
        });
        setMensaje({ texto: "", tipo: "" });

        if (onSubmit) {
          onSubmit({ success: true, data: result });
        }
      } else {
        const errorText = await response.text();
        console.error("=== ERROR DEL SERVIDOR ===");
        console.error("Status:", response.status);
        console.error("Response Text:", errorText);
        console.error("=========================");
        
        try {
          const errorData = JSON.parse(errorText);
          console.error("Error parseado:", errorData);
          if (errorData.error && errorData.error.message) {
            message.error(`Error: ${errorData.error.message}`);
          } else {
            message.error(`Error al registrar la evaluación (${response.status})`);
          }
        } catch (e) {
          console.error("No se pudo parsear el error como JSON");
          message.error(`Error al registrar la evaluación (${response.status})`);
        }
      }
    } catch (error) {
      console.error("=== ERROR DE RED ===");
      console.error("Error completo:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("===================");
      message.error('Error de conexión al enviar la evaluación');
    }
  };

  return (
    <div className="evaluacion-todera-container">
      <div className="evaluacion-todera-header">
        <button className="back-button-et" onClick={onBack}>
          <i className="bi bi-arrow-left-circle"></i> Volver
        </button>
        <h1 className="evaluacion-todera-title">EVALUACIÓN  TODERAS</h1>

      </div>

      <div className="form-container-et">
        <form onSubmit={handleSubmit} className="evaluacion-form-et">
          {/* Búsqueda de empleado */}
          <div className="form-section-et">
            <label className="form-label-et">NÚMERO DE DOCUMENTO *</label>
            <div className="search-container-et">
              <input
                type="text"
                className="form-input-et"
                placeholder="Ingrese número de documento"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarEmpleado();
                  }
                }}
              />
              <button
                type="button"
                className="search-button-et"
                onClick={buscarEmpleado}
                disabled={loading}
              >
                {loading ? (
                  <i className="bi bi-hourglass-split"></i>
                ) : (
                  <i className="bi bi-search"></i>
                )}
              </button>
            </div>
            {mensaje.texto && (
              <div className={`mensaje-et ${mensaje.tipo}`}>
                {mensaje.texto}
              </div>
            )}
          </div>

          {/* Información del empleado */}
          {empleado && (
            <>
              <div className="employee-card-et">
                {formData.fotoBuk && (
                  <div className="employee-photo-et">
                    <img src={formData.fotoBuk} alt="Foto empleado" />
                  </div>
                )}
                <div className="employee-info-et">
                  <h3>{formData.nombres}</h3>
                  <p><i className="bi bi-briefcase"></i> {formData.cargo}</p>
                  <p><i className="bi bi-geo-alt"></i> {formData.puntoVenta}</p>
                  <p><i className="bi bi-telephone"></i> {formData.telefono}</p>
                </div>
              </div>

              {/* Nombre del líder (solo lectura) */}
              <div className="form-section-et">
                <label className="form-label-et">NOMBRE DEL LÍDER</label>
                <input
                  type="text"
                  name="nombreLider"
                  className="form-input-et"
                  value={formData.nombreLider}
                  readOnly
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>

              {/* Punto de venta del líder (solo lectura) */}
              <div className="form-section-et">
                <label className="form-label-et">PUNTO DE VENTA</label>
                <input
                  type="text"
                  name="puntoVenta"
                  className="form-input-et"
                  value={formData.puntoVenta}
                  readOnly
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>

              {/* Categoría */}
              <div className="form-section-et">
                <label className="form-label-et">CATEGORÍA *</label>
                <select
                  className="form-select-et"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  required
                >
                  <option value="">Seleccione una categoría</option>
                  <option value="sal">Sal</option>
                  <option value="dulce">Dulce</option>
                  <option value="bebidas">Bebidas y Postres</option>
                </select>
              </div>

              {/* Botones de acción */}
              <div className="form-actions-et">
                <button
                  type="button"
                  className="cancel-button-et"
                  onClick={() => {
                    setEmpleado(null);
                    setDocumento("");
                    setCategoria("");
                    setFormData({
                      fotoBuk: "",
                      nombres: "",
                      telefono: "",
                      cargo: cargoCoordinadora,
                      puntoVenta: puntoVentaCoordinadora,
                      nombreLider: nombreLider
                    });
                    setMensaje({ texto: "", tipo: "" });
                  }}
                >
                  Limpiar
                </button>
                <button type="submit" className="submit-button-et">
                  Registrar Evaluación
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default EvaluacionTodera;
