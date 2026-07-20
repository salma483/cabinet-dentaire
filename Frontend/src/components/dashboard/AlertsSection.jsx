// src/components/dashboard/AlertsSection.jsx - VERSION CORRIGÉE (Affiche semi-payé ET non-payé)
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FaBell,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaEnvelope,
  FaTrash,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaDatabase,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { getBackendUrl } from "../../utils/getBackendUrl";

const AlertsSection = ({ appointments, patients, onPaymentClick }) => {
  const [alerts, setAlerts] = useState([]);
  const [dbAlerts, setDbAlerts] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [paymentStats, setPaymentStats] = useState({
    semiPayeCount: 0,
    nonPayeCount: 0,
    totalRestant: 0,
    payeCount: 0,
    sansMontantCount: 0,
  });
  const [alertSettings, setAlertSettings] = useState({
    appointmentReminder: true,
    paymentReminder: true,
    reminderHours: 24,
    showDbAlerts: true,
    showLocalAlerts: true,
    showSemiPaye: true, // NOUVEAU: Afficher les semi-payés
    showNonPaye: true, // NOUVEAU: Afficher les non-payés
  });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Fonction pour calculer le statut réel d'un patient
  const getActualStatus = (patient) => {
    const total = parseFloat(patient.montant_total) || 0;
    const paye = parseFloat(patient.montant_paye) || 0;
    const reste =
      patient.montant_restant !== undefined
        ? parseFloat(patient.montant_restant)
        : total - paye;

    if (total === 0) return "sans_montant";
    if (reste <= 0.01) return "paye";
    if (paye > 0 && reste > 0.01) return "semi_paye";
    return "non_paye";
  };

  // Mettre à jour les statistiques des paiements
  const updatePaymentStats = useCallback((patientsList) => {
    if (!patientsList || patientsList.length === 0) {
      setPaymentStats({
        semiPayeCount: 0,
        nonPayeCount: 0,
        totalRestant: 0,
        payeCount: 0,
        sansMontantCount: 0,
      });
      return { semiPayePatients: [], nonPayePatients: [] };
    }

    const semiPayePatients = [];
    const nonPayePatients = [];
    let totalRestantSum = 0;
    let payeCount = 0;
    let sansMontantCount = 0;

    patientsList.forEach((patient) => {
      const total = parseFloat(patient.montant_total) || 0;
      const paye = parseFloat(patient.montant_paye) || 0;
      const reste =
        patient.montant_restant !== undefined
          ? parseFloat(patient.montant_restant)
          : total - paye;
      const status = getActualStatus(patient);

      if (status === "semi_paye" && total > 0) {
        semiPayePatients.push(patient);
        totalRestantSum += Math.max(0, reste);
      } else if (status === "non_paye" && total > 0 && paye === 0) {
        nonPayePatients.push(patient);
        totalRestantSum += total;
      } else if (status === "paye") {
        payeCount++;
      } else if (total === 0) {
        sansMontantCount++;
      }
    });

    setPaymentStats({
      semiPayeCount: semiPayePatients.length,
      nonPayeCount: nonPayePatients.length,
      totalRestant: totalRestantSum,
      payeCount: payeCount,
      sansMontantCount: sansMontantCount,
    });

    return { semiPayePatients, nonPayePatients };
  }, []);

  // Générer les alertes locales (depuis les données en mémoire)
  const generateLocalAlerts = useCallback(() => {
    if (!patients || patients.length === 0) {
      return [];
    }

    const newAlerts = [];
    const { semiPayePatients, nonPayePatients } = updatePaymentStats(patients);

    // Alertes pour les paiements semi-payés (⚠️ IMPORTANT: maintenant bien affichées)
    if (
      alertSettings.paymentReminder &&
      alertSettings.showSemiPaye &&
      semiPayePatients.length > 0
    ) {
      console.log(
        `📢 Génération alertes semi-payés: ${semiPayePatients.length} patients`,
      );

      semiPayePatients.forEach((patient) => {
        const montantTotal = parseFloat(patient.montant_total) || 0;
        const montantPaye = parseFloat(patient.montant_paye) || 0;
        const montantRestant =
          patient.montant_restant !== undefined
            ? parseFloat(patient.montant_restant)
            : montantTotal - montantPaye;
        const pourcentagePaye = (montantPaye / montantTotal) * 100;

        newAlerts.push({
          id: `local_semi_${patient.id}`,
          type: "semi_payment",
          title: "⚠️ ALERTE - Paiement Partiel (Semi-payé)",
          message: `${patient.full_name} a payé ${montantPaye.toFixed(2)} DT sur ${montantTotal.toFixed(2)} DT.`,
          details: `⚠️ RESTE À PAYER: ${montantRestant.toFixed(2)} DT (${pourcentagePaye.toFixed(0)}% payé)`,
          patient: patient.full_name,
          patientId: patient.id,
          amount: montantRestant,
          total: montantTotal,
          paid: montantPaye,
          pourcentage: pourcentagePaye,
          read: false,
          priority: "high",
          phone: patient.phone,
          address: patient.address,
          fromDatabase: false,
          statusText: "Semi-payé",
        });
      });
    }

    // Alertes pour les paiements non payés
    if (
      alertSettings.paymentReminder &&
      alertSettings.showNonPaye &&
      nonPayePatients.length > 0
    ) {
      console.log(
        `🔴 Génération alertes non-payés: ${nonPayePatients.length} patients`,
      );

      nonPayePatients.forEach((patient) => {
        const montantTotal = parseFloat(patient.montant_total) || 0;

        newAlerts.push({
          id: `local_unpaid_${patient.id}`,
          type: "unpaid",
          title: "🔴 ALERTE CRITIQUE - Paiement Non Effectué",
          message: `${patient.full_name} n'a encore effectué aucun paiement.`,
          details: `🔴 MONTANT TOTAL DÛ: ${montantTotal.toFixed(2)} DT`,
          patient: patient.full_name,
          patientId: patient.id,
          amount: montantTotal,
          total: montantTotal,
          paid: 0,
          read: false,
          priority: "critical",
          phone: patient.phone,
          address: patient.address,
          fromDatabase: false,
          statusText: "Non payé",
        });
      });
    }

    console.log(
      `📋 Total alertes générées: ${newAlerts.length} (Semi: ${newAlerts.filter((a) => a.type === "semi_payment").length}, Non-payé: ${newAlerts.filter((a) => a.type === "unpaid").length})`,
    );

    return newAlerts;
  }, [patients, alertSettings, updatePaymentStats]);

  // Récupérer les alertes DB
  const fetchDbAlerts = useCallback(async () => {
    if (!initialized) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${getBackendUrl()}/api/paiements/alertes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📋 Alertes DB reçues:", data.length);

        const formattedDbAlerts = data.map((alert) => {
          const isCritical = alert.niveau_urgence === "critical";
          const isSemiPaye =
            alert.statut === "semi_paye" ||
            (!isCritical && alert.montant_restant > 0);

          return {
            id: `db_${alert.id}`,
            dbId: alert.id,
            type: isCritical ? "unpaid" : "semi_payment",
            title: isCritical
              ? "🔴 ALERTE CRITIQUE - Paiement Impayé"
              : "⚠️ ALERTE - Paiement Partiel (Semi-payé)",
            message: `${alert.patient_name} a un montant restant de ${parseFloat(alert.montant_restant).toFixed(2)} DT`,
            details: isCritical
              ? `🔴 MONTANT TOTAL DÛ: ${parseFloat(alert.montant_total).toFixed(2)} DT`
              : `⚠️ Total: ${parseFloat(alert.montant_total).toFixed(2)} DT | Payé: ${parseFloat(alert.montant_paye).toFixed(2)} DT | Reste: ${parseFloat(alert.montant_restant).toFixed(2)} DT`,
            patient: alert.patient_name,
            patientId: alert.patient_id,
            amount: parseFloat(alert.montant_restant),
            total: parseFloat(alert.montant_total),
            paid: parseFloat(alert.montant_paye),
            read: alert.status === "lue",
            priority: isCritical ? "critical" : "high",
            phone: alert.patient_phone,
            address: alert.patient_address,
            date_alerte: alert.date_alerte,
            fromDatabase: true,
            status: alert.status,
            statusText: isCritical ? "Non payé" : "Semi-payé",
          };
        });

        setDbAlerts(formattedDbAlerts);
      }
    } catch (error) {
      console.error("Erreur récupération alertes DB:", error);
    } finally {
      setLoading(false);
    }
  }, [initialized]);

  // Fusionner les alertes
  const mergeAlerts = useCallback(() => {
    let allAlerts = [];

    if (alertSettings.showDbAlerts) {
      const filteredDbAlerts = dbAlerts.filter((alert) => {
        if (alert.type === "semi_payment" && !alertSettings.showSemiPaye)
          return false;
        if (alert.type === "unpaid" && !alertSettings.showNonPaye) return false;
        return true;
      });
      allAlerts = [...allAlerts, ...filteredDbAlerts];
    }

    if (alertSettings.showLocalAlerts) {
      const localAlerts = generateLocalAlerts();
      const filteredLocalAlerts = localAlerts.filter((alert) => {
        if (alert.type === "semi_payment" && !alertSettings.showSemiPaye)
          return false;
        if (alert.type === "unpaid" && !alertSettings.showNonPaye) return false;
        return true;
      });
      allAlerts = [...allAlerts, ...filteredLocalAlerts];
    }

    // Éviter les doublons
    const uniqueMap = new Map();
    allAlerts.forEach((alert) => {
      const key = `${alert.type}_${alert.patientId}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, alert);
      }
    });

    const uniqueAlerts = Array.from(uniqueMap.values());

    // Trier par priorité (critical d'abord, puis high)
    const priorityOrder = { critical: 0, high: 1, normal: 2 };
    uniqueAlerts.sort(
      (a, b) =>
        (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2),
    );

    console.log(
      `🔄 Alertes fusionnées: ${uniqueAlerts.length} (Semi: ${uniqueAlerts.filter((a) => a.type === "semi_payment").length}, Non-payé: ${uniqueAlerts.filter((a) => a.type === "unpaid").length})`,
    );

    setAlerts(uniqueAlerts);
  }, [dbAlerts, alertSettings, generateLocalAlerts]);

  // Initialisation (une seule fois)
  useEffect(() => {
    setInitialized(true);
    return () => setInitialized(false);
  }, []);

  // Charger les alertes DB après initialisation
  useEffect(() => {
    if (initialized) {
      fetchDbAlerts();
    }
  }, [initialized, fetchDbAlerts]);

  // Fusionner les alertes quand les dépendances changent
  useEffect(() => {
    if (initialized) {
      mergeAlerts();
    }
  }, [initialized, mergeAlerts, patients, dbAlerts]);

  // Rafraîchissement périodique
  useEffect(() => {
    if (!initialized) return;

    const interval = setInterval(() => {
      fetchDbAlerts();
    }, 300000);

    return () => clearInterval(interval);
  }, [initialized, fetchDbAlerts]);

  // Écouter les événements de mise à jour
  useEffect(() => {
    if (!initialized) return;

    const handleRefresh = () => {
      fetchDbAlerts();
    };

    window.addEventListener("refreshPaymentData", handleRefresh);
    window.addEventListener("refreshAllData", handleRefresh);
    window.addEventListener("paymentsUpdated", handleRefresh);

    return () => {
      window.removeEventListener("refreshPaymentData", handleRefresh);
      window.removeEventListener("refreshAllData", handleRefresh);
      window.removeEventListener("paymentsUpdated", handleRefresh);
    };
  }, [initialized, fetchDbAlerts]);

  // Marquer alerte DB comme lue
  const markDbAlertAsRead = async (alertId, dbId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${getBackendUrl()}/api/paiements/alertes/${dbId}/lire`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        setDbAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId
              ? { ...alert, read: true, status: "lue" }
              : alert,
          ),
        );
        toast.success("Alerte marquée comme lue");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // Supprimer alerte DB
  const deleteDbAlert = async (alertId, dbId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${getBackendUrl()}/api/paiements/alertes/${dbId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        setDbAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
        toast.success("Alerte supprimée");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const markAsRead = (alertId) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, read: true } : alert,
      ),
    );
  };

  const deleteAlert = async (alert) => {
    if (alert.fromDatabase && alert.dbId) {
      await deleteDbAlert(alert.id, alert.dbId);
    } else {
      setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    }
    toast.success("Alerte supprimée");
  };

  const sendReminder = (alert) => {
    toast.success(`Rappel envoyé à ${alert.patient || "patient"}`);
    if (!alert.read) {
      markAsRead(alert.id);
    }
  };

  const handlePaymentAction = (patientId) => {
    if (onPaymentClick) {
      onPaymentClick(patientId);
    }
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.patientId === patientId ? { ...alert, read: true } : alert,
      ),
    );
  };

  const unreadCount = alerts.filter((alert) => !alert.read).length;

  const getAlertIcon = (type) => {
    switch (type) {
      case "semi_payment":
        return <FaExclamationTriangle color="#ffc107" size={20} />;
      case "unpaid":
        return <FaTimesCircle color="#dc3545" size={20} />;
      default:
        return <FaBell color="#667eea" size={20} />;
    }
  };

  const getAlertStyle = (alert) => {
    if (alert.read)
      return { background: "white", borderLeft: "4px solid #dee2e6" };
    switch (alert.type) {
      case "unpaid":
        return { background: "#f8d7da", borderLeft: "4px solid #dc3545" };
      case "semi_payment":
        return { background: "#fff3cd", borderLeft: "4px solid #ffc107" };
      default:
        return { background: "#e7f3ff", borderLeft: "4px solid #007bff" };
    }
  };

  if (!initialized) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #667eea",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto",
          }}
        ></div>
        <p style={{ marginTop: "20px" }}>Chargement des alertes...</p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h4 style={{ margin: 0 }}>
          <FaBell style={{ marginRight: "10px" }} />
          Alertes et Notifications
          {unreadCount > 0 && (
            <span
              style={{
                marginLeft: "10px",
                background: "#dc3545",
                color: "white",
                padding: "2px 8px",
                borderRadius: "20px",
                fontSize: "12px",
              }}
            >
              {unreadCount} nouvelle(s)
            </span>
          )}
        </h4>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={fetchDbAlerts}
            disabled={loading}
            style={{
              padding: "8px 16px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <FaDatabase /> Actualiser
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: "8px 16px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ⚙️ Paramètres
          </button>
        </div>
      </div>

      {/* Statistiques des paiements */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            background: "#d4edda",
            padding: "15px",
            borderRadius: "10px",
            borderLeft: "4px solid #28a745",
          }}
        >
          <div
            style={{ fontSize: "24px", fontWeight: "bold", color: "#155724" }}
          >
            {paymentStats.payeCount}
          </div>
          <div style={{ fontSize: "12px", color: "#155724" }}>
            <FaCheckCircle /> Patients payés
          </div>
        </div>
        <div
          style={{
            background: "#fff3cd",
            padding: "15px",
            borderRadius: "10px",
            borderLeft: "4px solid #ffc107",
          }}
        >
          <div
            style={{ fontSize: "24px", fontWeight: "bold", color: "#856404" }}
          >
            {paymentStats.semiPayeCount}
          </div>
          <div style={{ fontSize: "12px", color: "#856404" }}>
            <FaExclamationTriangle /> Semi-payés
          </div>
        </div>
        <div
          style={{
            background: "#f8d7da",
            padding: "15px",
            borderRadius: "10px",
            borderLeft: "4px solid #dc3545",
          }}
        >
          <div
            style={{ fontSize: "24px", fontWeight: "bold", color: "#721c24" }}
          >
            {paymentStats.nonPayeCount}
          </div>
          <div style={{ fontSize: "12px", color: "#721c24" }}>
            <FaTimesCircle /> Non payés
          </div>
        </div>
        <div
          style={{
            background: "#cce5ff",
            padding: "15px",
            borderRadius: "10px",
            borderLeft: "4px solid #004085",
          }}
        >
          <div
            style={{ fontSize: "24px", fontWeight: "bold", color: "#004085" }}
          >
            {paymentStats.totalRestant.toFixed(2)} DT
          </div>
          <div style={{ fontSize: "12px", color: "#004085" }}>
            <FaMoneyBillWave /> Total restant
          </div>
        </div>
      </div>

      {/* Paramètres des alertes */}
      {showSettings && (
        <div
          style={{
            background: "white",
            borderRadius: "15px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <h5>Paramètres des alertes</h5>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <input
              type="checkbox"
              checked={alertSettings.paymentReminder}
              onChange={(e) =>
                setAlertSettings((prev) => ({
                  ...prev,
                  paymentReminder: e.target.checked,
                }))
              }
              style={{ marginRight: "10px" }}
            />
            <span>💰 Activer les alertes de paiement</span>
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
              marginLeft: "25px",
            }}
          >
            <input
              type="checkbox"
              checked={alertSettings.showSemiPaye}
              onChange={(e) =>
                setAlertSettings((prev) => ({
                  ...prev,
                  showSemiPaye: e.target.checked,
                }))
              }
              style={{ marginRight: "10px" }}
            />
            <span>
              <FaExclamationTriangle color="#ffc107" /> Afficher les alertes
              SEMI-PAYÉS
            </span>
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
              marginLeft: "25px",
            }}
          >
            <input
              type="checkbox"
              checked={alertSettings.showNonPaye}
              onChange={(e) =>
                setAlertSettings((prev) => ({
                  ...prev,
                  showNonPaye: e.target.checked,
                }))
              }
              style={{ marginRight: "10px" }}
            />
            <span>
              <FaTimesCircle color="#dc3545" /> Afficher les alertes NON-PAYÉS
            </span>
          </label>
          <hr />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <input
              type="checkbox"
              checked={alertSettings.showDbAlerts}
              onChange={(e) =>
                setAlertSettings((prev) => ({
                  ...prev,
                  showDbAlerts: e.target.checked,
                }))
              }
              style={{ marginRight: "10px" }}
            />
            <span>🗄️ Afficher alertes de la base de données</span>
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <input
              type="checkbox"
              checked={alertSettings.showLocalAlerts}
              onChange={(e) =>
                setAlertSettings((prev) => ({
                  ...prev,
                  showLocalAlerts: e.target.checked,
                }))
              }
              style={{ marginRight: "10px" }}
            />
            <span>💻 Afficher alertes locales</span>
          </label>
        </div>
      )}

      {/* Liste des alertes */}
      <div
        style={{
          background: "white",
          borderRadius: "15px",
          overflow: "hidden",
        }}
      >
        {alerts.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "60px", color: "#6c757d" }}
          >
            <FaBell size={60} opacity={0.3} />
            <p>Aucune alerte pour le moment</p>
            <small>
              Vérifiez que vous avez des patients avec statut "Semi-payé" ou
              "Non payé"
            </small>
          </div>
        ) : (
          <>
            {/* Résumé des alertes */}
            <div
              style={{
                padding: "15px 20px",
                background: "#f8f9fa",
                borderBottom: "1px solid #dee2e6",
                display: "flex",
                gap: "20px",
              }}
            >
              <span>📊 Total: {alerts.length} alertes</span>
              <span style={{ color: "#ffc107" }}>
                ⚠️ Semi-payés:{" "}
                {alerts.filter((a) => a.type === "semi_payment").length}
              </span>
              <span style={{ color: "#dc3545" }}>
                🔴 Non-payés: {alerts.filter((a) => a.type === "unpaid").length}
              </span>
            </div>

            {alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  padding: "20px",
                  borderBottom: "1px solid #eee",
                  ...getAlertStyle(alert),
                }}
              >
                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                  <div style={{ fontSize: "24px" }}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: 0 }}>
                      {alert.title}
                      {alert.fromDatabase && (
                        <span
                          style={{
                            marginLeft: "10px",
                            fontSize: "10px",
                            background: "#17a2b8",
                            color: "white",
                            padding: "2px 6px",
                            borderRadius: "10px",
                          }}
                        >
                          DB
                        </span>
                      )}
                      <span
                        style={{
                          marginLeft: "10px",
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background:
                            alert.type === "semi_payment"
                              ? "#ffc107"
                              : "#dc3545",
                          color: "white",
                        }}
                      >
                        {alert.statusText ||
                          (alert.type === "semi_payment"
                            ? "Semi-payé"
                            : "Non payé")}
                      </span>
                    </h5>
                    <p style={{ margin: "8px 0" }}>{alert.message}</p>
                    {alert.total !== undefined && (
                      <div
                        style={{
                          display: "flex",
                          gap: "15px",
                          fontSize: "13px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>
                          💰 Total: <strong>{alert.total.toFixed(2)} DT</strong>
                        </span>
                        <span style={{ color: "#28a745" }}>
                          ✅ Payé: <strong>{alert.paid.toFixed(2)} DT</strong>
                        </span>
                        <span style={{ color: "#dc3545" }}>
                          ⚠️ Reste:{" "}
                          <strong>{alert.amount.toFixed(2)} DT</strong>
                        </span>
                        {alert.pourcentage && (
                          <span>📊 {alert.pourcentage.toFixed(0)}% payé</span>
                        )}
                      </div>
                    )}
                    {(alert.phone || alert.address) && (
                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "12px",
                          color: "#6c757d",
                        }}
                      >
                        {alert.phone && <span>📞 Tél: {alert.phone}</span>}
                        {alert.address && (
                          <span style={{ marginLeft: "15px" }}>
                            📍 Adresse: {alert.address}
                          </span>
                        )}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      {alert.patientId && (
                        <button
                          onClick={() => handlePaymentAction(alert.patientId)}
                          style={{
                            padding: "5px 12px",
                            background: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          <FaMoneyBillWave /> Gérer paiement
                        </button>
                      )}
                      {!alert.read && (
                        <button
                          onClick={() =>
                            alert.fromDatabase && alert.dbId
                              ? markDbAlertAsRead(alert.id, alert.dbId)
                              : markAsRead(alert.id)
                          }
                          style={{
                            padding: "5px 12px",
                            background: "#17a2b8",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          <FaCheckCircle size={12} /> Marquer lu
                        </button>
                      )}
                      <button
                        onClick={() => sendReminder(alert)}
                        style={{
                          padding: "5px 12px",
                          background: "#667eea",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        <FaEnvelope /> Rappel
                      </button>
                      <button
                        onClick={() => deleteAlert(alert)}
                        style={{
                          padding: "5px 12px",
                          background: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AlertsSection;
