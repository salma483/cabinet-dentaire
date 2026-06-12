// src/components/dashboard/Modals/PaiementModal.jsx
import React, { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyBill,
  FaHistory,
  FaSave,
  FaExclamationTriangle,
  FaInfoCircle,
  FaMoneyBillWave,
  FaRegCreditCard,
} from "react-icons/fa";
import toast from "react-hot-toast";

const PaiementModal = ({
  showPaiementModal,
  setShowPaiementModal,
  selectedPatientForPaiement,
  onPaymentSuccess,
}) => {
  const [montantTotal, setMontantTotal] = useState("");
  const [montantPaye, setMontantPaye] = useState("");
  const [montantReste, setMontantReste] = useState(0);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [error, setError] = useState("");

  // Nouveaux états pour le type de paiement
  const [typePaiement, setTypePaiement] = useState("espece");
  const [chequeInfo, setChequeInfo] = useState({
    numero: "",
    banque: "",
    date_emission: "",
    montant_cheque: "",
  });
  const [showChequeFields, setShowChequeFields] = useState(false);

  useEffect(() => {
    if (selectedPatientForPaiement && showPaiementModal) {
      setMontantTotal("");
      setMontantPaye("");
      setMontantReste(0);
      setNotes("");
      setError("");
      setTypePaiement("espece");
      setShowChequeFields(false);
      setChequeInfo({
        numero: "",
        banque: "",
        date_emission: "",
        montant_cheque: "",
      });
      setPaymentHistory([]);
      setShowHistory(false);

      fetchPaymentHistory(selectedPatientForPaiement.id);
    } else if (!showPaiementModal) {
      setShowHistory(false);
      setPaymentHistory([]);
    }
  }, [selectedPatientForPaiement, showPaiementModal]);

  const fetchPaymentHistory = async (patientId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/paiements/${patientId}/payment-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) {
        const history = await response.json();
        setPaymentHistory(history || []);
      } else {
        console.warn("Historique non disponible");
        setPaymentHistory([]);
      }
    } catch (error) {
      console.error("Erreur chargement historique:", error);
      setPaymentHistory([]);
    }
  };

  if (!showPaiementModal || !selectedPatientForPaiement) return null;

  const handleMontantTotalChange = (value) => {
    const newTotal = parseFloat(value) || 0;
    const currentPaye = parseFloat(montantPaye) || 0;
    setMontantTotal(value);
    const reste = newTotal - currentPaye;
    setMontantReste(reste < 0 ? 0 : reste);
    setError("");
  };

  const handleMontantPayeChange = (value) => {
    const newPaye = parseFloat(value) || 0;
    const currentTotal = parseFloat(montantTotal) || 0;
    setMontantPaye(value);
    const reste = currentTotal - newPaye;
    setMontantReste(reste < 0 ? 0 : reste);
    setError("");

    // Mettre à jour automatiquement le montant du chèque si mode chèque
    if (typePaiement === "cheque") {
      setChequeInfo((prev) => ({ ...prev, montant_cheque: value }));
    }
  };

  const handleTypePaiementChange = (type) => {
    setTypePaiement(type);
    setShowChequeFields(type === "cheque");

    if (type === "cheque") {
      // Quand on passe en mode chèque, initialiser le montant avec la valeur actuelle
      setChequeInfo((prev) => ({
        ...prev,
        montant_cheque: montantPaye,
        numero: "",
        banque: "",
        date_emission: "",
      }));
    } else {
      // En mode espèces, on peut effacer les infos chèque
      setChequeInfo({
        numero: "",
        banque: "",
        date_emission: "",
        montant_cheque: montantPaye,
      });
    }
  };

  const handleChequeInfoChange = (field, value) => {
    setChequeInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const total = parseFloat(montantTotal);
    const paye = parseFloat(montantPaye);

    if (isNaN(total) || total < 0) {
      setError("Veuillez entrer un montant total valide");
      return;
    }

    if (isNaN(paye) || paye < 0) {
      setError("Veuillez entrer un montant payé valide");
      return;
    }

    if (paye > total) {
      setError("Le montant payé ne peut pas dépasser le montant total");
      return;
    }

    // Validation des informations chèque
    if (typePaiement === "cheque") {
      if (!chequeInfo.numero || !chequeInfo.banque) {
        setError(
          "Veuillez remplir les informations du chèque (numéro et banque)",
        );
        return;
      }
      const montantCheque = parseFloat(chequeInfo.montant_cheque) || 0;
      if (montantCheque !== paye) {
        setError("Le montant du chèque doit correspondre au montant payé");
        return;
      }
    }

    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const requestBody = {
        montant_total: total,
        montant_paye: paye,
        notes: notes,
        type_paiement: typePaiement,
        cheque_info:
          typePaiement === "cheque"
            ? {
                numero: chequeInfo.numero,
                banque: chequeInfo.banque,
                date_emission: chequeInfo.date_emission,
                montant_cheque: parseFloat(chequeInfo.montant_cheque) || 0,
              }
            : null,
      };

      console.log("📤 Envoi requête paiement:", requestBody);

      const response = await fetch(
        `http://localhost:5000/api/paiements/${selectedPatientForPaiement.id}/payment`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      console.log("📥 Réponse reçue:", data);

      const notificationPhone =
        data.notification?.phone || selectedPatientForPaiement?.phone;
      const notificationAddress =
        data.notification?.address || selectedPatientForPaiement?.address;
      const contactLines = [];
      if (notificationPhone) contactLines.push(`📞 ${notificationPhone}`);
      if (notificationAddress) contactLines.push(`📍 ${notificationAddress}`);

      // Afficher la notification avec le type de paiement
      if (data.notification) {
        if (data.notification.type === "success") {
          toast.success(
            `${data.notification.message}${contactLines.length ? "\n" + contactLines.join(" • ") : ""}`,
          );
        } else if (data.notification.type === "warning") {
          toast(
            (t) => (
              <div style={{ maxWidth: "400px" }}>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginBottom: "10px",
                    color: "#856404",
                  }}
                >
                  {data.notification.title}
                </div>
                <div style={{ fontSize: "14px", marginBottom: "5px" }}>
                  {data.notification.message}
                </div>
                {(data.notification.phone || notificationPhone) && (
                  <div style={{ fontSize: "14px", marginBottom: "5px" }}>
                    📞 Téléphone: {data.notification.phone || notificationPhone}
                  </div>
                )}
                {(data.notification.address || notificationAddress) && (
                  <div style={{ fontSize: "14px", marginBottom: "5px" }}>
                    📍 Adresse:{" "}
                    {data.notification.address || notificationAddress}
                  </div>
                )}
                <button
                  onClick={() => toast.dismiss(t.id)}
                  style={{
                    marginTop: "10px",
                    padding: "5px 15px",
                    background: "#ffc107",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Fermer
                </button>
              </div>
            ),
            {
              duration: 10000,
              style: {
                background: "#fff3cd",
                color: "#856404",
                border: "1px solid #ffeeba",
              },
            },
          );
        } else if (data.notification.type === "alert") {
          toast.error(data.notification.message);
        }
      } else {
        const typeMessage =
          typePaiement === "espece"
            ? "💰 Espèces"
            : typePaiement === "cheque"
              ? `📝 Chèque N°${chequeInfo.numero}`
              : "💳 Mixte";
        const statutMessage =
          data.patient?.paiement_status === "paye"
            ? "Payé ✅"
            : data.patient?.paiement_status === "semi_paye"
              ? "Semi-payé ⚠️"
              : "Non payé ❌";
        toast.success(
          `${typeMessage} - ${statutMessage}${contactLines.length ? "\n" + contactLines.join(" • ") : ""}`,
        );
      }

      if (typeof onPaymentSuccess === "function") {
        onPaymentSuccess();
      }
      setShowPaiementModal(false);
    } catch (error) {
      console.error("Erreur:", error);
      setError(error.message || "Erreur lors de la mise à jour du paiement");
      toast.error(error.message || "Erreur lors de la mise à jour du paiement");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatutInfo = () => {
    const total = parseFloat(montantTotal) || 0;
    const paye = parseFloat(montantPaye) || 0;
    const reste = total - paye;

    if (reste <= 0.01 && total > 0) {
      return { text: "Payé ✅", color: "#28a745", bg: "#d4edda" };
    } else if (paye > 0 && reste > 0) {
      return { text: "Semi-payé ⚠️", color: "#856404", bg: "#fff3cd" };
    } else if (total > 0 && paye === 0) {
      return { text: "Non payé ❌", color: "#721c24", bg: "#f8d7da" };
    } else {
      return { text: "Aucun montant défini", color: "#6c757d", bg: "#e9ecef" };
    }
  };

  const statutInfo = getStatutInfo();
  const total = parseFloat(montantTotal) || 0;
  const paye = parseFloat(montantPaye) || 0;
  const pourcentage = total > 0 ? (paye / total) * 100 : 0;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "15px",
          width: "650px",
          maxWidth: "95%",
          maxHeight: "90%",
          overflowY: "auto",
          padding: "25px",
        }}
      >
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
          <h4 style={{ margin: 0 }}>Gestion du paiement</h4>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                background: "#6c757d",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <FaHistory />
              {showHistory ? "Masquer" : "Afficher"} historique
            </button>
            <button
              onClick={() => setShowPaiementModal(false)}
              style={{
                background: "#dc3545",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              <FaTimesCircle /> Fermer
            </button>
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "15px",
            borderRadius: "10px",
            marginBottom: "20px",
            color: "white",
          }}
        >
          <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>Patient</p>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            {selectedPatientForPaiement.full_name}
          </p>
          {selectedPatientForPaiement.phone && (
            <p style={{ margin: "5px 0 0 0", fontSize: "12px", opacity: 0.8 }}>
              📞 {selectedPatientForPaiement.phone}
            </p>
          )}
          {selectedPatientForPaiement.address && (
            <p style={{ margin: "5px 0 0 0", fontSize: "12px", opacity: 0.8 }}>
              📍 {selectedPatientForPaiement.address}
            </p>
          )}
        </div>

        {error && (
          <div
            style={{
              background: "#f8d7da",
              color: "#721c24",
              padding: "10px",
              borderRadius: "5px",
              marginBottom: "15px",
              fontSize: "14px",
            }}
          >
            <FaExclamationTriangle style={{ marginRight: "5px" }} />
            {error}
          </div>
        )}

        {showHistory && (
          <div
            style={{
              background: "#f8f9fa",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "20px",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            <h6
              style={{
                margin: "0 0 10px 0",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <FaHistory /> Historique des paiements
            </h6>
            {paymentHistory && paymentHistory.length > 0 ? (
              paymentHistory.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: "12px",
                    padding: "8px 0",
                    borderBottom: "1px solid #dee2e6",
                  }}
                >
                  <div>
                    <strong>
                      {new Date(item.created_at).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    Total: {parseFloat(item.montant_total).toFixed(2)} DT |
                    Payé: {parseFloat(item.montant_paye).toFixed(2)} DT | Reste:{" "}
                    {parseFloat(item.montant_restant).toFixed(2)} DT
                  </div>
                  <div>
                    Mode:{" "}
                    {item.type_paiement === "espece"
                      ? "💰 Espèces"
                      : item.type_paiement === "cheque"
                        ? `📝 Chèque${item.cheque_info?.numero ? ` N°${item.cheque_info.numero}` : ""}`
                        : "💳 Mixte"}
                  </div>
                  <div>
                    Statut:{" "}
                    <span style={{ fontWeight: "bold" }}>
                      {(item.status || item.statut || item.paiement_status) ===
                      "paye"
                        ? "✅ Payé"
                        : (item.status ||
                              item.statut ||
                              item.paiement_status) === "semi_paye"
                          ? "⚠️ Semi-payé"
                          : "❌ Non payé"}
                    </span>
                  </div>
                  {item.notes && (
                    <div>
                      <em>📝 {item.notes}</em>
                    </div>
                  )}
                  {item.created_by && (
                    <div>
                      <small>👤 Par: {item.created_by}</small>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center", color: "#6c757d", margin: 0 }}>
                Aucun historique disponible
              </p>
            )}
          </div>
        )}

        <div
          style={{
            background: "#f8f9fa",
            padding: "20px",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          {/* Section Type de paiement */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontWeight: "bold",
              }}
            >
              💳 Mode de paiement
            </label>

            <div style={{ display: "flex", gap: "15px" }}>
              <button
                type="button"
                onClick={() => handleTypePaiementChange("espece")}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: typePaiement === "espece" ? "#28a745" : "#e9ecef",
                  color: typePaiement === "espece" ? "white" : "#495057",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontWeight: "bold",
                  transition: "all 0.3s",
                }}
              >
                <FaMoneyBillWave /> Espèces
              </button>
              <button
                type="button"
                onClick={() => handleTypePaiementChange("cheque")}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: typePaiement === "cheque" ? "#17a2b8" : "#e9ecef",
                  color: typePaiement === "cheque" ? "white" : "#495057",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontWeight: "bold",
                  transition: "all 0.3s",
                }}
              >
                <FaRegCreditCard /> Chèque
              </button>
            </div>

            {/* Champs pour chèque */}
            {showChequeFields && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "15px",
                  background: "white",
                  borderRadius: "8px",
                  border: "1px solid #dee2e6",
                }}
              >
                <h6 style={{ margin: "0 0 10px 0", color: "#17a2b8" }}>
                  Informations du chèque
                </h6>

                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    Numéro de chèque *
                  </label>
                  <input
                    type="text"
                    value={chequeInfo.numero}
                    onChange={(e) =>
                      handleChequeInfoChange("numero", e.target.value)
                    }
                    placeholder="Ex: 1234567"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "5px",
                      border: "1px solid #ced4da",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    Banque *
                  </label>
                  <input
                    type="text"
                    value={chequeInfo.banque}
                    onChange={(e) =>
                      handleChequeInfoChange("banque", e.target.value)
                    }
                    placeholder="Nom de la banque"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "5px",
                      border: "1px solid #ced4da",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    Date d'émission
                  </label>
                  <input
                    type="date"
                    value={chequeInfo.date_emission}
                    onChange={(e) =>
                      handleChequeInfoChange("date_emission", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "5px",
                      border: "1px solid #ced4da",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    Montant du chèque (DT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={chequeInfo.montant_cheque}
                    onChange={(e) =>
                      handleChequeInfoChange("montant_cheque", e.target.value)
                    }
                    placeholder="Montant"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "5px",
                      border: "1px solid #ced4da",
                      fontSize: "14px",
                    }}
                  />
                  <small style={{ color: "#6c757d", fontSize: "11px" }}>
                    Doit correspondre au montant payé : {montantPaye} DT
                  </small>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              💰 Montant total (DT)
            </label>
            <input
              type="number"
              step="0.01"
              value={montantTotal}
              onChange={(e) => handleMontantTotalChange(e.target.value)}
              placeholder="0.00"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ced4da",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
            <small style={{ color: "#6c757d", fontSize: "11px" }}>
              Définissez le montant total du traitement
            </small>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              ✅ Montant déjà payé (DT)
            </label>
            <input
              type="number"
              step="0.01"
              value={montantPaye}
              onChange={(e) => handleMontantPayeChange(e.target.value)}
              placeholder="0.00"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ced4da",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Barre de progression */}
          {total > 0 && (
            <div style={{ marginBottom: "15px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "5px",
                  fontSize: "12px",
                }}
              >
                <span>Progression</span>
                <span>{pourcentage.toFixed(1)}%</span>
              </div>
              <div
                style={{
                  background: "#e9ecef",
                  borderRadius: "10px",
                  overflow: "hidden",
                  height: "8px",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(pourcentage, 100)}%`,
                    height: "100%",
                    background:
                      pourcentage >= 100
                        ? "#28a745"
                        : pourcentage > 0
                          ? "#ffc107"
                          : "#dc3545",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              📝 Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter une note sur ce paiement..."
              rows="3"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ced4da",
                fontSize: "14px",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div
            style={{
              background: statutInfo.bg,
              padding: "15px",
              borderRadius: "10px",
              marginTop: "15px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <span style={{ fontWeight: "bold" }}>💰 Montant restant:</span>
              <strong
                style={{
                  color: montantReste > 0.01 ? "#dc3545" : "#28a745",
                  fontSize: "18px",
                }}
              >
                {Math.max(0, montantReste).toFixed(2)} DT
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <span style={{ fontWeight: "bold" }}>📊 Statut automatique:</span>
              <span
                style={{
                  background: statutInfo.bg,
                  color: statutInfo.color,
                  padding: "5px 15px",
                  borderRadius: "20px",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                {statutInfo.text}
              </span>
            </div>
          </div>

          <div
            style={{
              background: "#e7f3ff",
              padding: "10px",
              borderRadius: "8px",
              marginTop: "15px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#004085",
            }}
          >
            <FaInfoCircle />
            <span>
              Le statut se met à jour automatiquement :<strong> Payé</strong>{" "}
              (reste = 0),
              <strong> Semi-payé</strong> (payé {">"} 0 et reste {">"} 0),
              <strong> Non payé</strong> (payé = 0 et total {">"} 0)
            </span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "14px",
            background: isLoading ? "#6c757d" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          <FaSave />{" "}
          {isLoading ? "Enregistrement..." : "Enregistrer le paiement"}
        </button>
      </div>
    </div>
  );
};

// EXPORT PAR DÉFAUT - C'EST CE QUI MANQUAIT !
export default PaiementModal;
