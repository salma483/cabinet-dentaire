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
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [workbookData, setWorkbookData] = useState(null);
  const [hasHeaders, setHasHeaders] = useState(true);
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

  const isHeaderRow = (row) => {
    if (!row || row.length === 0) return false;
    const headerKeywords = ['nom', 'name', 'full', 'prénom', 'prenom', 'date', 'birth', 'naissance', 
                           'téléphone', 'telephone', 'phone', 'adresse', 'address', 'statut', 'status'];
    
    const rowStr = row.map(cell => String(cell || '').toLowerCase()).join(' ');
    let matchCount = 0;
    for (const keyword of headerKeywords) {
      if (rowStr.includes(keyword)) matchCount++;
    }
    return matchCount >= 2;
  };

  const detectColumnTypes = (data, hasHeaders) => {
    const columns = {
      full_name: 0,
      birth_date: 1,
      phone: 2,
      address: 3
    };
    
    if (hasHeaders && data.length > 0) {
      const headerRow = data[0];
      const headerMap = {};
      headerRow.forEach((cell, index) => {
        const cellStr = String(cell || '').toLowerCase().trim();
        if (cellStr.includes('nom') || cellStr.includes('name') || cellStr.includes('patient')) {
          headerMap.full_name = index;
        } else if (cellStr.includes('date') || cellStr.includes('birth') || cellStr.includes('naissance')) {
          headerMap.birth_date = index;
        } else if (cellStr.includes('tel') || cellStr.includes('phone') || cellStr.includes('contact')) {
          headerMap.phone = index;
        } else if (cellStr.includes('adresse') || cellStr.includes('address') || cellStr.includes('lieu')) {
          headerMap.address = index;
        }
      });
      
      if (Object.keys(headerMap).length >= 2) {
        return headerMap;
      }
    }
    
    return columns;
  };

  const readExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetsWithData = [];
        const sheetsData = {};
        
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (jsonData && jsonData.length > 0) {
            sheetsWithData.push(sheetName);
            sheetsData[sheetName] = jsonData;
          }
        });

        if (sheetsWithData.length === 0) {
          toast.error('Aucune feuille contenant des données trouvée');
          return;
        }

        setWorkbookData(sheetsData);
        setSheetNames(sheetsWithData);
        
        const firstSheet = sheetsWithData[0];
        setSelectedSheet(firstSheet);
        
        const firstData = sheetsData[firstSheet];
        const hasHeader = isHeaderRow(firstData[0]);
        setHasHeaders(hasHeader);
        
        processSheetData(firstData, firstSheet, hasHeader);
        
      } catch (error) {
        console.error('Erreur de lecture:', error);
        toast.error('Erreur lors de la lecture du fichier');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ✅ VERSION ULTRA ROBUSTE : NE JETTE RIEN, TOUT EST IMPORTÉ !
  const processSheetData = (jsonData, sheetName, hasHeaders = true) => {
    if (!jsonData || jsonData.length === 0) {
      toast.error('La feuille sélectionnée est vide');
      return;
    }

    console.log(`📊 Traitement de la feuille "${sheetName}" avec ${jsonData.length} lignes`);
    
    const columnMap = detectColumnTypes(jsonData, hasHeaders);
    console.log('🔍 Détection des colonnes:', columnMap);
    
    const startRow = hasHeaders ? 1 : 0;
    const validData = [];
    let emptyCount = 0;
    
    for (let i = startRow; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      let full_name = '';
      let birth_date = null;
      let phone = null;
      let address = null;
      
      if (row && row.length > 0) {
        const rawName = row[columnMap.full_name];
        if (rawName !== undefined && rawName !== null) {
          full_name = String(rawName).trim();
        }
        
        const rawDate = row[columnMap.birth_date];
        if (rawDate !== undefined && rawDate !== null) {
          birth_date = cleanDate(rawDate);
        }
        
        const rawPhone = row[columnMap.phone];
        if (rawPhone !== undefined && rawPhone !== null) {
          phone = String(rawPhone).trim();
        }
        
        const rawAddress = row[columnMap.address];
        if (rawAddress !== undefined && rawAddress !== null) {
          address = String(rawAddress).trim();
        }
      }
      
      // ✅ Si le nom est vide, on génère un nom
      if (!full_name || full_name === '' || full_name === '') {
        full_name = `Patient_${i + 1}`;
        emptyCount++;
      }
      
      // ✅ Nettoyer l'adresse (enlever les doubles espaces)
      if (address) {
        address = address.replace(/\s+/g, ' ').trim();
      }
      
      validData.push({
        full_name: full_name.substring(0, 255),
        birth_date: birth_date,
        phone: phone ? phone.substring(0, 20) : null,
        address: address ? address.substring(0, 255) : null,
        paiement_status: 'non_paye'
      });
    }

    if (validData.length === 0) {
      toast.error('Aucune donnée trouvée dans la feuille sélectionnée');
      return;
    }

    setPreviewData(validData);
    setStep(2);
    
    let message = `${validData.length} patients trouvés`;
    if (emptyCount > 0) {
      message += ` (${emptyCount} patients sans nom)`;
    }
    toast.success(message);
  };

  const handleSheetChange = (e) => {
    const sheetName = e.target.value;
    setSelectedSheet(sheetName);
    if (workbookData && workbookData[sheetName]) {
      const hasHeader = isHeaderRow(workbookData[sheetName][0]);
      setHasHeaders(hasHeader);
      processSheetData(workbookData[sheetName], sheetName, hasHeader);
    }
  };

  // ✅ FONCTION ULTRA ROBUSTE : Nettoie TOUTES les dates
  const cleanDate = (value) => {
    if (!value) return null;
    if (value instanceof Date && !isNaN(value)) {
      const year = value.getFullYear();
      if (year > 1900 && year < 2100) {
        return value.toISOString().split('T')[0];
      }
      return null;
    }
    
    let str = String(value).trim();
    if (!str || str === '') return null;
    
    // 🔥 NETTOYAGE : Enlever les caractères spéciaux (é, è, à, etc.)
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Garder uniquement chiffres, /, -
    str = str.replace(/[^0-9\/\-]/g, '');
    
    if (!str || str === '') return null;
    
    // 🔥 Gérer "61ans", "62ans", etc.
    if (str.match(/^(\d+)ans$/i)) {
      const year = new Date().getFullYear() - parseInt(str);
      if (year > 1900 && year < 2100) {
        return `${year}-01-01`;
      }
      return null;
    }
    
    // 🔥 Gérer "27-mars", "nov-10", etc.
    if (str.match(/\d{1,2}-[a-zA-Z]+/)) {
      const months = {
        'jan': '01', 'fev': '02', 'mar': '03', 'avr': '04',
        'mai': '05', 'jun': '06', 'jui': '07', 'aou': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
      };
      const parts = str.split('-');
      if (parts.length === 2) {
        const month = months[parts[1].toLowerCase().substring(0, 3)];
        if (month) {
          const day = parts[0].padStart(2, '0');
          if (parseInt(day) > 0 && parseInt(day) <= 31) {
            return `${new Date().getFullYear()}-${month}-${day}`;
          }
        }
      }
    }
    
    // 🔥 Gérer "20//01/2000" (double slash)
    if (str.includes('//')) {
      str = str.replace(/\/\//g, '/');
    }
    
    // Si c'est un nombre Excel
    if (typeof value === 'number' && !isNaN(value) && value > 1000) {
      try {
        const date = new Date((value - 25569) * 86400 * 1000);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          if (year > 1900 && year < 2100) {
            return date.toISOString().split('T')[0];
          }
        }
      } catch(e) {}
    }
    
    // 🔥 Année seule (ex: 1968, 1973, etc.)
    if (str.match(/^\d{4}$/)) {
      const year = parseInt(str);
      if (year > 1900 && year < 2100) {
        return `${str}-01-01`;
      }
      return null;
    }
    
    // Format YYYY-MM-DD
    if (str.match(/^\d{4}-\d{1,2}-\d{1,2}/)) {
      const parts = str.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        if (year > 1900 && year < 2100 && month > 0 && month <= 12 && day > 0 && day <= 31) {
          return `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
        }
      }
    }
    
    // Format DD/MM/YYYY ou DD/MM/YY
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        let day = parts[0].padStart(2, '0');
        let month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) {
          year = parseInt(year) > 30 ? `19${year}` : `20${year}`;
        }
        const y = parseInt(year);
        const m = parseInt(month);
        const d = parseInt(day);
        if (d > 0 && d <= 31 && m > 0 && m <= 12 && y > 1900 && y < 2100) {
          return `${year}-${month}-${day}`;
        }
      }
    }
    
    // Format DD-MM-YYYY
    if (str.includes('-') && !str.includes('/')) {
      const parts = str.split('-');
      if (parts.length === 3) {
        let day = parts[0].padStart(2, '0');
        let month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) {
          year = parseInt(year) > 30 ? `19${year}` : `20${year}`;
        }
        const y = parseInt(year);
        const m = parseInt(month);
        const d = parseInt(day);
        if (d > 0 && d <= 31 && m > 0 && m <= 12 && y > 1900 && y < 2100) {
          return `${year}-${month}-${day}`;
        }
      }
    }
    
    // Essayer de parser avec Date
    try {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        if (year > 1900 && year < 2100) {
          return date.toISOString().split('T')[0];
        }
      }
    } catch(e) {}
    
    // ✅ Si rien ne marche, on retourne null
    return null;
  };

  // ✅ FONCTION : nettoie les caractères dangereux
  const cleanPhone = (value) => {
    if (!value) return null;
    let str = String(value).trim();
    str = str.replace(/[^0-9+\s\-\.\(\)]/g, '');
    if (str.length > 20) str = str.substring(0, 20);
    return str || null;
  };

  const normalizeStatus = (value) => {
    if (!value) return 'non_paye';
    const str = String(value).toLowerCase().trim();
    if (str.includes('paye') || str.includes('paid') || str === 'payé') return 'paye';
    if (str.includes('semi') || str.includes('partiel') || str === 'semi-payé') return 'semi_paye';
    return 'non_paye';
  };

  // ✅ IMPORTATION : CONTINUE MÊME EN CAS D'ERREUR
  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('Aucune donnée à importer');
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    const toastId = toast.loading(`Importation en cours... 0/${previewData.length}`);

    try {
      for (let i = 0; i < previewData.length; i++) {
        const patient = previewData[i];
        
        if (i % 50 === 0) {
          toast.loading(`Importation en cours... ${i}/${previewData.length}`, { id: toastId });
        }
        
        try {
          await axios.post(
            `${API_CONFIG.DASHBOARD_API}/patients`,
            {
              full_name: patient.full_name.toString().trim().substring(0, 255),
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

      toast.dismiss(toastId);
      
      setImportStats({ successCount, errorCount, errors });
      setStep(3);

      if (successCount > 0) {
        toast.success(`${successCount} patients importés avec succès !`);
        if (onImportSuccess) onImportSuccess();
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} patients non importés (erreurs techniques)`);
      }

    } catch (error) {
      toast.dismiss(toastId);
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
    setSheetNames([]);
    setSelectedSheet('');
    setWorkbookData(null);
    setHasHeaders(true);
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
                  <strong>Colonnes détectées automatiquement :</strong>
                  <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                    <li><strong>Colonne 1</strong> → Nom complet (full_name)</li>
                    <li><strong>Colonne 2</strong> → Date de naissance (birth_date)</li>
                    <li><strong>Colonne 3</strong> → Téléphone (phone)</li>
                    <li><strong>Colonne 4</strong> → Adresse (address)</li>
                  </ul>
                  <small style={{ color: '#6c757d' }}>
                    📌 Tous les patients sont importés, même avec des données incomplètes.
                  </small>
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
                    {sheetNames.length > 0 && (
                      <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#667eea' }}>
                        📊 {sheetNames.length} feuille(s) avec données trouvée(s)
                      </p>
                    )}
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

              {sheetNames.length > 1 && file && (
                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    📑 Sélectionner la feuille à importer :
                  </label>
                  <select
                    value={selectedSheet}
                    onChange={handleSheetChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '2px solid #dee2e6',
                      fontSize: '14px',
                    }}
                  >
                    {sheetNames.map(name => (
                      <option key={name} value={name}>
                        {name} ({workbookData?.[name]?.length || 0} lignes)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {file && (
                <div style={{ marginTop: '15px', textAlign: 'right' }}>
                  <button
                    onClick={() => {
                      if (selectedSheet && workbookData?.[selectedSheet]) {
                        const hasHeader = isHeaderRow(workbookData[selectedSheet][0]);
                        setHasHeaders(hasHeader);
                        processSheetData(workbookData[selectedSheet], selectedSheet, hasHeader);
                      }
                    }}
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
                  {selectedSheet && <span style={{ color: '#6c757d', fontSize: '13px' }}> (feuille: {selectedSheet})</span>}
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
                    {previewData.slice(0, 100).map((row, index) => (
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
                            background: '#f8d7da',
                            color: '#721c24',
                          }}>
                            Non payé
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 100 && (
                  <div style={{ padding: '10px', textAlign: 'center', color: '#6c757d', fontSize: '13px' }}>
                    ... et {previewData.length - 100} autres patients
                  </div>
                )}
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
                      , <strong>{importStats.errorCount}</strong> erreurs techniques
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
                  <h6 style={{ margin: '0 0 10px', color: '#721c24' }}>Erreurs techniques :</h6>
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