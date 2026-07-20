import React, { useState } from "react";
import {
  FaTimesCircle,
  FaSave,
  FaStethoscope,
  FaNotesMedical,
  FaPrescription,
  FaThermometer,
} from "react-icons/fa";
import { getBackendUrl } from "../../../utils/getBackendUrl";

const ConsultationModal = ({
  showConsultationModal,
  setShowConsultationModal,
  selectedPatient,
}) => {
  const [consultationData, setConsultationData] = useState({
    date: new Date().toISOString().split("T")[0],
    diagnostic: "",
    prescription: "",
    notes: "",
    tension: "",
    poids: "",
    temperature: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!showConsultationModal || !selectedPatient) return null;

  const handleChange = (e) => {
    setConsultationData({
      ...consultationData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${getBackendUrl()}/api/consultations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          ...consultationData,
        }),
      });

      if (response.ok) {
        alert("Consultation enregistrée avec succès");
        setShowConsultationModal(false);
        setConsultationData({
          date: new Date().toISOString().split("T")[0],
          diagnostic: "",
          prescription: "",
          notes: "",
          tension: "",
          poids: "",
          temperature: "",
        });
      } else {
        alert("Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

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
          width: "600px",
          maxWidth: "90%",
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
          }}
        >
          <h4
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <FaStethoscope /> Consultation médicale
          </h4>
          <button
            onClick={() => setShowConsultationModal(false)}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#6c757d",
            }}
          >
            <FaTimesCircle />
          </button>
        </div>

        <div
          style={{
            background: "#f8f9fa",
            padding: "15px",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          <p>
            <strong>Patient:</strong> {selectedPatient.full_name}
          </p>
          <p>
            <strong>Âge:</strong> {selectedPatient.age || "-"} ans
          </p>
          <p>
            <strong>Téléphone:</strong> {selectedPatient.phone || "-"}
          </p>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            📅 Date de consultation
          </label>
          <input
            type="date"
            name="date"
            value={consultationData.date}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ced4da",
              fontSize: "14px",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              <FaThermometer /> Température
            </label>
            <input
              type="text"
              name="temperature"
              placeholder="36.5 °C"
              value={consultationData.temperature}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px",
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
                fontWeight: "bold",
              }}
            >
              ⚖️ Poids (kg)
            </label>
            <input
              type="text"
              name="poids"
              placeholder="70 kg"
              value={consultationData.poids}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px",
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
                fontWeight: "bold",
              }}
            >
              💓 Tension artérielle
            </label>
            <input
              type="text"
              name="tension"
              placeholder="120/80"
              value={consultationData.tension}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ced4da",
                fontSize: "14px",
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            <FaNotesMedical /> Diagnostic
          </label>
          <textarea
            name="diagnostic"
            placeholder="Diagnostic du patient..."
            value={consultationData.diagnostic}
            onChange={handleChange}
            rows="4"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ced4da",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            <FaPrescription /> Prescription / Traitement
          </label>
          <textarea
            name="prescription"
            placeholder="Prescription médicale..."
            value={consultationData.prescription}
            onChange={handleChange}
            rows="4"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ced4da",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            📝 Notes supplémentaires
          </label>
          <textarea
            name="notes"
            placeholder="Notes additionnelles..."
            value={consultationData.notes}
            onChange={handleChange}
            rows="3"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ced4da",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "12px",
              background: isLoading ? "#6c757d" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <FaSave />{" "}
            {isLoading ? "Enregistrement..." : "Enregistrer la consultation"}
          </button>
          <button
            onClick={() => setShowConsultationModal(false)}
            style={{
              padding: "12px 20px",
              background: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultationModal;
