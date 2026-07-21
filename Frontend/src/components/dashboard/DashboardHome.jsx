// src/components/dashboard/DashboardHome.jsx

// À la place du code actuel, voici une version simplifiée SANS BI :

import React, { useMemo } from "react";
import {
  FaUsers,
  FaUserPlus,
  FaCalendarAlt,
  FaDollarSign,
  FaRegClock,
  FaChild,
  FaUser,
  FaUserGraduate,
  FaTrophy,
} from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const DashboardHome = ({
  stats,
  patients,
  todayAppointments,
  setDateFilter,
  setActiveTab,
  setShowAppointmentModal,
  setNewAppointment,
}) => {
  // Statistiques des paiements (simplifié)
  const paymentStats = useMemo(() => {
    const payes = patients.filter((p) => p.paiement_status === "paye").length;
    const semiPayes = patients.filter(
      (p) => p.paiement_status === "semi_paye",
    ).length;
    const nonPayes = patients.filter(
      (p) => p.paiement_status === "non_paye",
    ).length;
    const totalMontant = patients.reduce(
      (sum, p) => sum + (parseFloat(p.montant_total) || 0),
      0,
    );
    const totalPaye = patients.reduce(
      (sum, p) => sum + (parseFloat(p.montant_paye) || 0),
      0,
    );
    const totalRestant = patients.reduce(
      (sum, p) => sum + (parseFloat(p.montant_restant) || 0),
      0,
    );

    return {
      payes,
      semiPayes,
      nonPayes,
      totalMontant,
      totalPaye,
      totalRestant,
    };
  }, [patients]);

  // Ranking des patients (top 5)
  const patientRanking = useMemo(() => {
    return [...patients]
      .sort(
        (a, b) =>
          (parseFloat(b.montant_total) || 0) -
          (parseFloat(a.montant_total) || 0),
      )
      .slice(0, 5)
      .map((p, index) => ({
        rank: index + 1,
        name: p.full_name || p.nom || "Patient",
        total: parseFloat(p.montant_total) || 0,
        status: p.paiement_status,
      }));
  }, [patients]);

  return (
    <>
      {/* ============ KPI CARDS ============ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "20px",
            borderRadius: "15px",
            color: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{ margin: "0 0 5px 0", opacity: 0.9, fontSize: "14px" }}
              >
                Total Patients
              </p>
              <h2 style={{ margin: 0, fontSize: "32px", fontWeight: "bold" }}>
                {patients.length}
              </h2>
            </div>
            <FaUsers size={40} style={{ opacity: 0.7 }} />
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
            padding: "20px",
            borderRadius: "15px",
            color: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{ margin: "0 0 5px 0", opacity: 0.9, fontSize: "14px" }}
              >
                Patients payés
              </p>
              <h2 style={{ margin: 0, fontSize: "32px", fontWeight: "bold" }}>
                {paymentStats.payes}
              </h2>
            </div>
            <FaDollarSign size={40} style={{ opacity: 0.7 }} />
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #17a2b8 0%, #138496 100%)",
            padding: "20px",
            borderRadius: "15px",
            color: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{ margin: "0 0 5px 0", opacity: 0.9, fontSize: "14px" }}
              >
                Rendez-vous aujourd'hui
              </p>
              <h2 style={{ margin: 0, fontSize: "32px", fontWeight: "bold" }}>
                {todayAppointments.length}
              </h2>
            </div>
            <FaCalendarAlt size={40} style={{ opacity: 0.7 }} />
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)",
            padding: "20px",
            borderRadius: "15px",
            color: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{ margin: "0 0 5px 0", opacity: 0.9, fontSize: "14px" }}
              >
                Chiffre d'affaires
              </p>
              <h2 style={{ margin: 0, fontSize: "32px", fontWeight: "bold" }}>
                {paymentStats.totalPaye.toFixed(0)} DT
              </h2>
            </div>
            <FaDollarSign size={40} style={{ opacity: 0.7 }} />
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardHome;
