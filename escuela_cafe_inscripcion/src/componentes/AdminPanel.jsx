import React, { useState, useEffect } from "react";
import "./admin_panel.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import FormularioInscripcion from "./FormularioInscripcion";
import FormularioPuntoVenta from "./FormularioPuntoVenta";
import SeleccionMenu from "./SeleccionMenu";
import EvaluacionTodera from "./EvaluacionTodera";
import ProfileCard from "./ProfileCard";
import { Table, Input, Button, Space, message, Popconfirm, Select } from "antd";
import { SearchOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const AdminPanel = ({ userData, onLogout }) => {
  const cargoUsuarioInicial = userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '';
  const rolesPuntoVentaCheck = [
    'ADMINISTRADORA PUNTO DE VENTA',
    'COORDINADOR PUNTO DE VENTA',
    'COORDINADOR PUNTO DE VENTA (FDS)',
    'GERENTE PUNTO DE VENTA'
  ];
  const vistaInicial = rolesPuntoVentaCheck.includes(cargoUsuarioInicial) ? "seleccion_menu" : "panel";
  
  const [showFormulario, setShowFormulario] = useState(false);
  const [tipoFormulario, setTipoFormulario] = useState(""); 
  const [vistaActual, setVistaActual] = useState(vistaInicial); 
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    cedula: '',
    puntoVenta: '',
    fecha: ''
  });
  const [dataFiltrada, setDataFiltrada] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [inscripcionesTodera, setInscripcionesTodera] = useState([]);
  const [loadingTodera, setLoadingTodera] = useState(false);
  const [filtrosTodera, setFiltrosTodera] = useState({
    cedula: '',
    puntoVenta: '',
    fecha: ''
  });
  const [dataFiltradaTodera, setDataFiltradaTodera] = useState([]);
  const [tabActivo, setTabActivo] = useState('todos');
  const [seccionActiva, setSeccionActiva] = useState('escuela_cafe'); // 'escuela_cafe' o 'evaluacion_todera'


  const nombreUsuario = userData?.data?.nombre || 
    userData?.data?.name ||
    (userData?.data?.first_name && userData?.data?.last_name 
      ? `${userData.data.first_name} ${userData.data.last_name}`.trim()
      : userData?.data?.full_name || '');

  const rolesHeladeria = [
    'COORDINADORA HELADERIA',
    'COORDINADOR DE ZONA',
    'COORDINADOR (A) HELADERIA PRINCIPAL'
  ];

  const rolesPuntoVenta = [
    'ADMINISTRADORA PUNTO DE VENTA',
    'COORDINADOR PUNTO DE VENTA',
    'COORDINADOR PUNTO DE VENTA (FDS)',
    'GERENTE PUNTO DE VENTA'
  ];

  
  const rolesVerTodo = [
    'ANALISTA EVENTOS Y HELADERIAS',
    'JEFE OPERATIVO DE MERCADEO',
    'JEFE DESARROLLO DE PRODUCTO',
    'DIRECTORA DE LINEAS DE PRODUCTO',
    'ANALISTA DE PRODUCTO',
  ];


  const rolesVerAmbasTablas = [
    'ADMINISTRADORA PUNTO DE VENTA',
    'COORDINADOR PUNTO DE VENTA',
    'COORDINADOR PUNTO DE VENTA (FDS)',
    'GERENTE PUNTO DE VENTA',
    'JEFE OPERATIVO DE MERCADEO',
    'JEFE DESARROLLO DE PRODUCTO',
    'DIRECTORA DE LINEAS DE PRODUCTO',
    'ANALISTA DE PRODUCTO',
    'INSTRUCTOR'
  ];

  
  const rolesAccesoDual = [
    'JEFE DESARROLLO DE PRODUCTO',
    'DIRECTORA DE LINEAS DE PRODUCTO',
    'ANALISTA DE PRODUCTO',
  ];


  const cargosRestringidos = [
    'ADMINISTRADORA PUNTO DE VENTA',
    'COORDINADOR (A) HELADERIA PRINCIPAL',
    'COORDINADOR PUNTO DE VENTA',
    'COORDINADOR PUNTO DE VENTA (FDS)',
    'GERENTE PUNTO DE VENTA',
    'COORDINADORA HELADERIA',
    'COORDINADOR DE ZONA'
  ];

 
  const puedeEliminar = () => {
    if (!userData) return false;
    const cargoUsuario = userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '';
    return !cargosRestringidos.includes(cargoUsuario);
  };


  const cargarInscripciones = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://macfer.crepesywaffles.com/api/cap-cafes');
      if (response.ok) {
        const result = await response.json();


        let dataArray = [];
        if (result && Array.isArray(result.data)) {

          dataArray = result.data.map(item => {
            const mapped = {
              id: item.id,
              cedula: item.attributes?.documento || '',
              nombres: item.attributes?.nombre || '',
              telefono: item.attributes?.telefono || '',
              cargo: item.attributes?.cargo || '',
              puntoVenta: item.attributes?.pdv || '',
              dia: item.attributes?.fecha || '',
              coordinadora: item.attributes?.coordinadora || '',
              nombreLider: item.attributes?.lider || '',
              tipoFormulario: item.attributes?.tipo_formulario || '',
              asistencia: item.attributes?.confirmado ?? null
            };
            return mapped;
          });
        }
        

        


        dataArray.forEach((item, index) => {

        });
        

        const cargoUsuario = userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '';
        const puntoVentaUsuario = userData?.data?.area_nombre || userData?.area_nombre || '';
        let dataFiltradaPorRol = dataArray;
        

        if (rolesVerTodo.includes(cargoUsuario)) {
          dataFiltradaPorRol = dataArray;
        } 

        else if (rolesHeladeria.includes(cargoUsuario) || rolesPuntoVenta.includes(cargoUsuario)) {
          dataFiltradaPorRol = dataArray.filter(item => {
            const pdvItem = item.puntoVenta || '';
            const coincide = pdvItem === puntoVentaUsuario;
            return coincide;
          });
        }

        else {
          dataFiltradaPorRol = dataArray;
        }
        

        setInscripciones(dataFiltradaPorRol);
        setDataFiltrada(dataFiltradaPorRol);
      } else {

        setInscripciones([]);
        setDataFiltrada([]);
      }
    } catch (error) {

      setInscripciones([]);
      setDataFiltrada([]);
    } finally {
      setLoading(false);
    }
  };


  // informacion de la tabla de toderas.
  const cargarInscripcionesTodera = async () => {
    setLoadingTodera(true);
    try {
      const response = await fetch('https://macfer.crepesywaffles.com/api/cap-toderas');
      if (response.ok) {
        const result = await response.json();
        let dataArray = [];
        if (result && Array.isArray(result.data)) {
          dataArray = result.data.map(item => ({
            id: item.id,
            cedula: item.attributes?.documento || '',
            nombres: item.attributes?.Nombre || '',
            telefono: item.attributes?.telefono || '',
            cargo: item.attributes?.cargo || '',
            puntoVenta: item.attributes?.pdv || '',
            dia: item.attributes?.fecha || '',
            nombreLider: item.attributes?.lider || '',
            categoria: item.attributes?.categoria || '',
          }));
        }

        const cargoUsuario = userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '';
        const puntoVentaUsuario = userData?.data?.area_nombre || userData?.area_nombre || '';
        let dataFiltradaPorRol = dataArray;

        if (rolesVerTodo.includes(cargoUsuario)) {
          dataFiltradaPorRol = dataArray;
        } else if (rolesHeladeria.includes(cargoUsuario) || rolesPuntoVenta.includes(cargoUsuario)) {
          dataFiltradaPorRol = dataArray.filter(item => {
            const pdvItem = item.puntoVenta || '';
            return pdvItem === puntoVentaUsuario;
          });
        } else {
          dataFiltradaPorRol = dataArray;
        }

        setInscripcionesTodera(dataFiltradaPorRol);
        setDataFiltradaTodera(dataFiltradaPorRol);
      } else {
        // Error del servidor, pero no afecta la funcionalidad principal
        console.warn(`No se pudieron cargar las evaluaciones toderas (código ${response.status})`);
        setInscripcionesTodera([]);
        setDataFiltradaTodera([]);
      }
    } catch (error) {
      // Error de red o servidor, continuar sin datos de toderas
      console.warn('No se pudieron cargar las evaluaciones toderas:', error.message);
      setInscripcionesTodera([]);
      setDataFiltradaTodera([]);
    } finally {
      setLoadingTodera(false);
    }
  };

  useEffect(() => {
    if (vistaActual === "panel") {
      cargarInscripciones();
      const cargoUsuario = userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '';
      if (rolesVerAmbasTablas.includes(cargoUsuario)) {
        cargarInscripcionesTodera();
      }
    }
  }, [vistaActual]);

  const handleRegistrarPersona = () => {
   
    const cargoUsuario = userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '';
    

    
    if (rolesHeladeria.includes(cargoUsuario)) {

      setTipoFormulario("heladeria");
      setVistaActual("formulario");
      setShowFormulario(true);
    } else if (rolesPuntoVenta.includes(cargoUsuario)) {

      setVistaActual("seleccion_menu");
    } else {


      setTipoFormulario("heladeria");
      setVistaActual("formulario");
      setShowFormulario(true);
    }
  };

  const handleAbrirFormularioPuntoVenta = () => {
    setTipoFormulario("punto_venta");
    setVistaActual("formulario");
    setShowFormulario(true);
  };


  const handleAbrirFormularioEscuelaCafe = () => {
    setTipoFormulario("heladeria");
    setVistaActual("formulario");
    setShowFormulario(true);
  };

  const handleAbrirFormularioEvaluacionTodera = () => {
    setTipoFormulario("evaluacion_todera");
    setVistaActual("formulario");
    setShowFormulario(true);
  };

  const handleVolverDesdeSeleccion = () => {
    const cargoUsuario = userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '';
    if (rolesPuntoVenta.includes(cargoUsuario)) {
      // Para roles de punto de venta, volver al menú de selección es cerrar sesión
      onLogout();
    } else {
      setVistaActual("panel");
    }
  };


  const tieneAccesoDual = () => {
    const cargoUsuario = userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '';
    return rolesAccesoDual.includes(cargoUsuario);
  };

  const handleVolverPanel = () => {
    setShowFormulario(false);
    setTipoFormulario("");
    const cargoUsuario = userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '';
    // Si es un rol de punto de venta, volver al menú de selección
    if (rolesPuntoVenta.includes(cargoUsuario)) {
      setVistaActual("seleccion_menu");
    } else {
      setVistaActual("panel");
    }
  };

  const handleSubmitInscripcion = (data) => {

    
   
    if (data && data.success) {
      setShowFormulario(false);
      // Después de inscribir, mostrar el panel para todos
      setVistaActual("panel");

      setTimeout(() => {
        cargarInscripciones();
      }, 500);
    }
  };


  const aplicarFiltros = () => {
    let dataTemp = [...inscripciones];

    // Filtrar por tab activo
    if (tabActivo === 'hel') {
      dataTemp = dataTemp.filter(item => item.tipoFormulario === 'heladeria');
    } else if (tabActivo === 'pdv') {
      dataTemp = dataTemp.filter(item => item.tipoFormulario === 'punto_venta');
    }

    if (filtros.cedula) {
      dataTemp = dataTemp.filter(item => 
        item.cedula && item.cedula.toString().includes(filtros.cedula)
      );
    }

    if (filtros.puntoVenta) {
      dataTemp = dataTemp.filter(item => 
        item.puntoVenta && item.puntoVenta.toLowerCase().includes(filtros.puntoVenta.toLowerCase())
      );
    }

    if (filtros.fecha) {
      dataTemp = dataTemp.filter(item => 
        item.dia && item.dia === filtros.fecha
      );
    }

    setDataFiltrada(dataTemp);
  };


  useEffect(() => {
    aplicarFiltros();
  }, [filtros, inscripciones, tabActivo]);


  const limpiarFiltros = () => {
    setFiltros({ cedula: '', puntoVenta: '', fecha: '' });
  };

  // Aplicar filtros todera
  const aplicarFiltrosTodera = () => {
    let dataTemp = [...inscripcionesTodera];

    if (filtrosTodera.cedula) {
      dataTemp = dataTemp.filter(item => 
        item.cedula && item.cedula.toString().includes(filtrosTodera.cedula)
      );
    }

    if (filtrosTodera.puntoVenta) {
      dataTemp = dataTemp.filter(item => 
        item.puntoVenta && item.puntoVenta.toLowerCase().includes(filtrosTodera.puntoVenta.toLowerCase())
      );
    }

    if (filtrosTodera.fecha) {
      dataTemp = dataTemp.filter(item => 
        item.dia && item.dia === filtrosTodera.fecha
      );
    }

    setDataFiltradaTodera(dataTemp);
  };

  useEffect(() => {
    aplicarFiltrosTodera();
  }, [filtrosTodera, inscripcionesTodera]);

  const limpiarFiltrosTodera = () => {
    setFiltrosTodera({ cedula: '', puntoVenta: '', fecha: '' });
  };


  const exportarExcel = () => {
    if (dataFiltrada.length === 0) {
      message.warning('No hay datos para exportar');
      return;
    }

    const datosExportar = dataFiltrada.map((item, index) => ({
      'No.': index + 1,
      'Cédula': item.cedula || '',
      'Nombres': item.nombres || '',
      'Teléfono': item.telefono || '',
      'Cargo': item.cargo || '',
      'Punto de Venta': item.puntoVenta || '',
      'Nombre Líder': item.nombreLider || '',
      'Asistencia': item.asistencia === null ? 'Pendiente' : (item.asistencia ? 'Asistió' : 'No asistió'),
      'Día': item.dia || '',
      
    }));

    const ws = XLSX.utils.json_to_sheet(datosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inscripciones');
    XLSX.writeFile(wb, `Inscripciones${new Date().toISOString().split('T')[0]}.xlsx`);
    message.success('Archivo Excel exportado exitosamente');
  };

  const exportarExcelTodera = () => {
    if (dataFiltradaTodera.length === 0) {
      message.warning('No hay datos para exportar');
      return;
    }

    const datosExportar = dataFiltradaTodera.map((item, index) => ({
      'No.': index + 1,
      'Cédula': item.cedula || '',
      'Nombres': item.nombres || '',
      'Teléfono': item.telefono || '',
      'Cargo': item.cargo || '',
      'Punto de Venta': item.puntoVenta || '',
      'Nombre Líder': item.nombreLider || '',
      'Categoría': item.categoria || '',
      'Día': item.dia || '',
    }));

    const ws = XLSX.utils.json_to_sheet(datosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Evaluaciones Todera');
    XLSX.writeFile(wb, `EvaluacionesTodera_${new Date().toISOString().split('T')[0]}.xlsx`);
    message.success('Archivo Excel exportado exitosamente');
  };


  const handleEliminar = async (id) => {
    try {
      const response = await fetch(`https://macfer.crepesywaffles.com/api/cap-cafes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Inscripción eliminada exitosamente');
        cargarInscripciones();
      } else {
        message.error('Error al eliminar la inscripción');
      }
    } catch (error) {
      message.error('Error de conexión al eliminar');
    }
  };

  const handleEliminarTodera = async (id) => {
    try {
      const response = await fetch(`https://macfer.crepesywaffles.com/api/cap-toderas/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Evaluación eliminada exitosamente');
        cargarInscripcionesTodera();
      } else {
        message.error('Error al eliminar la evaluación');
      }
    } catch (error) {
      message.error('Error de conexión al eliminar');
    }
  };


  const columns = [
    {
      title: 'Cédula',
      dataIndex: 'cedula',
      key: 'cedula',
      width: 120,
    },
    {
      title: 'Nombres',
      dataIndex: 'nombres',
      key: 'nombres',
      width: 200,
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
      width: 120,
    },
    {
      title: 'Cargo',
      dataIndex: 'cargo',
      key: 'cargo',
      width: 150,
    },
    {
      title: 'Punto de Venta',
      dataIndex: 'puntoVenta',
      key: 'puntoVenta',
      width: 150,
    },
    {
      title: 'Nombre Líder',
      dataIndex: 'nombreLider',
      key: 'nombreLider',
      width: 180,
    },
    {
      title: 'Día',
      dataIndex: 'dia',
      key: 'dia',
      width: 120,
      sorter: (a, b) => {
        if (!a.dia) return 1;
        if (!b.dia) return -1;
        return a.dia.localeCompare(b.dia);
      },
      defaultSortOrder: 'descend',
      render: (text) => {
        if (!text) return '';

        const [year, month, day] = text.split('-');
        return `${day}/${month}/${year}`;
      }
    },
    {
      title: 'Asistencia',
      dataIndex: 'asistencia',
      key: 'asistencia',
      width: 120,
      render: (asistencia) => {
        if (asistencia === null) {
          return <span style={{ color: '#a8a26a' }}>Pendiente</span>;
        } else if (asistencia === true) {
          return <span style={{ color: '#52c41a', fontWeight: 'bold' }}>✓ Asistió</span>;
        } else {
          return <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>✗ No asistió</span>;
        }
      }
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {puedeEliminar() && (
            <Popconfirm
              title="¿Está seguro de eliminar esta inscripción?"
              description="Esta acción no se puede deshacer."
              onConfirm={() => handleEliminar(record.id)}
              okText="Sí, eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                title="Eliminar"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    }
  ];

  // Columnas para tabla todera
  const columnsTodera = [
    {
      title: 'Cédula',
      dataIndex: 'cedula',
      key: 'cedula',
      width: 120,
    },
    {
      title: 'Nombres',
      dataIndex: 'nombres',
      key: 'nombres',
      width: 200,
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
      width: 120,
    },
    {
      title: 'Cargo',
      dataIndex: 'cargo',
      key: 'cargo',
      width: 150,
    },
    {
      title: 'Punto de Venta',
      dataIndex: 'puntoVenta',
      key: 'puntoVenta',
      width: 150,
    },
    {
      title: 'Nombre Líder',
      dataIndex: 'nombreLider',
      key: 'nombreLider',
      width: 180,
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
      width: 120,
      render: (text) => {
        const categorias = {
          'sal': { text: 'SAL', color: '#8B4513' },
          'dulce': { text: 'DULCE', color: '#FF69B4' },
          'bebidas': { text: 'BEBIDAS', color: '#4169E1' }
        };
        const cat = categorias[text?.toLowerCase()] || { text: text, color: '#666' };
        return <span style={{ color: cat.color, fontWeight: 'bold' }}>{cat.text}</span>;
      }
    },
    {
      title: 'Día',
      dataIndex: 'dia',
      key: 'dia',
      width: 120,
      sorter: (a, b) => {
        if (!a.dia) return 1;
        if (!b.dia) return -1;
        return a.dia.localeCompare(b.dia);
      },
      defaultSortOrder: 'descend',
      render: (text) => {
        if (!text) return '';
        const [year, month, day] = text.split('-');
        return `${day}/${month}/${year}`;
      }
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {puedeEliminar() && (
            <Popconfirm
              title="¿Está seguro de eliminar esta evaluación?"
              description="Esta acción no se puede deshacer."
              onConfirm={() => handleEliminarTodera(record.id)}
              okText="Sí, eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                title="Eliminar"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    }
  ];


  const puedeVerTodera = () => {
    const cargoUsuario = userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '';
    return rolesVerAmbasTablas.includes(cargoUsuario);
  };


  const calcularEstadisticas = () => {
    const totalInscritos = inscripciones.length;

    const puntosVenta = [...new Set(inscripciones.map(item => item.puntoVenta).filter(Boolean))].length;

    return { totalInscritos, puntosVenta };
  };


  if (vistaActual === "seleccion_menu") {
    return (
      <SeleccionMenu
        onSelectEscuelaCafe={handleAbrirFormularioPuntoVenta}
        onSelectEvaluacionToderas={handleAbrirFormularioEvaluacionTodera}
        onBack={handleVolverDesdeSeleccion}
        nombreUsuario={nombreUsuario}
      />
    );
  }

  if (vistaActual === "formulario" && showFormulario) {
    if (tipoFormulario === "punto_venta") {
      return (
        <FormularioPuntoVenta 
          onBack={handleVolverPanel}
          onSubmit={handleSubmitInscripcion}
          coordinadoraData={userData}
        />
      );
    } else if (tipoFormulario === "evaluacion_todera") {
      return (
        <EvaluacionTodera 
          onBack={handleVolverPanel}
          onSubmit={handleSubmitInscripcion}
          coordinadoraData={userData}
        />
      );
    } else {
      return (
        <FormularioInscripcion 
          onBack={handleVolverPanel}
          onSubmit={handleSubmitInscripcion}
          coordinadoraData={userData}
        />
      );
    }
  }


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="admin-container">
      <button className="mobile-menu-toggle" onClick={toggleSidebar}>
        <i className="bi bi-list"></i>
      </button>
      
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      ></div>

      {/* Sidebar Lateral */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'active' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        
        {/* Barra clickeable para colapsar sidebar */}
        <div 
          className="sidebar-toggle-bar" 
          onClick={toggleSidebarCollapse} 
          title={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <i className={`bi ${sidebarCollapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'}`}></i>
        </div>
        
        <nav className="sidebar-nav">
          <a href="#" className="sidebar-item active" onClick={closeSidebar}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            <span>Panel líneas de producto</span>
          </a>
          
          {tieneAccesoDual() ? (
            <>
              <a href="#" className="sidebar-item" onClick={(e) => { e.preventDefault(); handleAbrirFormularioEscuelaCafe(); closeSidebar(); }}>
                <i className="bi bi-cup-hot"></i>
                <span>Escuela del Café HEL</span>
              </a>
              <a href="#" className="sidebar-item" onClick={(e) => { e.preventDefault(); handleAbrirFormularioPuntoVenta(); closeSidebar(); }}>
                <i className="bi bi-shop-window"></i>
                <span>Escuela del Café PDV</span>
              </a>
            </>
          ) : rolesPuntoVenta.includes(userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '') ? (
            <>
              <a href="#" className="sidebar-item" onClick={(e) => { e.preventDefault(); handleAbrirFormularioPuntoVenta(); closeSidebar(); }}>
                <i className="bi bi-cup-hot"></i>
                <span>Escuela del Café</span>
              </a>
              <a href="#" className="sidebar-item" onClick={(e) => { e.preventDefault(); handleAbrirFormularioEvaluacionTodera(); closeSidebar(); }}>
                <i className="bi bi-clipboard-check"></i>
                <span>Evaluación Toderas</span>
              </a>
            </>
          ) : rolesHeladeria.includes(userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '') ? (
            <a href="#" className="sidebar-item" onClick={(e) => { e.preventDefault(); handleAbrirFormularioEscuelaCafe(); closeSidebar(); }}>
              <i className="bi bi-cup-hot"></i>
              <span>Escuela del Café</span>
            </a>
          ) : (
            <a href="#" className="sidebar-item" onClick={(e) => { handleRegistrarPersona(e); closeSidebar(); }}>
              <i className="bi bi-book"></i>
              <span>Registrar</span>
            </a>
          )}
          
          {puedeVerTodera() && !rolesPuntoVenta.includes(userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '') && (
            <a href="#" className="sidebar-item" onClick={(e) => { e.preventDefault(); handleAbrirFormularioEvaluacionTodera(); closeSidebar(); }}>
              <i className="bi bi-clipboard-check"></i>
              <span>Evaluación Todera</span>
            </a>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={(e) => { onLogout(); closeSidebar(); }}>
            <i className="bi bi-box-arrow-left"></i>
            <span>Salir</span>
          </button>
        </div>
      </aside>

      {/* Perfil del Usuario */}
      <ProfileCard userData={userData} />

      {/* Contenido Principal */}
      <div className={`admin-main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>


        {/* Main Content */}
        <main className="admin-main">
        <div className="admin-content">

          <h1 className="admin-title">Hola, {nombreUsuario} </h1>

          <h2 className="admin-subtitle">Gestiona estudiantes y cursos de la escuela de café</h2>

          {/* Cards de Estadísticas */}
          <div className="stats-container">
            <div className="stat-card">
            
              <div className="stat-content">
                <h3>{calcularEstadisticas().totalInscritos}</h3>
                <p>TOTAL INSCRITAS</p>
                <span>Estudiantes registradas</span>
              </div>
            </div>


            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fce4ec' }}>
                <i className="bi bi-geo-alt-fill" style={{ color: '#e91e63' }}></i>
              </div>
              <div className="stat-content">
                <h3>{calcularEstadisticas().puntosVenta}</h3>
                <p>PUNTOS DE VENTA</p>
                <span>Sedes vinculadas</span>
              </div>
            </div>
          </div>

          {/* Navegación principal - Botones de sección */}
          <div className="section-selector">
            <button 
              className={`section-button ${seccionActiva === 'escuela_cafe' ? 'active' : ''}`}
              onClick={() => {
                setSeccionActiva('escuela_cafe');
              }}
            >
             <i className="bi bi-cup-hot"></i>
              <span>Escuela del Café</span>
            </button>
            
            {puedeVerTodera() && (
              <button 
                className={`section-button ${seccionActiva === 'evaluacion_todera' ? 'active' : ''}`}
                onClick={() => setSeccionActiva('evaluacion_todera')}
              >
                <i className="bi bi-clipboard-check-fill"></i>
                <span>Evaluación Todera</span>
              </button>
            )}
          </div>

          {/* Mostrar contenido según sección activa */}
          {seccionActiva === 'escuela_cafe' ? (
            <>
              {/* Filtros */}
              <div className="filters-container">
            <h3 className="filters-title"><i className="bi bi-funnel-fill"></i> FILTROS DE BÚSQUEDA</h3>
            <Space wrap size="middle" style={{ width: '100%' }}>
              <Input
                placeholder="Buscar por cédula"
                prefix={<SearchOutlined />}
                value={filtros.cedula}
                onChange={(e) => setFiltros({ ...filtros, cedula: e.target.value })}
                style={{ width: 200 }}
              />
              <Select
                placeholder="Punto de venta"
                allowClear
                showSearch
                value={filtros.puntoVenta || undefined}
                onChange={(value) => setFiltros({ ...filtros, puntoVenta: value || '' })}
                style={{ width: 220 }}
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {[...new Set(inscripciones.map(item => item.puntoVenta).filter(Boolean))]
                  .sort()
                  .map(pdv => (
                    <Select.Option key={pdv} value={pdv}>{pdv}</Select.Option>
                  ))}
              </Select>
              <Select
                placeholder="Filtrar por fecha"
                allowClear
                showSearch
                value={filtros.fecha || undefined}
                onChange={(value) => setFiltros({ ...filtros, fecha: value || '' })}
                style={{ width: 180 }}
              >
                {[...new Set(inscripciones.map(item => item.dia).filter(Boolean))]
                  .sort((a, b) => b.localeCompare(a))
                  .map(fecha => {
                    const [year, month, day] = fecha.split('-');
                    const fechaFormateada = `${day}/${month}/${year}`;
                    return (
                      <Select.Option key={fecha} value={fecha}>{fechaFormateada}</Select.Option>
                    );
                  })}
              </Select>
              <Button onClick={limpiarFiltros}>
                Limpiar
              </Button>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />} 
                onClick={exportarExcel}
                style={{ background: '#9cbf8b' }}
              >
                Exportar a Excel
              </Button>
            </Space>
          </div>

              {/* Tabla de inscripciones */}
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', overflowX: 'auto', marginBottom: '30px' }}>
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '16px', color: '#2C2416' }}>Inscripciones Escuela del Café</strong>
              <span style={{ color: '#666' }}>Registros cargados: {inscripciones.length}, Filtrados: {dataFiltrada.length}</span>
            </div>
            <Table
              columns={columns}
              dataSource={dataFiltrada || []}
              loading={loading}
              rowKey={(record) => record.id || `${record.cedula}-${record.dia}` || Math.random().toString(36)}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} inscripciones`
              }}
              scroll={{ x: 1500 }}
              locale={{
                emptyText: 'No hay inscripciones registradas'
              }}
            />
              </div>
            </>
          ) : null}
          
          {seccionActiva === 'evaluacion_todera' && puedeVerTodera() && (
            <>
              <div className="filters-container">
                <h3 className="filters-title"><i className="bi bi-funnel-fill"></i> FILTROS EVALUACIONES TODERA</h3>
                <Space wrap size="middle" style={{ width: '100%' }}>
                  <Input
                    placeholder="Buscar por cédula"
                    prefix={<SearchOutlined />}
                    value={filtrosTodera.cedula}
                    onChange={(e) => setFiltrosTodera({ ...filtrosTodera, cedula: e.target.value })}
                    style={{ width: 200 }}
                  />
                  <Select
                    placeholder="Punto de venta"
                    allowClear
                    showSearch
                    value={filtrosTodera.puntoVenta || undefined}
                    onChange={(value) => setFiltrosTodera({ ...filtrosTodera, puntoVenta: value || '' })}
                    style={{ width: 220 }}
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {[...new Set(inscripcionesTodera.map(item => item.puntoVenta).filter(Boolean))]
                      .sort()
                      .map(pdv => (
                        <Select.Option key={pdv} value={pdv}>{pdv}</Select.Option>
                      ))}
                  </Select>
                  <Select
                    placeholder="Filtrar por fecha"
                    allowClear
                    showSearch
                    value={filtrosTodera.fecha || undefined}
                    onChange={(value) => setFiltrosTodera({ ...filtrosTodera, fecha: value || '' })}
                    style={{ width: 180 }}
                  >
                    {[...new Set(inscripcionesTodera.map(item => item.dia).filter(Boolean))]
                      .sort((a, b) => b.localeCompare(a))
                      .map(fecha => {
                        const [year, month, day] = fecha.split('-');
                        const fechaFormateada = `${day}/${month}/${year}`;
                        return (
                          <Select.Option key={fecha} value={fecha}>{fechaFormateada}</Select.Option>
                        );
                      })}
                  </Select>
                  <Button onClick={limpiarFiltrosTodera}>
                    Limpiar
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<DownloadOutlined />} 
                    onClick={exportarExcelTodera}
                    style={{ background: '#9cbf8b' }}
                  >
                    Exportar a Excel
                  </Button>
                </Space>
              </div>

              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', overflowX: 'auto' }}>
                <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '16px', color: '#2C2416' }}>Evaluaciones Todera</strong>
                  <span style={{ color: '#666' }}>Registros cargados: {inscripcionesTodera.length}, Filtrados: {dataFiltradaTodera.length}</span>
                </div>
                <Table
                  columns={columnsTodera}
                  dataSource={dataFiltradaTodera || []}
                  loading={loadingTodera}
                  rowKey={(record) => record.id || `${record.cedula}-${record.dia}` || Math.random().toString(36)}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} evaluaciones`
                  }}
                  scroll={{ x: 1500 }}
                  locale={{
                    emptyText: 'No hay evaluaciones registradas'
                  }}
                />
              </div>
            </>
          )}

        </div>
      </main>
      </div>

      
    </div>
  );
};

export default AdminPanel;
