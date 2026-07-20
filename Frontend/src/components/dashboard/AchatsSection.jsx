// src/components/dashboard/Achats.jsx
import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaShoppingCart,
  FaExclamationTriangle,
  FaCheckCircle,
  FaMinusCircle,
  FaChartLine,
  FaBoxes,
  FaDollarSign,
  FaTools,
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { getBackendUrl } from "../../utils/getBackendUrl";

const AchatsSection = () => {
  const [achats, setAchats] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedAchat, setSelectedAchat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    prix_unitaire: "",
    quantite_achetee: "",
    quantite_disponible: "",
    description: "",
    fournisseur: "",
    date_expiration: "",
    alerte_stock: 5,
  });
  const [stockData, setStockData] = useState({
    type: "entree",
    quantite: "",
    raison: "",
  });

  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchAchats();
    fetchStats();
  }, []);

  const fetchAchats = async () => {
    try {
      const response = await axios.get(
        `${getBackendUrl()}/api/medicaments`,
        axiosConfig,
      );
      setAchats(response.data);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de chargement des achats");
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${getBackendUrl()}/api/medicaments/stats`,
        axiosConfig,
      );
      setStats(response.data);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedAchat) {
        await axios.put(
          `${getBackendUrl()}/api/medicaments/${selectedAchat.id}`,
          formData,
          axiosConfig,
        );
        toast.success("Achat mis à jour");
      } else {
        await axios.post(
          `${getBackendUrl()}/api/medicaments`,
          formData,
          axiosConfig,
        );
        toast.success("Achat ajouté");
      }
      resetModal();
      fetchAchats();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(
        `${getBackendUrl()}/api/medicaments/${selectedAchat.id}/stock`,
        stockData,
        axiosConfig,
      );
      toast.success(
        `Stock ${stockData.type === "entree" ? "ajouté" : "retiré"} avec succès`,
      );
      setShowStockModal(false);
      fetchAchats();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet achat ?")) {
      try {
        await axios.delete(
          `${getBackendUrl()}/api/medicaments/${id}`,
          axiosConfig,
        );
        toast.success("Achat supprimé");
        fetchAchats();
        fetchStats();
      } catch (error) {
        toast.error("Erreur de suppression");
      }
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setSelectedAchat(null);
    setFormData({
      nom: "",
      prix_unitaire: "",
      quantite_achetee: "",
      quantite_disponible: "",
      description: "",
      fournisseur: "",
      date_expiration: "",
      alerte_stock: 5,
    });
  };

  const openEditModal = (achat) => {
    setSelectedAchat(achat);
    setFormData({
      nom: achat.nom,
      prix_unitaire: achat.prix_unitaire,
      quantite_achetee: achat.quantite_achetee,
      quantite_disponible: achat.quantite_disponible,
      description: achat.description || "",
      fournisseur: achat.fournisseur || "",
      date_expiration: achat.date_expiration
        ? achat.date_expiration.split("T")[0]
        : "",
      alerte_stock: achat.alerte_stock,
    });
    setShowModal(true);
  };

  const openStockModal = (achat) => {
    setSelectedAchat(achat);
    setStockData({ type: "entree", quantite: "", raison: "" });
    setShowStockModal(true);
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case "disponible":
        return (
          <span
            style={{
              background: "#d4edda",
              color: "#155724",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
            }}
          >
            <FaCheckCircle size={10} /> Disponible
          </span>
        );
      case "stock_faible":
        return (
          <span
            style={{
              background: "#fff3cd",
              color: "#856404",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
            }}
          >
            <FaExclamationTriangle size={10} /> Stock faible
          </span>
        );
      case "rupture":
        return (
          <span
            style={{
              background: "#f8d7da",
              color: "#721c24",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
            }}
          >
            <FaMinusCircle size={10} /> Rupture
          </span>
        );
      default:
        return <span>{statut}</span>;
    }
  };

  const filteredAchats = achats.filter(
    (a) =>
      a.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.fournisseur &&
        a.fournisseur.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div>
      {/* Statistiques */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{ background: "white", padding: "20px", borderRadius: "15px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ color: "#6c757d", marginBottom: "5px" }}>
                Total Achats
              </p>
              <h2 style={{ margin: 0 }}>{stats.total_medicaments || 0}</h2>
            </div>
            <FaShoppingCart size={35} color="#667eea" opacity={0.5} />
          </div>
        </div>
        <div
          style={{ background: "white", padding: "20px", borderRadius: "15px" }}
        >
          <div>
            <p style={{ color: "#6c757d", marginBottom: "5px" }}>En Stock</p>
            <h2 style={{ margin: 0, color: "#28a745" }}>
              {stats.disponibles || 0}
            </h2>
          </div>
        </div>
        <div
          style={{ background: "white", padding: "20px", borderRadius: "15px" }}
        >
          <div>
            <p style={{ color: "#6c757d", marginBottom: "5px" }}>
              Stock Faible
            </p>
            <h2 style={{ margin: 0, color: "#ffc107" }}>
              {stats.stock_faible || 0}
            </h2>
          </div>
        </div>
        <div
          style={{ background: "white", padding: "20px", borderRadius: "15px" }}
        >
          <div>
            <p style={{ color: "#6c757d", marginBottom: "5px" }}>
              Valeur Stock
            </p>
            <h2 style={{ margin: 0, color: "#667eea" }}>
              {stats.valeur_stock || 0} DT
            </h2>
          </div>
        </div>
      </div>

      {/* Header */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "15px",
          marginBottom: "20px",
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
          <h3
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <FaTools color="#667eea" /> Gestion des Achats & Stock
          </h3>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaPlus /> Ajouter un achat
          </button>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <FaSearch
            style={{
              position: "absolute",
              left: "15px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6c757d",
            }}
          />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 15px 12px 45px",
              border: "2px solid #dee2e6",
              borderRadius: "10px",
              fontSize: "14px",
            }}
          />
        </div>
      </div>

      {/* Liste des achats */}
      <div
        style={{
          background: "white",
          borderRadius: "15px",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8f9fa" }}>
            <tr>
              <th style={{ padding: "15px", textAlign: "left" }}>
                Nom du produit
              </th>
              <th style={{ padding: "15px", textAlign: "left" }}>
                Prix Unitaire
              </th>
              <th style={{ padding: "15px", textAlign: "left" }}>Quantité</th>
              <th style={{ padding: "15px", textAlign: "left" }}>
                Valeur Stock
              </th>
              <th style={{ padding: "15px", textAlign: "left" }}>Statut</th>
              <th style={{ padding: "15px", textAlign: "left" }}>
                Fournisseur
              </th>
              <th style={{ padding: "15px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAchats.map((achat) => (
              <tr key={achat.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                <td style={{ padding: "15px" }}>
                  <strong>{achat.nom}</strong>
                  {achat.description && (
                    <div style={{ fontSize: "12px", color: "#6c757d" }}>
                      {achat.description}
                    </div>
                  )}
                </td>
                <td style={{ padding: "15px" }}>{achat.prix_unitaire} DT</td>
                <td style={{ padding: "15px" }}>
                  <strong>{achat.quantite_disponible}</strong>
                  <div style={{ fontSize: "11px", color: "#6c757d" }}>
                    Acheté: {achat.quantite_achetee}
                  </div>
                </td>
                <td style={{ padding: "15px" }}>
                  {(achat.prix_unitaire * achat.quantite_disponible).toFixed(2)}{" "}
                  DT
                </td>
                <td style={{ padding: "15px" }}>
                  {getStatutBadge(achat.statut)}
                </td>
                <td style={{ padding: "15px" }}>{achat.fournisseur || "-"}</td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <button
                    onClick={() => openStockModal(achat)}
                    style={{
                      background: "#28a745",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "5px",
                      marginRight: "5px",
                      cursor: "pointer",
                    }}
                    title="Gérer le stock"
                  >
                    <FaBoxes />
                  </button>
                  <button
                    onClick={() => openEditModal(achat)}
                    style={{
                      background: "#ffc107",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "5px",
                      marginRight: "5px",
                      cursor: "pointer",
                    }}
                    title="Modifier"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(achat.id)}
                    style={{
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                    title="Supprimer"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Ajout/Modification */}
      {showModal && (
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
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "30px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {selectedAchat ? "Modifier" : "Ajouter"} un achat
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "15px" }}>
                <label>Nom du produit *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                  marginBottom: "15px",
                }}
              >
                <div>
                  <label>Prix unitaire (DT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prix_unitaire}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prix_unitaire: e.target.value,
                      })
                    }
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "2px solid #dee2e6",
                      borderRadius: "8px",
                    }}
                  />
                </div>
                <div>
                  <label>Quantité disponible</label>
                  <input
                    type="number"
                    value={formData.quantite_disponible}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantite_disponible: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "2px solid #dee2e6",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                  marginBottom: "15px",
                }}
              >
                <div>
                  <label>Quantité achetée</label>
                  <input
                    type="number"
                    value={formData.quantite_achetee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantite_achetee: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "2px solid #dee2e6",
                      borderRadius: "8px",
                    }}
                  />
                </div>
                <div>
                  <label>Seuil d'alerte</label>
                  <input
                    type="number"
                    value={formData.alerte_stock}
                    onChange={(e) =>
                      setFormData({ ...formData, alerte_stock: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "2px solid #dee2e6",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label>Fournisseur</label>
                <input
                  type="text"
                  value={formData.fournisseur}
                  onChange={(e) =>
                    setFormData({ ...formData, fournisseur: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label>Date d'expiration</label>
                <input
                  type="date"
                  value={formData.date_expiration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date_expiration: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={resetModal}
                  style={{
                    padding: "10px 20px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  {loading
                    ? "Chargement..."
                    : selectedAchat
                      ? "Modifier"
                      : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gestion Stock */}
      {showStockModal && (
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
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "30px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Gérer le stock: {selectedAchat?.nom}
            </h3>
            <form onSubmit={handleStockUpdate}>
              <div style={{ marginBottom: "15px" }}>
                <label>Type d'opération</label>
                <select
                  value={stockData.type}
                  onChange={(e) =>
                    setStockData({ ...stockData, type: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                  }}
                >
                  <option value="entree">➕ Entrée (Ajout)</option>
                  <option value="sortie">➖ Sortie (Retrait)</option>
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label>Quantité</label>
                <input
                  type="number"
                  value={stockData.quantite}
                  onChange={(e) =>
                    setStockData({ ...stockData, quantite: e.target.value })
                  }
                  required
                  min="1"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label>Raison</label>
                <input
                  type="text"
                  value={stockData.raison}
                  onChange={(e) =>
                    setStockData({ ...stockData, raison: e.target.value })
                  }
                  placeholder="Ex: Nouvel achat, Utilisation patient..."
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  style={{
                    padding: "10px 20px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: "#28a745",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  {loading ? "Chargement..." : "Valider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchatsSection;
