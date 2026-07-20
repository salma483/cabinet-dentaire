// src/components/dashboard/Dashboard.jsx - VERSION COMPLÈTE MODIFIÉE
// ⭐ Toutes les fonctions de radiologie utilisent désormais API_CONFIG.RADIOLOGY_API

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

// Import des composants isolés
import Sidebar from "./Sidebar";
import DashboardHome from "./DashboardHome";
import PatientsList from "./PatientsList";
import AppointmentsList from "./AppointmentsList";
import PaymentsSection from "./PaymentsSection";
import AlertsSection from "./AlertsSection";
import ConsultationsSection from "./ConsultationsSection";
import Settings from "./Settings";
import AchatsSection from "./AchatsSection";

// Import des modals
import AddPatientModal from "./Modals/AddPatientModal";
import AppointmentModal from "./Modals/AppointmentModal";
import PaiementModal from "./Modals/PaiementModal";
import RadiographieModal from "./Modals/RadiographieModal";

// ⭐ IMPORT DE LA CONFIGURATION DES APIS
import API_CONFIG from "../../config";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    total_patients: 0,
    enfants: 0,
    adultes: 0,
    seniors: 0,
    paid: 0,
    unpaid: 0,
  });
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showRadiographieModal, setShowRadiographieModal] = useState(false);
  const [selectedPatientForPaiement, setSelectedPatientForPaiement] =
    useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Éviter les appels multiples
  const initialLoadDone = useRef(false);

  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [radiographies, setRadiographies] = useState([]);
  const [selectedRadioPatient, setSelectedRadioPatient] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [newPatient, setNewPatient] = useState({
    full_name: "",
    birth_date: "",
    phone: "",
    address: "",
  });
  const [newAppointment, setNewAppointment] = useState({
    patient_id: "",
    patient_name: "",
    appointment_date: new Date().toISOString().split("T")[0],
    appointment_time: "09:00",
    type: "Consultation",
    notes: "",
  });
  const [newRadiographie, setNewRadiographie] = useState({
    patient_id: "",
    description: "",
    image: null,
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [currentUser, setCurrentUser] = useState(user);
  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // ⭐⭐ Charger les patients
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      console.log("📋 Chargement des patients...");
      const response = await axios.get(
        `${API_CONFIG.DASHBOARD_API}/patients`,
        axiosConfig,
      );
      const patientsData = response.data;

      let paymentDetails = [];
      try {
        const paiementResponse = await axios.get(
          `${API_CONFIG.DASHBOARD_API}/paiements`,
          axiosConfig,
        );
        paymentDetails = paiementResponse.data || [];
      } catch (paymentError) {
        console.warn(
          "⚠️ Impossible de charger les détails de paiement:",
          paymentError,
        );
      }

      const mergedPatients = patientsData.map((patient) => {
        const paiement = paymentDetails.find((p) => p.id === patient.id);
        return {
          ...patient,
          montant_total:
            paiement?.montant_total !== undefined
              ? paiement.montant_total
              : patient.montant_total,
          montant_paye:
            paiement?.montant_paye !== undefined
              ? paiement.montant_paye
              : patient.montant_paye,
          montant_restant:
            paiement?.montant_restant !== undefined
              ? paiement.montant_restant
              : patient.montant_restant,
          paiement_status:
            paiement?.paiement_status || patient.paiement_status || "non_paye",
          type_paiement:
            paiement?.type_paiement || patient.type_paiement || "espece",
          cheque_info: paiement?.cheque_info || patient.cheque_info || null,
          notes: paiement?.notes || patient.notes || "",
          date_dernier_paiement:
            paiement?.date_dernier_paiement ||
            patient.date_dernier_paiement ||
            null,
        };
      });

      console.log("✅ Données patients chargées:", mergedPatients.length);
      setPatients(mergedPatients);

      setStats({
        total_patients: mergedPatients.length,
        enfants: mergedPatients.filter((p) => p.age && p.age < 18).length,
        adultes: mergedPatients.filter(
          (p) => p.age && p.age >= 18 && p.age < 65,
        ).length,
        seniors: mergedPatients.filter((p) => p.age && p.age >= 65).length,
        paid: mergedPatients.filter((p) => p.paiement_status === "paye").length,
        unpaid: mergedPatients.filter((p) => p.paiement_status === "non_paye")
          .length,
      });
    } catch (error) {
      console.error("❌ Erreur chargement patients:", error);
      toast.error("Erreur de chargement des patients");
    } finally {
      setLoading(false);
    }
  }, [axiosConfig]);

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_CONFIG.DASHBOARD_API}/appointments`,
        axiosConfig,
      );
      setAppointments(response.data);
    } catch (error) {
      console.error("Erreur appointments:", error);
    }
  }, [axiosConfig]);

  // ⭐⭐ Chargement initial UNE SEULE FOIS
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchPatients();
      fetchAppointments();
    }
  }, [fetchPatients, fetchAppointments]);

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Déconnexion réussie");
    setTimeout(() => navigate("/login"), 1000);
  };

  const handleAddPatient = async () => {
    if (!newPatient.full_name || newPatient.full_name.trim() === "") {
      toast.error("Le nom complet est requis");
      return;
    }

    try {
      await axios.post(
        `${API_CONFIG.DASHBOARD_API}/patients`,
        {
          full_name: newPatient.full_name,
          birth_date: newPatient.birth_date,
          phone: newPatient.phone,
          address: newPatient.address,
          paiement_status: "non_paye",
        },
        axiosConfig,
      );

      toast.success("Patient ajouté avec succès");
      setShowAddModal(false);
      setNewPatient({ full_name: "", birth_date: "", phone: "", address: "" });
      fetchPatients();
    } catch (error) {
      console.error("Erreur ajout patient:", error);
      toast.error(
        error.response?.data?.error || "Erreur lors de l'ajout du patient",
      );
    }
  };

  const handleAddAppointment = async () => {
    if (!newAppointment.patient_name) {
      toast.error("Le nom du patient est requis");
      return;
    }

    if (!newAppointment.appointment_date || !newAppointment.appointment_time) {
      toast.error("La date et l'heure sont requises");
      return;
    }

    try {
      await axios.post(
        `${API_CONFIG.DASHBOARD_API}/appointments`,
        newAppointment,
        axiosConfig,
      );
      toast.success("Rendez-vous ajouté avec succès");
      setShowAppointmentModal(false);
      fetchAppointments();
      setNewAppointment({
        patient_id: "",
        patient_name: "",
        appointment_date: new Date().toISOString().split("T")[0],
        appointment_time: "09:00",
        type: "Consultation",
        notes: "",
      });
    } catch (error) {
      toast.error("Erreur lors de l'ajout du rendez-vous");
      console.error(error);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (window.confirm("Supprimer ce rendez-vous ?")) {
      try {
        await axios.delete(
          `${API_CONFIG.DASHBOARD_API}/appointments/${id}`,
          axiosConfig,
        );
        toast.success("Rendez-vous supprimé");
        fetchAppointments();
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const handleDeletePatient = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce patient ?")) {
      try {
        await axios.delete(
          `${API_CONFIG.DASHBOARD_API}/patients/${id}`,
          axiosConfig,
        );
        toast.success("Patient supprimé");
        fetchPatients();
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  // ============ GESTION DES RADIOGRAPHIES (MODIFIÉES POUR UTILISER LA NOUVELLE API) ============

  const handleOpenRadiographies = async (patient) => {
    setSelectedRadioPatient(patient);
    await fetchRadiographies(patient.id);
    setShowRadiographieModal(true);
  };

  // ⭐⭐ FONCTION MODIFIÉE POUR UTILISER LA NOUVELLE API
  const fetchRadiographies = async (patientId) => {
    try {
      console.log("📋 Chargement radiographies pour patient:", patientId);
      const response = await axios.get(
        `${API_CONFIG.RADIOLOGY_API}/radiographies/${patientId}`,
        axiosConfig,
      );
      console.log("✅ Radiographies chargées:", response.data);
      setRadiographies(response.data);
    } catch (error) {
      console.error("❌ Erreur chargement:", error);
      toast.error("Erreur de chargement des radiographies");
    }
  };

  // ⭐⭐ FONCTION MODIFIÉE POUR L'UPLOAD
  const handleUploadRadiographie = async () => {
    if (!newRadiographie.image) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    if (!selectedRadioPatient || !selectedRadioPatient.id) {
      toast.error("Patient non identifié");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("patient_id", selectedRadioPatient.id.toString());
    formData.append("description", newRadiographie.description || "");
    formData.append("image", newRadiographie.image);

    try {
      const response = await axios.post(
        `${API_CONFIG.RADIOLOGY_API}/radiographies`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        },
      );

      if (response.data.success) {
        toast.success("Radiographie ajoutée avec succès");
        setNewRadiographie({
          patient_id: selectedRadioPatient.id,
          description: "",
          image: null,
        });
        await fetchRadiographies(selectedRadioPatient.id);
      } else {
        toast.error(response.data.error || "Erreur lors de l'upload");
      }
    } catch (error) {
      console.error("Erreur upload:", error);
      let errorMessage = "Erreur lors de l'upload";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // ⭐⭐ FONCTION MODIFIÉE POUR LA SUPPRESSION
  const handleDeleteRadiographie = async (id) => {
    if (window.confirm("Supprimer cette radiographie ?")) {
      try {
        await axios.delete(
          `${API_CONFIG.RADIOLOGY_API}/radiographies/${id}`,
          axiosConfig,
        );
        toast.success("Radiographie supprimée");
        if (selectedRadioPatient) {
          fetchRadiographies(selectedRadioPatient.id);
        }
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const handleFileChange = (e) => {
    setNewRadiographie({
      ...newRadiographie,
      image: e.target.files[0],
    });
  };

  const todayAppointments = appointments.filter(
    (apt) => apt.appointment_date === new Date().toISOString().split("T")[0],
  );

  const renderContent = () => {
    if (loading && activeTab === "patients") {
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
              margin: "0 auto 20px",
            }}
          ></div>
          <p>Chargement des patients...</p>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardHome
            stats={stats}
            patients={patients}
            todayAppointments={todayAppointments}
            setDateFilter={setDateFilter}
            setActiveTab={setActiveTab}
            setShowAppointmentModal={setShowAppointmentModal}
            setNewAppointment={setNewAppointment}
          />
        );
      case "patients":
        return (
          <PatientsList
            patients={patients}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            setShowAddModal={setShowAddModal}
            handleOpenRadiographies={handleOpenRadiographies}
            setNewAppointment={setNewAppointment}
            setShowAppointmentModal={setShowAppointmentModal}
            handleDeletePatient={handleDeletePatient}
            setSelectedPatientForPaiement={setSelectedPatientForPaiement}
            setShowPaiementModal={setShowPaiementModal}
          />
        );
      case "consultations":
        return <ConsultationsSection patients={patients} />;
      case "appointments":
        return (
          <AppointmentsList
            appointments={appointments}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            setShowAppointmentModal={setShowAppointmentModal}
            handleDeleteAppointment={handleDeleteAppointment}
          />
        );
      case "payments":
        return (
          <PaymentsSection
            patients={patients}
            setSelectedPatientForPaiement={setSelectedPatientForPaiement}
            setShowPaiementModal={setShowPaiementModal}
          />
        );
      case "alerts":
        return (
          <AlertsSection appointments={appointments} patients={patients} />
        );
      case "settings":
        return <Settings user={currentUser} onUpdate={handleUpdateUser} />;
      case "achats":
        return <AchatsSection />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f2f5" }}>
      <Toaster position="top-right" />
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />

      <div style={{ marginLeft: "280px", flex: 1, padding: "20px" }}>
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "15px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>
              Bonjour Dr. {user.full_name?.split(" ")[1] || "Ayadi"} 👨‍⚕️
            </h3>
            <p style={{ margin: "5px 0 0", color: "#6c757d" }}>
              Bienvenue dans votre cabinet dentaire
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "20px",
                background: "#667eea",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {user.full_name?.charAt(0) || "D"}
            </div>
          </div>
        </div>

        {renderContent()}
      </div>

      {/* Modals */}
      <AddPatientModal
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        newPatient={newPatient}
        setNewPatient={setNewPatient}
        handleAddPatient={handleAddPatient}
      />

      <AppointmentModal
        showAppointmentModal={showAppointmentModal}
        setShowAppointmentModal={setShowAppointmentModal}
        newAppointment={newAppointment}
        setNewAppointment={setNewAppointment}
        patients={patients}
        handleAddAppointment={handleAddAppointment}
      />

      <PaiementModal
        showPaiementModal={showPaiementModal}
        setShowPaiementModal={setShowPaiementModal}
        selectedPatientForPaiement={selectedPatientForPaiement}
        onPaymentSuccess={() => {
          fetchPatients();
        }}
      />

      <RadiographieModal
        showRadiographieModal={showRadiographieModal}
        setShowRadiographieModal={setShowRadiographieModal}
        selectedRadioPatient={selectedRadioPatient}
        radiographies={radiographies}
        newRadiographie={newRadiographie}
        setNewRadiographie={setNewRadiographie}
        uploading={uploading}
        handleFileChange={handleFileChange}
        handleUploadRadiographie={handleUploadRadiographie}
        handleDeleteRadiographie={handleDeleteRadiographie}
      />
    </div>
  );
};

export default Dashboard;
