// src/components/dashboard/Sidebar.jsx
import React from "react";
import {
  FaHome,
  FaUsers,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaBell,
  FaSignOutAlt,
  FaStethoscope,
  FaXRay,
  FaCog,
  FaPills,
  FaChartLine,
} from "react-icons/fa";

const Sidebar = ({ activeTab, setActiveTab, handleLogout }) => {
  const menuItems = [
    { id: "patients", label: "Patients", icon: <FaUsers /> },
    { id: "consultations", label: "Consultations", icon: <FaStethoscope /> },
    { id: "appointments", label: "Rendez-vous", icon: <FaCalendarAlt /> },
    { id: "payments", label: "Paiements", icon: <FaMoneyBillWave /> },
    { id: "alerts", label: "Alertes", icon: <FaBell /> },
    { id: "achats", label: "Achats", icon: <FaPills /> },
    { id: "settings", label: "Paramètres", icon: <FaCog /> },
  ];

  return (
    <div
      style={{
        width: "280px",
        background: "white",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "25px", borderBottom: "1px solid #eee" }}>
        <h2 style={{ margin: 0, color: "#667eea" }}>🦷 Cabinet Dentaire</h2>
        <p style={{ margin: "5px 0 0", fontSize: "12px", color: "#6c757d" }}>
          Dr. Ayadi
        </p>
      </div>

      <nav style={{ flex: 1, padding: "20px 0", overflowY: "auto" }}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              padding: "12px 25px",
              margin: "5px 0",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              background: activeTab === item.id ? "#f8f9ff" : "transparent",
              borderRight: activeTab === item.id ? "3px solid #667eea" : "none",
              color: activeTab === item.id ? "#667eea" : "#6c757d",
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: "18px" }}>{item.icon}</span>
            <span style={{ fontWeight: activeTab === item.id ? "600" : "400" }}>
              {item.label}
            </span>
          </div>
        ))}
      </nav>

      <div style={{ padding: "20px", borderTop: "1px solid #eee" }}>
        <div
          onClick={handleLogout}
          style={{
            padding: "10px 15px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
            color: "#dc3545",
            borderRadius: "10px",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f8d7da")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <FaSignOutAlt />
          <span>Déconnexion</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
