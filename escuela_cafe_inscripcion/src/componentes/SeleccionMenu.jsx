import React from "react";
import "./seleccion_menu.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const SeleccionMenu = ({ onSelectEscuelaCafe, onSelectEvaluacionToderas, onBack, nombreUsuario }) => {
  return (
    <div className="seleccion-menu-container">
      <div className="seleccion-menu-header">
        <button className="back-button-sm" onClick={onBack}>
          <i className="bi bi-arrow-left-circle"></i> Volver
        </button>

      </div>

      <div className="cards-container-sm">
        <div className="menu-card-sm escuela-cafe" onClick={onSelectEscuelaCafe}>
          <div className="card-icon-sm">
           
          </div>
          <h3 className="card-title-sm">ESCUELA  CAFÉ</h3>

          <div className="card-arrow-sm">
          
          </div>
        </div>

        <div className="menu-card-sm evaluacion-toderas" onClick={onSelectEvaluacionToderas}>
          <div className="card-icon-sm">
        
          </div>
          <h3 className="card-title-sm">EVALUACIÓN  TODERAS</h3>

          <div className="card-arrow-sm">

          </div>
        </div>
      </div>
    </div>
  );
};

export default SeleccionMenu;
