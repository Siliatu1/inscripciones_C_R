import React, { useState, useEffect } from "react";
import "./formulario_punto_venta.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { message } from "antd";

const FormularioPuntoVenta = ({ onBack, onSubmit, coordinadoraData }) => {
  const [documento, setDocumento] = useState("");
  const [loading, setLoading] = useState(false);
  const [empleado, setEmpleado] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [fechasDisponibles, setFechasDisponibles] = useState([]);
  const [fechaInscripcion, setFechaInscripcion] = useState("");
  const [paginaActual, setPaginaActual] = useState(0);
  const fechasPorPagina = 3;
  const [festivosColombianos, setFestivosColombianos] = useState([]);
  const [inscripcionesPorFecha, setInscripcionesPorFecha] = useState({});
  
  const cargoCoordinadora = coordinadoraData?.data?.cargo_general || coordinadoraData?.data?.position || "";
  const puntoVentaCoordinadora = coordinadoraData?.data?.area_nombre || "";
 
  
  const [formData, setFormData] = useState({
    fotoBuk: "",
    nombres: "",
    telefono: "",
    cargo: cargoCoordinadora,
    puntoVenta: puntoVentaCoordinadora
  });


  useEffect(() => {
    const cargarFestivos = async () => {
      try {
        const response = await fetch('https://date.nager.at/api/v3/PublicHolidays/2026/CO');
        if (response.ok) {
          const festivos = await response.json();
          
          const fechasFestivos = festivos.map(f => f.date);
          setFestivosColombianos(fechasFestivos);
          console.log("Festivos colombianos cargados:", fechasFestivos);
        }
      } catch (error) {
        console.error("Error al cargar festivos:", error);
      }
    };
    cargarFestivos();
  }, []);

  useEffect(() => {
    const cargarInscripciones = async () => {
      try {
        const response = await fetch('https://macfer.crepesywaffles.com/api/cap-cafes');
        if (response.ok) {
          const result = await response.json();

          const conteo = {};
          if (result.data && Array.isArray(result.data)) {
            result.data.forEach(inscripcion => {
              const fecha = inscripcion.attributes?.fecha;
              if (fecha) {
                conteo[fecha] = (conteo[fecha] || 0) + 1;
              }
            });
          }
          setInscripcionesPorFecha(conteo);
          console.log("Inscripciones por fecha:", conteo);
        }
      } catch (error) {
        console.error("Error al cargar inscripciones:", error);
      }
    };
    cargarInscripciones();
  }, []);


  const obtenerMesAMostrar = () => {
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const mesActual = hoy.getMonth(); 
    const yearActual = hoy.getFullYear();

 
    if (diaActual >= 15) {

      if (mesActual === 11) { 
        return { year: yearActual + 1, month: 0 };
      } else {
        return { year: yearActual, month: mesActual + 1 };
      }
    } else {

      return { year: yearActual, month: mesActual };
    }
  };


  const obtenerMartesMiercolesJueves = (year, month) => {
    const fechas = [];
    const ultimoDia = new Date(year, month + 1, 0).getDate();
    
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    
    for (let dia = 1; dia <= ultimoDia; dia++) {

      const fecha = new Date(year, month, dia);
      const diaSemana = fecha.getDay();
      

      if (diaSemana === 2 || diaSemana === 3 || diaSemana === 4) {
        // Formatear fecha como YYYY-MM-DD sin conversiones UTC
        const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        
        // Verificar si es festivo
        const esFestivo = festivosColombianos.includes(fechaStr);
        

        const numInscripciones = inscripcionesPorFecha[fechaStr] || 0;
        const disponible = numInscripciones < 2 && !esFestivo;
        
        fechas.push({
          fecha: fechaStr,
          texto: `${diasSemana[diaSemana]} ${dia} de ${meses[month]}`,
          disponible: disponible,
          inscripciones: numInscripciones,
          esFestivo: esFestivo
        });
      }
    }
    
    return fechas;
  };


  useEffect(() => {
    if (festivosColombianos.length > 0) {
      const { year, month } = obtenerMesAMostrar();
      const fechas = obtenerMartesMiercolesJueves(year, month);
      setFechasDisponibles(fechas);
      setFechaInscripcion(""); 
      setPaginaActual(0);
      
      const meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ];
      console.log(`Mostrando fechas de ${meses[month]} ${year} - Martes, Miércoles y Jueves`);
    }
  }, [festivosColombianos, inscripcionesPorFecha]);


  useEffect(() => {
    const buscarEmpleado = async () => {

      if (documento.trim().length < 6) {
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
            // BUSCAR el empleado que coincida con el documento ingresado
            empleadoData = data.data.find(emp => emp.document_number == documento);

          } else if (Array.isArray(data) && data.length > 0) {
            // Caso: directamente un array [...]
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
              puntoVenta: empleadoData.area_nombre || puntoVentaCoordinadora
            });
            
            setMensaje({ texto: "✓ Empleado encontrado", tipo: "success" });
          } else {
            console.log("❌ NO se encontró empleado con document_number:", documento);
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

    const timeoutId = setTimeout(() => {
      buscarEmpleado();
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [documento]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDocumentoChange = (e) => {
    const value = e.target.value;
    setDocumento(value);
    

    if (value.trim().length < 6) {
      setEmpleado(null);
      setFormData({
        fotoBuk: "",
        nombres: "",
        telefono: "",
        cargo: cargoCoordinadora,
        puntoVenta: puntoVentaCoordinadora
      });
      setMensaje({ texto: "", tipo: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    

    if (!formData.nombres || !formData.telefono || !formData.cargo) {
      setMensaje({ texto: "Por favor complete todos los campos requeridos", tipo: "error" });
      return;
    }

    if (!fechaInscripcion) {
      setMensaje({ texto: "Por favor seleccione una fecha de inscripción", tipo: "error" });
      return;
    }


    try {
      setLoading(true);
      const response = await fetch('https://macfer.crepesywaffles.com/api/cap-cafes');
      if (response.ok) {
        const result = await response.json();
        

        const yaInscrito = result.data?.some(inscripcion => {
          const docInscrito = inscripcion.attributes?.documento;
          const fechaInscrita = inscripcion.attributes?.fecha;
          return docInscrito === documento && fechaInscrita === fechaInscripcion;
        });

        if (yaInscrito) {
          message.warning('⚠️ Este documento ya está inscrito para la fecha seleccionada. Por favor elija otra fecha.', 5);
          

          setDocumento("");
          setEmpleado(null);
          setFechaInscripcion("");
          setFormData({
            fotoBuk: "",
            nombres: "",
            telefono: "",
            cargo: cargoCoordinadora,
            puntoVenta: puntoVentaCoordinadora
          });
          setMensaje({ texto: "", tipo: "" });
          
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error("Error al verificar inscripciones:", error);
    }
    
    setLoading(true);
    
    try {

      const nombreCoordinadora = coordinadoraData?.data?.nombre || 
        (coordinadoraData?.data?.first_name && coordinadoraData?.data?.last_name 
          ? `${coordinadoraData.data.first_name} ${coordinadoraData.data.last_name}`.trim()
          : '');
      
      const dataToSend = {
        data: {
          documento: documento,
          nombre: formData.nombres,
          telefono: formData.telefono,
          cargo: formData.cargo,
          foto: formData.fotoBuk,
          pdv: formData.puntoVenta,
          fecha: fechaInscripcion,
          coordinadora: nombreCoordinadora,
          tipo_formulario: 'punto_venta'
        }
      };

      console.log("Enviando datos a la API:", dataToSend);

      const response = await fetch('https://macfer.crepesywaffles.com/api/cap-cafes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const result = await response.json();

        setMensaje({ texto: "✓ Inscripción guardada con éxito. Redirigiendo...", tipo: "success" });
        

        setTimeout(() => {
          if (onSubmit) {
            onSubmit({ documento, ...formData, fechaInscripcion, empleadoCompleto: empleado, success: true });
          }
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));

        setMensaje({ texto: `Error al guardar la inscripción: ${errorData.message || 'Error desconocido'}`, tipo: "error" });
      }
    } catch (error) {
      console.error("Error al enviar datos:", error);
      setMensaje({ texto: "Error de conexión con el servidor", tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inscripcion-pv-container">
      <div className="decoration-circle-pv circle-1-pv"></div>
      <div className="decoration-circle-pv circle-2-pv"></div>
      <div className="decoration-circle-pv circle-3-pv"></div>

      <button className="back-button-outside-pv" onClick={onBack}>
        <i className="bi bi-arrow-left-circle-fill"></i>
        <span>Volver</span>
      </button>

      <div className="inscripcion-card-pv">

        <h1 className="inscripcion-subtitle-pv">PUNTO DE VENTA</h1>

        <form className="inscripcion-form-pv" onSubmit={handleSubmit}>
          {/* Búsqueda por documento */}
          <div className="form-section-pv">
            <label className="form-label-pv">NÚMERO DE DOCUMENTO *</label>
            <input
              type="text"
              placeholder="Ingresa el número de documento"
              value={documento}
              onChange={handleDocumentoChange}
              className="form-input-pv"
              readOnly={empleado !== null}
              disabled={empleado !== null}
            />
            {loading && <span className="loading-indicator-pv">Buscando empleado...</span>}
          </div>

          {mensaje.texto && (
            <div className={`mensaje-pv ${mensaje.tipo}`}>
              {mensaje.texto}
            </div>
          )}

          {/* Foto */}
          {formData.fotoBuk && (
            <div className="form-section-pv photo-section-pv">
              <label className="form-label-pv">FOTO</label>
              <div className="photo-preview-pv">
                <img src={formData.fotoBuk} alt="Foto empleado" className="employee-photo-pv" />
              </div>
            </div>
          )}

          {/* Nombres */}
          <div className="form-section-pv">
            <label className="form-label-pv">NOMBRES COMPLETOS *</label>
            <input
              type="text"
              name="nombres"
              placeholder="Busque por documento para ver los datos"
              value={formData.nombres}
              onChange={handleInputChange}
              className="form-input-pv"
              readOnly
              disabled
              required
            />
          </div>

          {/* Teléfono */}
          <div className="form-section-pv">
            <label className="form-label-pv">TELÉFONO *</label>
            <input
              type="tel"
              name="telefono"
              placeholder="Busque por documento para ver los datos"
              value={formData.telefono}
              onChange={handleInputChange}
              className="form-input-pv"
              readOnly
              disabled
              required
            />
          </div>

          {/* Cargo */}
          <div className="form-section-pv">
            <label className="form-label-pv">CARGO *</label>
            <input
              type="text"
              name="cargo"
              placeholder="Cargo actual"
              value={empleado?.custom_attributes?.['Cargo General'] || formData.cargo}
              className="form-input-pv"
              readOnly
              disabled
              required
            />
          </div>

          {/* Punto de venta */}
          <div className="form-section-pv">
            <label className="form-label-pv">PUNTO DE VENTA</label>
            <input
              type="text"
              name="puntoVenta"
              placeholder="Ubicación o punto de venta"
              value={formData.puntoVenta}
              className="form-input-pv"
              readOnly
              disabled
            />
          </div>

          {/* Selección de fecha (martes, miércoles, jueves) en tarjetas */}
          {fechasDisponibles.length > 0 && (
            <div className="form-section-pv">
              <label className="form-label-pv">FECHA DE INSCRIPCIÓN *</label>
              <div className="mes-info-pv">
                Fechas disponibles de {(() => {
                  const { year, month } = obtenerMesAMostrar();
                  const meses = [
                    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                  ];
                  return `${meses[month]} ${year}`;
                })()} - Martes, Miércoles y Jueves
              </div>
              
              <div className="fechas-pagination-container-pv">
                <button
                  type="button"
                  className="pagination-button-pv prev"
                  onClick={() => setPaginaActual(prev => Math.max(0, prev - 1))}
                  disabled={paginaActual === 0}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>

                <div className="fechas-grid-pv">
                  {fechasDisponibles
                    .slice(paginaActual * fechasPorPagina, (paginaActual + 1) * fechasPorPagina)
                    .map((fecha) => (
                      <div
                        key={fecha.fecha}
                        className={`fecha-card-pv ${fechaInscripcion === fecha.fecha ? 'selected' : ''} ${!fecha.disponible ? 'no-disponible' : ''}`}
                        onClick={() => {
                          if (fecha.disponible) {
                            setFechaInscripcion(fecha.fecha);
                          } else if (fecha.esFestivo) {
                            setMensaje({ texto: "Esta fecha es un día festivo y no está disponible", tipo: "error" });
                            setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3000);
                          } else {
                            setMensaje({ texto: "Esta fecha ya tiene el máximo de inscripciones (2)", tipo: "error" });
                            setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3000);
                          }
                        }}
                        title={!fecha.disponible ? (fecha.esFestivo ? 'Día festivo' : `Inscripciones: ${fecha.inscripciones}/2`) : `Inscripciones: ${fecha.inscripciones}/2`}
                      >
                        <div className="fecha-dia-pv">
                          {parseInt(fecha.fecha.split('-')[2])}
                        </div>
                        <div className="fecha-mes-pv">
                          {fecha.texto.split(' ')[0]}
                        </div>
                        <div className="fecha-texto-pv">
                          {fecha.texto}
                        </div>
                        {!fecha.disponible && (
                          <div className="fecha-no-disponible-label-pv">
                            {fecha.esFestivo ? 'FESTIVO' : 'COMPLETO'}
                          </div>
                        )}
                        {fecha.disponible && fecha.inscripciones > 0 && (
                          <div className="fecha-contador-pv">
                            {fecha.inscripciones}/2
                          </div>
                        )}
                      </div>
                    ))}
                </div>

                <button
                  type="button"
                  className="pagination-button-pv next"
                  onClick={() => setPaginaActual(prev => Math.min(Math.floor(fechasDisponibles.length / fechasPorPagina), prev + 1))}
                  disabled={paginaActual >= Math.floor(fechasDisponibles.length / fechasPorPagina)}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>

              <div className="pagination-info-pv">
                Página {paginaActual + 1} de {Math.ceil(fechasDisponibles.length / fechasPorPagina)}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="form-actions-pv">
            <button
              type="button"
              className="cancel-button-pv"
              onClick={() => {
                setEmpleado(null);
                setDocumento("");
                setFormData({
                  fotoBuk: "",
                  nombres: "",
                  telefono: "",
                  cargo: cargoCoordinadora,
                  puntoVenta: puntoVentaCoordinadora
                });
                setFechaInscripcion("");
                setMensaje({ texto: "", tipo: "" });
                setPaginaActual(0);
              }}
            >
              Limpiar
            </button>
            <button type="submit" className="submit-button-pv">
              Inscribir 
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioPuntoVenta;
