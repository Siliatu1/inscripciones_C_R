import React, { useState, useEffect } from "react";
import "./admin_panel.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import FormularioInscripcion from "./FormularioInscripcion";
import FormularioPuntoVenta from "./FormularioPuntoVenta";
import { Table, Input, DatePicker, Button, Space, message, Modal, Popconfirm, Select } from "antd";
import { SearchOutlined, DownloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const AdminPanel = ({ userData, onLogout }) => {
  const [showFormulario, setShowFormulario] = useState(false);
  const [tipoFormulario, setTipoFormulario] = useState(""); 
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    cedula: '',
    puntoVenta: ''
  });
  const [dataFiltrada, setDataFiltrada] = useState([]);
  const [modalEditar, setModalEditar] = useState(false);
  const [registroEditar, setRegistroEditar] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);


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
    'JEFE DE DESARROLLO DE PRODUCTO',
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
              tipoFormulario: item.attributes?.tipo_formulario || ''
            };
            return mapped;
          });
        }
        

        


        dataArray.forEach((item, index) => {

        });
        

        const cargoUsuario = userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '';
        const puntoVentaUsuario = userData?.data?.area_nombre || userData?.area_nombre || '';
        let dataFiltradaPorRol = dataArray;
        
        // Roles que pueden ver todos los registros
        if (rolesVerTodo.includes(cargoUsuario)) {
          dataFiltradaPorRol = dataArray;
        } 
        // Roles de heladería y punto de venta ven solo su PDV
        else if (rolesHeladeria.includes(cargoUsuario) || rolesPuntoVenta.includes(cargoUsuario)) {
          dataFiltradaPorRol = dataArray.filter(item => {
            const pdvItem = item.puntoVenta || '';
            const coincide = pdvItem === puntoVentaUsuario;
            return coincide;
          });
        }
        // Cualquier otro usuario autenticado puede ver todos los registros
        else {
          dataFiltradaPorRol = dataArray;
        }
        

        setInscripciones(dataFiltradaPorRol);
        setDataFiltrada(dataFiltradaPorRol);
      } else {
        console.error('Error al cargar inscripciones:', response.status);
        setInscripciones([]);
        setDataFiltrada([]);
      }
    } catch (error) {
      console.error("Error al cargar inscripciones:", error);
      setInscripciones([]);
      setDataFiltrada([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!showFormulario) {
      cargarInscripciones();
    }
  }, [showFormulario]);

  const handleRegistrarPersona = () => {
   
    const cargoUsuario = userData?.data?.cargo_general || userData?.cargo_general || userData?.cargo || '';
    

    
    if (rolesHeladeria.includes(cargoUsuario)) {

      setTipoFormulario("heladeria");
      setShowFormulario(true);
    } else if (rolesPuntoVenta.includes(cargoUsuario)) {

      setTipoFormulario("punto_venta");
      setShowFormulario(true);
    } else {


      setTipoFormulario("heladeria");
      setShowFormulario(true);
    }
  };

  const handleVolverPanel = () => {
    setShowFormulario(false);
    setTipoFormulario("");
  };

  const handleSubmitInscripcion = (data) => {

    
   
    if (data && data.success) {

      setShowFormulario(false);

      setTimeout(() => {
        cargarInscripciones();
      }, 500);
    }
  };


  const aplicarFiltros = () => {
    let dataTemp = [...inscripciones];

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

    setDataFiltrada(dataTemp);
  };

  // Aplicar filtros automáticamente cuando cambien
  useEffect(() => {
    aplicarFiltros();
  }, [filtros, inscripciones]);


  const limpiarFiltros = () => {
    setFiltros({ cedula: '', puntoVenta: '' });
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
      'Día': item.dia || '',
      
    }));

    const ws = XLSX.utils.json_to_sheet(datosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inscripciones');
    XLSX.writeFile(wb, `Inscripciones_Escuela_Cafe_${new Date().toISOString().split('T')[0]}.xlsx`);
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
      console.error('Error al eliminar:', error);
      message.error('Error de conexión al eliminar');
    }
  };

  // Editar inscripción (solo fecha)   ESTO NOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
  const handleEditar = (record) => {
    setRegistroEditar(record);
    
    setNuevaFecha(record.dia ? dayjs(record.dia, 'YYYY-MM-DD') : null);
    setModalEditar(true);
  };

  const guardarEdicion = async () => {
    if (!nuevaFecha) {
      message.warning('Por favor seleccione una fecha');
      return;
    }

    try {
      const response = await fetch(`https://macfer.crepesywaffles.com/api/cap-cafes/${registroEditar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            fecha: nuevaFecha.format('YYYY-MM-DD')
          }
        })
      });

      if (response.ok) {
        message.success('Fecha actualizada exitosamente');
        setModalEditar(false);
        setRegistroEditar(null);
        setNuevaFecha(null);
        cargarInscripciones(); 
      } else {
        message.error('Error al actualizar la fecha');
      }
    } catch (error) {
      console.error('Error al editar:', error);
      message.error('Error de conexión al editar');
    }
  };

  const cancelarEdicion = () => {
    setModalEditar(false);
    setRegistroEditar(null);
    setNuevaFecha(null);
  };

  // Configuración de columnas de la tabla
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

 
  if (showFormulario) {

    if (tipoFormulario === "punto_venta") {
      return (
        <FormularioPuntoVenta 
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

  return (
    <div className="admin-container">
      {/* Botón hamburguesa para móvil */}
      <button className="mobile-menu-toggle" onClick={toggleSidebar}>
        <i className="bi bi-list"></i>
      </button>

      {/* Overlay para cerrar sidebar en móvil */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      ></div>

      {/* Sidebar Lateral */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'active' : ''}`}>
        
        <nav className="sidebar-nav">
          <a href="#" className="sidebar-item active" onClick={closeSidebar}>
            <i className="bi bi-grid-fill"></i>
            <span>Panel</span>
          </a>
          <a href="#" className="sidebar-item" onClick={(e) => { handleRegistrarPersona(e); closeSidebar(); }}>
            <i className="bi bi-person-plus-fill"></i>
            <span>Registrar</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={(e) => { onLogout(); closeSidebar(); }}>
            <i className="bi bi-box-arrow-left"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="admin-main-wrapper">


        {/* Main Content */}
        <main className="admin-main">
        <div className="admin-content">

          <h1 className="admin-title">HOLA, {nombreUsuario}</h1>

          <h2 className="admin-subtitle">Gestiona estudiantes y cursos de la escuela de café</h2>

          {/* Filtros */}
          <div className="filters-container">
            <h3 className="filters-title">Filtros de Búsqueda</h3>
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
          <div style={{ background: '#fff', borderRadius: '8px', padding: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong></strong> Registros cargados: {inscripciones.length}, Filtrados: {dataFiltrada.length}
            </div>
            <Table
              columns={columns}
              dataSource={dataFiltrada || []}
              loading={loading}
              rowKey={(record, index) => record.id || record.cedula || `row-${index}`}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} inscripciones`
              }}
              scroll={{ x: 1000 }}
              locale={{
                emptyText: 'No hay inscripciones registradas'
              }}
            />
          </div>

        </div>
      </main>
      </div>

      {/* Modal para editar fecha */}
      <Modal
        title="Editar Fecha de Inscripción"
        open={modalEditar}
        onOk={guardarEdicion}
        onCancel={cancelarEdicion}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <div style={{ marginBottom: 16 }}>
          <p><strong>Estudiante:</strong> {registroEditar?.nombres}</p>
          <p><strong>Cédula:</strong> {registroEditar?.cedula}</p>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <strong>Nueva Fecha:</strong>
          </label>
          <DatePicker
            value={nuevaFecha}
            onChange={(date) => setNuevaFecha(date)}
            format="YYYY-MM-DD"
            style={{ width: '100%' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AdminPanel;
