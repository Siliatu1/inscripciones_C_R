import React, { useState, useEffect } from "react";
import "./formulario_inscripcion.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { message } from "antd";

const FormularioInscripcion = ({ onBack, onSubmit, coordinadoraData }) => {
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
  const [mostrarInfoEmpleado, setMostrarInfoEmpleado] = useState(true);
  const [fechasBloqueadas, setFechasBloqueadas] = useState([]);
  
  const cargoCoordinadora = coordinadoraData?.data?.cargo_general || coordinadoraData?.data?.position || "";
  const puntoVentaCoordinadora = coordinadoraData?.data?.area_nombre || "";
  
  // Roles que pueden bloquear fechas
  const rolesBloqueoFechas = [
    'ANALISTA EVENTOS Y HELADERIAS',
    'JEFE OPERATIVO DE MERCADEO',
    'JEFE DESARROLLO DE PRODUCTO',
    'DIRECTORA DE LINEAS DE PRODUCTO',
    'ANALISTA DE PRODUCTO'
  ];
  
  const puedeBloquearFechas = rolesBloqueoFechas.includes(cargoCoordinadora);
  
 
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

  // Cargar fechas bloqueadas
  useEffect(() => {
    const cargarFechasBloqueadas = async () => {
      try {
        const response = await fetch('https://macfer.crepesywaffles.com/api/cap-cafe-fechas');
        if (response.ok) {
          const result = await response.json();
          if (result.data && Array.isArray(result.data)) {
            const fechas = result.data.map(item => item.attributes?.fecha).filter(Boolean);
            setFechasBloqueadas(fechas);
            console.log("Fechas bloqueadas:", fechas);
          }
        }
      } catch (error) {
        console.error("Error al cargar fechas bloqueadas:", error);
      }
    };
    cargarFechasBloqueadas();
  }, []);


  const obtenerMesesAMostrar = () => {
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const mesActual = hoy.getMonth(); // 0-11
    const yearActual = hoy.getFullYear();

    const meses = [];
    
    if (diaActual >= 15) {
      // Del 15 en adelante: Mostrar mes actual Y el siguiente
      meses.push({ year: yearActual, month: mesActual });
      
      if (mesActual === 11) { 
        meses.push({ year: yearActual + 1, month: 0 });
      } else {
        meses.push({ year: yearActual, month: mesActual + 1 });
      }
    } else {
      // Del 1 al 14: Mostrar solo el mes actual
      meses.push({ year: yearActual, month: mesActual });
    }
    
    return meses;
  };

  const obtenerLunesYViernes = (year, month) => {
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
      
      if (diaSemana === 1 || diaSemana === 5) {
        // Formatear fecha como YYYY-MM-DD sin conversiones UTC
        const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        
        // Verificar si es festivo o está bloqueada
        const esFestivo = festivosColombianos.includes(fechaStr);
        const estaBloqueada = fechasBloqueadas.includes(fechaStr);
        

        const numInscripciones = inscripcionesPorFecha[fechaStr] || 0;
        const disponible = numInscripciones < 3 && !esFestivo && !estaBloqueada;
        
        fechas.push({
          fecha: fechaStr,
          texto: `${diasSemana[diaSemana]} ${dia} de ${meses[month]}`,
          disponible: disponible,
          inscripciones: numInscripciones,
          esFestivo: esFestivo,
          estaBloqueada: estaBloqueada
        });
      }
    }
    
    return fechas;
  };


  useEffect(() => {
    if (festivosColombianos.length > 0) {
      const periodosAMostrar = obtenerMesesAMostrar();
      const todasLasFechas = [];
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ];
      
      periodosAMostrar.forEach(({ year, month }) => {
        const fechasMes = obtenerLunesYViernes(year, month);
        // Filtrar fechas pasadas
        const fechasFuturas = fechasMes.filter(f => {
          const fechaObj = new Date(f.fecha + 'T00:00:00');
          return fechaObj >= hoy;
        });
        todasLasFechas.push(...fechasFuturas);
      });
      
      setFechasDisponibles(todasLasFechas);
      setFechaInscripcion(""); 
      setPaginaActual(0);
      
      if (periodosAMostrar.length === 1) {
        console.log(`Mostrando fechas de ${meses[periodosAMostrar[0].month]} ${periodosAMostrar[0].year}`);
      } else {
        console.log(`Mostrando fechas de ${meses[periodosAMostrar[0].month]} y ${meses[periodosAMostrar[1].month]}`);
      }
    }
  }, [festivosColombianos, inscripcionesPorFecha, fechasBloqueadas]);


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

        
        if (data && data.ok && data.data && data.data.length > 0) {

          const empleadoData = data.data.find(emp => emp.document_number == documento);
          

          
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
        puntoVenta: puntoVentaCoordinadora,
        nombreLider: nombreLider
      });
      setMensaje({ texto: "", tipo: "" });
    }
  };

  const handleBuscarClick = () => {
    buscarEmpleado();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buscarEmpleado();
    }
  };

  // Función para bloquear/desbloquear fecha
  const handleBloquearFecha = async (fecha, estaBloqueada) => {
    const confirmar = window.confirm(
      estaBloqueada 
        ? `¿Está seguro de desbloquear la fecha ${fecha}?`
        : `¿Está seguro de bloquear la fecha ${fecha}?`
    );
    
    if (!confirmar) return;

    try {
      if (estaBloqueada) {
        // Desbloquear: buscar y eliminar el registro
        const response = await fetch('https://macfer.crepesywaffles.com/api/cap-cafe-fechas');
        if (response.ok) {
          const result = await response.json();
          const registro = result.data?.find(item => item.attributes?.fecha === fecha);
          
          if (registro) {
            const deleteResponse = await fetch(`https://macfer.crepesywaffles.com/api/cap-cafe-fechas/${registro.id}`, {
              method: 'DELETE'
            });
            
            if (deleteResponse.ok) {
              message.success('Fecha desbloqueada exitosamente');
              setFechasBloqueadas(prev => prev.filter(f => f !== fecha));
            } else {
              message.error('Error al desbloquear la fecha');
            }
          }
        }
      } else {
        // Bloquear: crear nuevo registro
        const response = await fetch('https://macfer.crepesywaffles.com/api/cap-cafe-fechas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: {
              fecha: fecha,
              bloqueadoPor: nombreLider
            }
          })
        });

        if (response.ok) {
          message.success('Fecha bloqueada exitosamente');
          setFechasBloqueadas(prev => [...prev, fecha]);
        } else {
          message.error('Error al bloquear la fecha');
        }
      }
    } catch (error) {
      console.error('Error al bloquear/desbloquear fecha:', error);
      message.error('Error de conexión');
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
      console.log('Nombre del líder a guardar:', formData.nombreLider);
      
      const dataToSend = {
        data: {
          documento: documento,
          nombre: formData.nombres,
          telefono: formData.telefono,
          cargo: formData.cargo,
          pdv: formData.puntoVenta,
          fecha: fechaInscripcion,
          lider: formData.nombreLider,
          tipo_formulario: 'heladeria'
        }
      };

      console.log('Datos a enviar:', dataToSend);


      const response = await fetch('https://macfer.crepesywaffles.com/api/cap-cafes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Respuesta de la API:", result);
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
    <div className="inscripcion-container">
      <div className="decoration-circle circle-1"></div>
      <div className="decoration-circle circle-2"></div>
      <div className="decoration-circle circle-3"></div>

      <button className="back-button-outside" onClick={onBack}>
        <i className="bi bi-arrow-left-circle-fill"></i>
        <span>Volver</span>
      </button>

      <div className="inscripcion-card">

        <h1 className="inscripcion-subtitle">ESCUELA DEL CAFÉ</h1>

        <form className="inscripcion-form" onSubmit={handleSubmit}>
          {/* Búsqueda por documento */}
          <div className="form-section">
            <label className="form-label">NÚMERO DE DOCUMENTO *</label>
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Ingresa el número de documento"
                value={documento}
                onChange={handleDocumentoChange}
                onKeyPress={handleKeyPress}
                className="form-input"
                readOnly={empleado !== null}
                disabled={empleado !== null}
              />
              <button
                type="button"
                onClick={handleBuscarClick}
                className="search-button"
                disabled={loading || empleado !== null || documento.trim().length < 6}
                title="Buscar empleado"
              >
                <i className="bi bi-search"></i>
              </button>
            </div>
            {loading && <span className="loading-indicator">Buscando empleado...</span>}
          </div>

          {/* Nombre del Líder (quien hizo login) */}
          <div className="form-section">
            <label className="form-label">NOMBRE DEL LÍDER</label>
            <input
              type="text"
              name="nombreLider"
              value={formData.nombreLider}
              className="form-input"
              readOnly
              disabled
              style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
            />
          </div>

          {mensaje.texto && (
            <div className={`mensaje ${mensaje.tipo}`}>
              {mensaje.texto}
            </div>
          )}

          {/* Información del Empleado - Colapsable */}
          {empleado && (
            <div className={`employee-info-container ${mostrarInfoEmpleado ? 'expanded' : ''}`}>
              <button
                type="button"
                className="toggle-info-button"
                onClick={() => setMostrarInfoEmpleado(!mostrarInfoEmpleado)}
              >
                <span>{mostrarInfoEmpleado ? 'Ocultar información' : 'Mostrar información'}</span>
                <i className={`bi ${mostrarInfoEmpleado ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>

              {mostrarInfoEmpleado && (
                <div className="employee-details">
                  {/* Foto */}
                  {formData.fotoBuk && (
                    <div className="form-section photo-section">
                      <label className="form-label">FOTO</label>
                      <div className="photo-preview">
                        <img src={formData.fotoBuk} alt="Foto empleado" className="employee-photo" />
                      </div>
                    </div>
                  )}

                  {/* Nombres */}
                  <div className="form-section">
                    <label className="form-label">NOMBRES COMPLETOS *</label>
                    <input
                      type="text"
                      name="nombres"
                      placeholder="Busque por documento para ver los datos"
                      value={formData.nombres}
                      onChange={handleInputChange}
                      className="form-input"
                      readOnly
                      disabled
                      required
                    />
                  </div>

                  {/* Teléfono */}
                  <div className="form-section">
                    <label className="form-label">TELÉFONO *</label>
                    <input
                      type="tel"
                      name="telefono"
                      placeholder="Ingrese el número de teléfono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>

                  {/* Cargo */}
                  <div className="form-section">
                    <label className="form-label">CARGO *</label>
                    <input
                      type="text"
                      name="cargo"
                      placeholder="Cargo actual"
                      value={empleado?.custom_attributes?.['Cargo General'] || formData.cargo}
                      className="form-input"
                      readOnly
                      disabled
                      required
                    />
                  </div>

                  {/* Punto de venta */}
                  <div className="form-section">
                    <label className="form-label">PUNTO DE VENTA</label>
                    <input
                      type="text"
                      name="puntoVenta"
                      placeholder="Ubicación o punto de venta"
                      value={formData.puntoVenta}
                      className="form-input"
                      readOnly
                      disabled
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selección de fecha (lunes o viernes) en tarjetas */}
          {fechasDisponibles.length > 0 && (
            <div className="form-section">
              <label className="form-label">FECHA DE INSCRIPCIÓN *</label>
              <div className="mes-info">
                Fechas disponibles de {(() => {
                  const periodosAMostrar = obtenerMesesAMostrar();
                  const meses = [
                    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                  ];
                  if (periodosAMostrar.length === 1) {
                    return `${meses[periodosAMostrar[0].month]} ${periodosAMostrar[0].year}`;
                  } else {
                    return `${meses[periodosAMostrar[0].month]} y ${meses[periodosAMostrar[1].month]}`;
                  }
                })()}
              </div>
              
              <div className="fechas-pagination-container">
                <button
                  type="button"
                  className="pagination-button prev"
                  onClick={() => setPaginaActual(prev => Math.max(0, prev - 1))}
                  disabled={paginaActual === 0}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>

                <div className="fechas-grid">
                  {fechasDisponibles
                    .slice(paginaActual * fechasPorPagina, (paginaActual + 1) * fechasPorPagina)
                    .map((fecha) => (
                      <div
                        key={fecha.fecha}
                        className={`fecha-card ${fechaInscripcion === fecha.fecha ? 'selected' : ''} ${!fecha.disponible ? 'no-disponible' : ''}`}
                        onClick={() => {
                          if (fecha.disponible) {
                            setFechaInscripcion(fecha.fecha);
                          } else if (fecha.esFestivo) {
                            setMensaje({ texto: "Esta fecha es un día festivo y no está disponible", tipo: "error" });
                            setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3000);
                          } else if (fecha.estaBloqueada) {
                            setMensaje({ texto: "Esta fecha está bloqueada por el administrador", tipo: "error" });
                            setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3000);
                          } else {
                            setMensaje({ texto: "Esta fecha ya tiene el máximo de inscripciones (3)", tipo: "error" });
                            setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3000);
                          }
                        }}
                        title={!fecha.disponible ? (fecha.esFestivo ? 'Día festivo' : fecha.estaBloqueada ? 'Fecha bloqueada' : `Inscripciones: ${fecha.inscripciones}/3`) : `Inscripciones: ${fecha.inscripciones}/3`}
                      >
                        <div className="fecha-dia">
                          {parseInt(fecha.fecha.split('-')[2])}
                        </div>
                        <div className="fecha-mes">
                          {fecha.texto.split(' ')[0]}
                        </div>
                        <div className="fecha-texto">
                          {fecha.texto}
                        </div>
                        {!fecha.disponible && (
                          <div className="fecha-no-disponible-label">
                            {fecha.esFestivo ? 'FESTIVO' : fecha.estaBloqueada ? 'BLOQUEADA' : 'COMPLETO'}
                          </div>
                        )}
                        {fecha.disponible && fecha.inscripciones > 0 && (
                          <div className="fecha-contador">
                            {fecha.inscripciones}/3
                          </div>
                        )}
                        {puedeBloquearFechas && (
                          <button
                            type="button"
                            className={`fecha-bloqueo-btn ${fecha.estaBloqueada ? 'bloqueada' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBloquearFecha(fecha.fecha, fecha.estaBloqueada);
                            }}
                            title={fecha.estaBloqueada ? 'Desbloquear fecha' : 'Bloquear fecha'}
                          >
                            <i className={`bi ${fecha.estaBloqueada ? 'bi-unlock-fill' : 'bi-lock-fill'}`}></i>
                          </button>
                        )}
                      </div>
                    ))}
                </div>

                <button
                  type="button"
                  className="pagination-button next"
                  onClick={() => setPaginaActual(prev => Math.min(Math.floor(fechasDisponibles.length / fechasPorPagina), prev + 1))}
                  disabled={paginaActual >= Math.floor(fechasDisponibles.length / fechasPorPagina)}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>

              <div className="pagination-info">
                Página {paginaActual + 1} de {Math.ceil(fechasDisponibles.length / fechasPorPagina)}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setEmpleado(null);
                setDocumento("");
                setFormData({
                  fotoBuk: "",
                  nombres: "",
                  telefono: "",
                  cargo: cargoCoordinadora,
                  puntoVenta: puntoVentaCoordinadora,
                  nombreLider: nombreLider
                });
                setFechaInscripcion("");
                setMensaje({ texto: "", tipo: "" });
                setPaginaActual(0);
              }}
            >
              Limpiar
            </button>
            <button type="submit" className="submit-button">
              Inscribir 
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioInscripcion;
