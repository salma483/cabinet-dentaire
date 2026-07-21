// frontend/src/components/dashboard/Modals/ImportExcelModal.jsx
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { FaTimes, FaFileExcel, FaUpload, FaCheckCircle, FaExclamationTriangle, FaDownload } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_CONFIG from '../../../config';

const ImportExcelModal = ({ show, setShow, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importStats, setImportStats] = useState(null);
  const [step, setStep] = useState(1);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem('token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const downloadTemplate = () => {
    const template = [
      ['full_name', 'birth_date', 'phone', 'address', 'paiement_status'],
      ['John Doe', '1990-01-01', '12345678', 'Adresse 1', 'non_paye'],
      ['Jane Smith', '1985-05-15', '87654321', 'Adresse 2', 'paye'],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(template);
    XLSX.utils.book_append_sheet(wb, ws, 'Patients');
    ws['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
    ];
    XLSX.writeFile(wb, 'template_import_patients.xlsx');
    toast.success('Template téléchargé !');
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      toast.error('Veuillez sélectionner un fichier Excel (.xlsx, .xls) ou CSV');
      return;
    }

    setFile(selectedFile);
    readExcelFile(selectedFile);
  };

  const readExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length === 0) {
          toast.error('Le fichier est vide');
          return;
        }

        const standardizedData = jsonData.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            const normalizedKey = key.toLowerCase().trim().replace(/[^a-z]/g, '');
            
            if (['full_name', 'nomcomplet', 'nom', 'patient', 'name'].includes(normalizedKey)) {
              newRow.full_name = row[key];
            } else if (['birth_date', 'datedenaissance', 'birthdate', 'birth', 'age'].includes(normalizedKey)) {
              newRow.birth_date = formatDate(row[key]);
            } else if (['phone', 'telephone', 'tel', 'contact', 'numero'].includes(normalizedKey)) {
              newRow.phone = String(row[key]).replace(/[^0-9+]/g, '');
            } else if (['address', 'adresse', 'adr', 'lieu', 'domicile'].includes(normalizedKey)) {
              newRow.address = row[key];
            } else if (['paiement_status', 'statut', 'status', 'payment', 'statutpaiement'].includes(normalizedKey)) {
              newRow.paiement_status = normalizeStatus(row[key]);
            }
          });
          return newRow;
        });

        const validData = standardizedData.filter(row => row.full_name && row.full_name.trim() !== '');
        
        if (validData.length === 0) {
          toast.error('Aucune donnée valide trouvée');
          return;
        }

        setPreviewData(validData);
        setStep(2);
        toast.success(`${validData.length} patients trouvés`);
      } catch (error) {
        console.error('Erreur de lecture:', error);
        toast.error('Erreur lors de la lecture du fichier');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const formatDate = (value) => {
    if (!value) return null;
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    const str = String(value).trim();
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        let year = parts[2];
        if (year.length === 2) year = '20' + year;
        return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    if (str.includes('-')) {
      const parts = str.split('-');
      if (parts.length === 3) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
    try {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {}
    return null;
  };

  const normalizeStatus = (value) => {
    if (!value) return 'non_paye';
    const str = String(value).toLowerCase().trim();
    if (str.includes('paye') || str.includes('paid') || str === 'payé') return 'paye';
    if (str.includes('semi') || str.includes('partiel') || str === 'semi-payé') return 'semi_paye';
    return 'non_paye';
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('Aucune donnée à importer');
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    try {
      for (let i = 0; i < previewData.length; i++) {
        const patient = previewData[i];
        try {
          await axios.post(
            `${API_CONFIG.DASHBOARD_API}/patients`,
            {
              full_name: patient.full_name.trim(),
              birth_date: patient.birth_date || null,
              phone: patient.phone || null,
              address: patient.address || null,
              paiement_status: patient.paiement_status || 'non_paye',
            },
            axiosConfig
          );
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({
            row: i + 1,
            name: patient.full_name,
            error: error.response?.data?.error || error.message,
          });
        }
      }

      setImportStats({ successCount, errorCount, errors });
      setStep(3);

      if (successCount > 0) {
        toast.success(`${successCount} patients importés avec succès !`);
        if (onImportSuccess) onImportSuccess();
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} patients non importés`);
      }

    } catch (error) {
      console.error('Erreur d\'import:', error);
      toast.error('Erreur lors de l\'importation');
    } finally {
      setIsLoading(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setPreviewData([]);
    setImportStats(null);
    setStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetImport();
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 25px',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaFileExcel color="#28a745" />
              Importer des patients depuis Excel
            </h4>
            <small style={{ color: '#6c757d' }}>
              {step === 1 && 'Téléchargez un fichier Excel ou utilisez notre template'}
              {step === 2 && `Prévisualisation de ${previewData.length} patients`}
              {step === 3 && 'Résultat de l\'importation'}
            </small>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6c757d',
            }}
          >
            <FaTimes />
          </button>
        </div>

        <div style={{
          padding: '25px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {step === 1 && (
            <div>
              <div style={{
                background: '#e7f3ff',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <FaExclamationTriangle color="#004085" />
                <div style={{ fontSize: '14px' }}>
                  <strong>Format requis :</strong>
                  <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                    <li>Colonnes : <strong>full_name</strong> (obligatoire), <strong>birth_date</strong>, <strong>phone</strong>, <strong>address</strong>, <strong>paiement_status</strong></li>
                    <li>Les noms de colonnes peuvent être en français ou en anglais</li>
                    <li>Statut : "paye", "semi_paye" ou "non_paye"</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={downloadTemplate}
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                }}
              >
                <FaDownload /> Télécharger le template Excel
              </button>

              <div
                style={{
                  border: '2px dashed #dee2e6',
                  borderRadius: '15px',
                  padding: '40px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  background: file ? '#e8f5e9' : 'transparent',
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.background = '#f0f2ff';
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = '#dee2e6';
                  e.currentTarget.style.background = 'transparent';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#dee2e6';
                  e.currentTarget.style.background = 'transparent';
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile) {
                    const input = fileInputRef.current;
                    const dt = new DataTransfer();
                    dt.items.add(droppedFile);
                    input.files = dt.files;
                    handleFileUpload({ target: { files: [droppedFile] } });
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                {file ? (
                  <div>
                    <FaFileExcel size={48} color="#28a745" />
                    <p style={{ margin: '10px 0 0', fontWeight: 'bold', color: '#155724' }}>
                      {file.name}
                    </p>
                    <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#6c757d' }}>
                      {(file.size / 1024).toFixed(1)} KB - Cliquez pour changer
                    </p>
                  </div>
                ) : (
                  <div>
                    <FaUpload size={48} color="#6c757d" />
                    <p style={{ margin: '10px 0 0', fontWeight: 'bold' }}>
                      Glissez-déposez votre fichier Excel ici
                    </p>
                    <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#6c757d' }}>
                      ou cliquez pour sélectionner un fichier
                    </p>
                  </div>
                )}
              </div>

              {file && (
                <div style={{ marginTop: '15px', textAlign: 'right' }}>
                  <button
                    onClick={() => setStep(2)}
                    style={{
                      padding: '12px 30px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    Prévisualiser les données
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                flexWrap: 'wrap',
                gap: '10px',
              }}>
                <span>
                  <strong>{previewData.length}</strong> patients trouvés
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      padding: '8px 15px',
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={isLoading}
                    style={{
                      padding: '8px 20px',
                      background: isLoading ? '#6c757d' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isLoading ? 'Importation...' : `Importer ${previewData.length} patients`}
                  </button>
                </div>
              </div>

              <div style={{
                overflow: 'auto',
                maxHeight: '400px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                }}>
                  <thead style={{
                    background: '#f8f9fa',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}>
                    <tr>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>#</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Nom</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Date naissance</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Téléphone</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Adresse</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '10px' }}>{index + 1}</td>
                        <td style={{ padding: '10px', fontWeight: '500' }}>{row.full_name}</td>
                        <td style={{ padding: '10px' }}>{row.birth_date || '-'}</td>
                        <td style={{ padding: '10px' }}>{row.phone || '-'}</td>
                        <td style={{ padding: '10px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.address || '-'}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            background: row.paiement_status === 'paye' ? '#d4edda' :
                                       row.paiement_status === 'semi_paye' ? '#fff3cd' : '#f8d7da',
                            color: row.paiement_status === 'paye' ? '#155724' :
                                   row.paiement_status === 'semi_paye' ? '#856404' : '#721c24',
                          }}>
                            {row.paiement_status === 'paye' ? 'Payé' :
                             row.paiement_status === 'semi_paye' ? 'Semi-payé' : 'Non payé'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 3 && importStats && (
            <div>
              <div style={{
                textAlign: 'center',
                padding: '30px 0',
              }}>
                {importStats.errorCount === 0 ? (
                  <FaCheckCircle size={60} color="#28a745" />
                ) : (
                  <FaExclamationTriangle size={60} color="#ffc107" />
                )}
                <h3 style={{ margin: '15px 0 5px' }}>
                  {importStats.errorCount === 0 ? '✅ Importation réussie !' : '⚠️ Importation partielle'}
                </h3>
                <p>
                  <strong>{importStats.successCount}</strong> patients importés
                  {importStats.errorCount > 0 && (
                    <span style={{ color: '#dc3545' }}>
                      , <strong>{importStats.errorCount}</strong> erreurs
                    </span>
                  )}
                </p>
              </div>

              {importStats.errors.length > 0 && (
                <div style={{
                  marginTop: '15px',
                  background: '#f8d7da',
                  padding: '15px',
                  borderRadius: '8px',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}>
                  <h6 style={{ margin: '0 0 10px', color: '#721c24' }}>Erreurs :</h6>
                  {importStats.errors.map((err, index) => (
                    <div key={index} style={{ fontSize: '13px', marginBottom: '5px' }}>
                      Ligne {err.row} - {err.name}: {err.error}
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px',
                justifyContent: 'center',
              }}>
                <button
                  onClick={() => {
                    resetImport();
                    setStep(1);
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Importer un autre fichier
                </button>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '10px 20px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExcelModal;