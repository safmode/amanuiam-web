import { useState, useEffect, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, User, AlertCircle, Image, MessageSquare, Upload, Loader2, Eye, Trash2, Calendar, Mail, Phone, MapPin, Sparkles } from 'lucide-react';
import { categoryLabels, statusLabels, urgencyLabels, locationLabels, formatLocationName } from '@/Pages/Reports';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/axios';

// Helper function to extract location data from report
const extractLocationData = (report) => {
  if (!report) return { locationArea: '', building: '', specificPlace: '', fullAddress: '' };

  console.log('Extracting location data from report:', report);

  let locationArea = '';
  let building = '';
  let specificPlace = '';
  let fullAddress = '';

  // PRIORITY 1: Use server-determined location (from proximity matching)
  if (report.determinedLocation && report.determinedLocation !== 'Unknown') {
    locationArea = formatLocationName(report.determinedLocation);
    console.log('Using server-determined location area:', locationArea);
  }

  // PRIORITY 2: Check location object from server
  if (!locationArea && report.locationArea && report.locationArea !== 'Not specified') {
    locationArea = report.locationArea;
    console.log('Found locationArea on report:', locationArea);
  }

  // PRIORITY 3: Check location object
  if (!locationArea && report.location && typeof report.location === 'object') {
    if (report.location.locationArea && report.location.locationArea.trim() !== '') {
      const placeNames = ['7 eleven', 'seven eleven', 'office', 'cafe', 'cafeteria', 'library', 'gym', 'store', 'shop', 'restaurant', 'food court'];
      const isPlaceName = placeNames.some(place => report.location.locationArea.toLowerCase().includes(place.toLowerCase()));
      if (!isPlaceName) {
        locationArea = report.location.locationArea;
        console.log('Found locationArea in report.location:', locationArea);
      }
    }
  }

  // PRIORITY 4: Fallback to mahallah field
  if (!locationArea && report.mahallah && report.mahallah.trim() !== '') {
    locationArea = report.mahallah;
    console.log('Found mahallah field:', locationArea);
  }

  // EXTRACT SPECIFIC ADDRESS
  // First check if specificPlace exists
  if (report.specificAddress && report.specificAddress !== 'Not specified') {
    specificPlace = report.specificAddress;
    console.log('Using server-provided specific address:', specificPlace);
  } else if (report.location && typeof report.location === 'object') {
    if (report.location.specificPlace && report.location.specificPlace.trim() !== '') {
      specificPlace = report.location.specificPlace;
    } else if (report.location.building && report.location.building.trim() !== '') {
      building = report.location.building;
    }
    // IF NOTHING ELSE, EXTRACT FROM ADDRESS FIELD!
    else if (report.location.address && report.location.address.trim() !== '') {
      let address = report.location.address;

      // List of known location names to remove
      const locationNames = [
        'Mahallah Asiah', 'Mahallah Aminah', 'Mahallah Safiyyah', 'Mahallah Maryam',
        'Mahallah Ruqayyah', 'Mahallah Ali', 'Mahallah Faruq', 'Mahallah Bilal',
        'Mahallah Asma', 'Mahallah Hafsah', 'Mahallah Halimah', 'Mahallah Siddiq',
        'Mahallah Salahuddin', 'Mahallah Uthman', 'Mahallah Nusaibah', 'Mahallah Zubair',
        'Mahallah Sumayyah', 'KIRKHS (AHAS KIRKHS)', 'KICT (ICT)', 'KOE (Engineering)',
        'KAED (Architecture)', 'KENMS (Economics)', 'AIKOL (Law)', 'KOED (Education)',
        'Dar al-Hikmah Library', 'Female Sports Complex', 'Saidina Hamzah Stadium',
        'IIUM Archery Range', 'UIA Football Turf', 'IIUM Cricket Ground', 'IIUM Rugby Field',
        'Padang Kawad UIAM', 'IIUM Educare', 'Sultan Haji Ahmad Shah Mosque'
      ];

      // Remove the location area from the address to get the specific place
      if (locationArea) {
        address = address.replace(new RegExp(locationArea, 'gi'), '');
      }

      // Remove any known location names
      for (const name of locationNames) {
        address = address.replace(new RegExp(name, 'gi'), '');
      }

      // Clean up
      address = address.replace(/Mahallah /gi, '');
      address = address.replace(/Kulliyyah /gi, '');
      address = address.trim();
      address = address.replace(/\s+/g, ' ');
      address = address.replace(/,$/, '');
      address = address.replace(/^,/, '');

      if (address && address !== '') {
        specificPlace = address;
        console.log('Extracted specific place from address:', specificPlace);
      }
    }
  } else if (report.building && report.building.trim() !== '') {
    building = report.building;
  } else if (report.address && report.address.trim() !== '') {
    // Last resort - use the full address
    specificPlace = report.address;
  }

  // Build full address
  const addressParts = [];
  if (locationArea && locationArea.trim() !== '') {
    addressParts.push(locationArea);
  }
  if (specificPlace && specificPlace.trim() !== '') {
    addressParts.push(specificPlace);
  } else if (building && building.trim() !== '') {
    addressParts.push(building);
  }
  fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'No address specified';

  console.log('FINAL EXTRACTED DATA:', { locationArea, building, specificPlace, fullAddress });

  return { locationArea, building, specificPlace, fullAddress };
};

export const ReportsEditing = ({ report, isOpen, onClose, onSaveSuccess }) => {
  const [editedReport, setEditedReport] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [officersList, setOfficersList] = useState([]);
  const [officerOptions, setOfficerOptions] = useState({});
  const [isLoadingOfficers, setIsLoadingOfficers] = useState(false);
  const fileInputRef = useRef(null);

  // State for delete attachment modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);

  // Store pending files that need to be uploaded on save
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isUploadingOnSave, setIsUploadingOnSave] = useState(false);

  // Track temporary preview URLs for pending files (blob URLs)
  const [tempPreviews, setTempPreviews] = useState([]);

  // Track pending deletions (for files that exist in DB but user wants to delete)
  const [pendingDeletions, setPendingDeletions] = useState([]);

  // === AI FEATURE: State for AI suggestion ===
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisTimeout, setAnalysisTimeout] = useState(null);

  // Fetch officers for dropdown - USING AXIOS
  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    setIsLoadingOfficers(true);
    try {
      const response = await api.get('/api/officers/list');
      const officers = response.data;
      setOfficersList(officers);

      const options = {};
      officers.forEach(officer => {
        options[officer.officerId] = officer.officerName;
      });
      setOfficerOptions(options);
    } catch (error) {
      console.error('Failed to fetch officers:', error);
    } finally {
      setIsLoadingOfficers(false);
    }
  };

  // Reset all states when modal closes
  const resetModalState = () => {
    setEditedReport(null);
    setPendingFiles([]);
    setTempPreviews([]);
    setPendingDeletions([]);
    setIsDeleteModalOpen(false);
    setAttachmentToDelete(null);
    setIsDeletingAttachment(false);
    setErrors({});
    setIsSaving(false);
    setIsUploadingOnSave(false);
    setAiSuggestion(null);
    setIsAnalyzing(false);
    if (analysisTimeout) {
      clearTimeout(analysisTimeout);
      setAnalysisTimeout(null);
    }
  };

  // Cleanup when main dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsDeleteModalOpen(false);
      setAttachmentToDelete(null);
      setPendingDeletions([]);
    }
  }, [isOpen]);

  // Initialize form when report changes or modal opens
  useEffect(() => {
    if (report && isOpen) {
      console.log('RAW REPORT FROM PROPS:', report);
      const { locationArea, building, specificPlace, fullAddress } = extractLocationData(report);

      console.log('Extracted location data:', { locationArea, building, specificPlace, fullAddress });

      let formattedDate = '';
      let formattedTime = '';
      if (report.incidentDateTime) {
        const dateObj = new Date(report.incidentDateTime);
        formattedDate = dateObj.toISOString().split('T')[0];
        formattedTime = dateObj.toTimeString().slice(0, 5);
      }

      // Get existing Cloudinary URLs from the report
      const existingUrls = report.attachmentUrls || report._raw?.attachmentUrls || [];
      const existingPublicIds = report.attachmentPublicIds || report._raw?.attachmentPublicIds || [];

      const initialData = {
        id: report.id || report._id,
        reportId: report.reportId || report.id,
        status: report.status || 'pending',
        urgency: report.urgency || 'general',
        category: report.category || report.incidentCategory,
        description: report.description || '',
        incidentDate: formattedDate,
        incidentTime: formattedTime,
        locationArea: locationArea || '',
        building: building || '',
        specificPlace: specificPlace || '',
        fullAddress: fullAddress || '',
        injuries: report.injuries || '',
        damages: report.damages || '',
        suspectDescription: report.suspectDescription || '',
        assignedOfficer: report.assignedOfficer || '',
        officerNotes: report.officerNotes || '',
        reporterName: report.reporterName || report.studentName || '',
        reporterEmail: report.reporterEmail || report.studentEmail || '',
        reporterPhone: report.reporterPhone || report.studentPhone || '',
        reporterMatricNo: report.reporterMatricNo || report.studentMatrix || '',
        attachmentUrls: existingUrls,
        attachmentPublicIds: existingPublicIds,
      };

      setEditedReport(initialData);
      setPendingFiles([]);
      setTempPreviews([]);
      setPendingDeletions([]);
      setIsDeleteModalOpen(false);
      setAttachmentToDelete(null);
      setErrors({});
      setAiSuggestion(null);
      setIsAnalyzing(false);
      if (analysisTimeout) {
        clearTimeout(analysisTimeout);
        setAnalysisTimeout(null);
      }
    }
  }, [report, isOpen]);

  // === Debounced description analysis - USING AXIOS (NO CSRF ERRORS!) ===
  useEffect(() => {
    if (analysisTimeout) {
      clearTimeout(analysisTimeout);
    }

    if (!editedReport?.description || editedReport.description.length < 15) {
      setAiSuggestion(null);
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);

    const timeout = setTimeout(() => {
      analyzeDescription(editedReport.description);
    }, 1200);

    setAnalysisTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [editedReport?.description]);

  const analyzeDescription = async (description) => {
    if (!description || description.length < 15) {
      setIsAnalyzing(false);
      return;
    }

    try {
      const response = await api.post('/api/ai/analyze-report', {
        description: description
      });

      const data = response.data;

      if (data.success) {
        setAiSuggestion({
          category: data.category,
          urgency: data.urgency,
          confidence: data.confidence || 0.8
        });
      } else {
        setAiSuggestion(null);
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      setAiSuggestion(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyAiSuggestion = () => {
    if (aiSuggestion) {
      const updates = {};
      if (aiSuggestion.category) updates.category = aiSuggestion.category;
      if (aiSuggestion.urgency) updates.urgency = aiSuggestion.urgency;
      if (Object.keys(updates).length > 0) {
        setEditedReport(prev => ({ ...prev, ...updates }));
        showToast(`AI suggestion applied: ${categoryLabels[aiSuggestion.category] || aiSuggestion.category} / ${urgencyLabels[aiSuggestion.urgency]}`, 'success');
      }
      setAiSuggestion(prev => prev ? { ...prev, applied: true } : null);
      setTimeout(() => {
        setAiSuggestion(prev => prev?.applied ? null : prev);
      }, 3000);
    }
  };

  const handleCategoryChange = (value) => {
    setEditedReport(prev => ({ ...prev, category: value }));
    if (aiSuggestion && !aiSuggestion.applied) {
      setAiSuggestion(null);
      showToast('Manual selection made, AI suggestion cleared', 'info');
    }
  };

  const handleUrgencyChange = (value) => {
    setEditedReport(prev => ({ ...prev, urgency: value }));
    if (aiSuggestion && !aiSuggestion.applied) {
      setAiSuggestion(null);
      showToast('Manual selection made, AI suggestion cleared', 'info');
    }
  };

  // Handle file selection - create preview but DON'T upload to Cloudinary yet
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setPendingFiles(prev => [...prev, ...files]);

    files.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      setTempPreviews(prev => [...prev, previewUrl]);
      setEditedReport(prev => ({
        ...prev,
        attachmentUrls: [...(prev?.attachmentUrls || []), previewUrl],
        attachmentPublicIds: [...(prev?.attachmentPublicIds || []), null],
      }));
    });

    showToast(`${files.length} file(s) ready to upload. Click Save Changes to upload to Cloudinary.`, 'info');

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Update full address when locationArea, building, or specificPlace changes
  const updateFullAddress = (locationAreaVal, buildingVal, specificPlaceVal) => {
    const parts = [];
    if (locationAreaVal && locationAreaVal.trim() !== '') {
      parts.push(locationAreaVal);
    }
    if (specificPlaceVal && specificPlaceVal.trim() !== '') {
      parts.push(specificPlaceVal);
    } else if (buildingVal && buildingVal.trim() !== '') {
      parts.push(buildingVal);
    }
    return parts.length > 0 ? parts.join(', ') : 'No address specified';
  };

  const handleLocationAreaChange = (value) => {
    const newFullAddress = updateFullAddress(value, editedReport.building, editedReport.specificPlace);
    setEditedReport(prev => ({
      ...prev,
      locationArea: value,
      fullAddress: newFullAddress
    }));
  };

  const handleBuildingChange = (value) => {
    if (value && editedReport.specificPlace) {
      setEditedReport(prev => ({ ...prev, specificPlace: '' }));
    }
    const newFullAddress = updateFullAddress(editedReport.locationArea, value, editedReport.specificPlace);
    setEditedReport(prev => ({
      ...prev,
      building: value,
      fullAddress: newFullAddress
    }));
  };

  const handleSpecificPlaceChange = (value) => {
    if (value && editedReport.building) {
      setEditedReport(prev => ({ ...prev, building: '' }));
    }
    const newFullAddress = updateFullAddress(editedReport.locationArea, editedReport.building, value);
    setEditedReport(prev => ({
      ...prev,
      specificPlace: value,
      fullAddress: newFullAddress
    }));
  };

  const handleCombinedAddressChange = (value) => {
    if (!value || value.trim() === '') {
      handleBuildingChange('');
      handleSpecificPlaceChange('');
      return;
    }

    const exactPlaceNames = ['7 Eleven', 'Seven Eleven', 'Office', 'Cafe', 'Cafeteria', 'Gym', 'Store', 'Shop', 'Restaurant', 'Food Court'];
    const isShortPlaceName = value.split(' ').length <= 2;
    const isExactPlace = exactPlaceNames.some(place =>
      value.toLowerCase() === place.toLowerCase() ||
      (value.toLowerCase().includes(place.toLowerCase()) && isShortPlaceName)
    );

    if (isExactPlace) {
      handleSpecificPlaceChange(value);
    } else {
      handleBuildingChange(value);
    }
  };

  // Upload pending files to Cloudinary - USING AXIOS
  const uploadPendingFiles = async () => {
    if (pendingFiles.length === 0) return { urls: [], publicIds: [] };

    setIsUploadingOnSave(true);
    const formData = new FormData();
    pendingFiles.forEach(file => {
      formData.append('attachments[]', file);
    });
    formData.append('reportId', editedReport.reportId);

    try {
      const response = await api.post('/reports/upload-attachments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;

      tempPreviews.forEach(url => URL.revokeObjectURL(url));
      setPendingFiles([]);
      setTempPreviews([]);

      return { urls: data.urls, publicIds: data.publicIds };

    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setIsUploadingOnSave(false);
    }
  };

  // Delete pending deletions from Cloudinary - USING AXIOS
  const processPendingDeletions = async () => {
    if (pendingDeletions.length === 0) return;

    for (const deletion of pendingDeletions) {
      try {
        await api.delete('/reports/delete-attachment', {
          data: {
            reportId: editedReport.reportId,
            attachmentUrl: deletion.url,
            attachmentPublicId: deletion.publicId,
          }
        });
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!editedReport) return;

    setIsSaving(true);
    setErrors({});

    try {
      let incidentDateTime = null;
      if (editedReport.incidentDate && editedReport.incidentTime) {
        incidentDateTime = new Date(`${editedReport.incidentDate}T${editedReport.incidentTime}:00`).toISOString();
      } else if (report?.incidentDateTime) {
        incidentDateTime = report.incidentDateTime;
      }

      let finalAttachmentUrls = [];
      let finalAttachmentPublicIds = [];

      if (pendingFiles.length > 0) {
        const uploaded = await uploadPendingFiles();
        finalAttachmentUrls = uploaded.urls;
        finalAttachmentPublicIds = uploaded.publicIds;
      }

      if (pendingDeletions.length > 0) {
        await processPendingDeletions();
      }

      const existingUrls = (editedReport.attachmentUrls || []).filter(url =>
        url && url.startsWith('http') && !url.startsWith('blob:') && url.includes('cloudinary.com') &&
        !pendingDeletions.some(d => d.url === url)
      );
      const existingPublicIds = (editedReport.attachmentPublicIds || []).filter((id, index) =>
        id !== null && !pendingDeletions.some(d => d.publicId === id)
      );

      const allUrls = [...existingUrls, ...finalAttachmentUrls];
      const allPublicIds = [...existingPublicIds, ...finalAttachmentPublicIds];

      // Build location object - prioritize specificPlace over building
      const addressParts = [];
      if (editedReport.locationArea && editedReport.locationArea.trim() !== '') {
        addressParts.push(editedReport.locationArea);
      }
      if (editedReport.specificPlace && editedReport.specificPlace.trim() !== '') {
        addressParts.push(editedReport.specificPlace);
      } else if (editedReport.building && editedReport.building.trim() !== '') {
        addressParts.push(editedReport.building);
      }
      const combinedAddress = addressParts.length > 0 ? addressParts.join(', ') : '';

      const locationObj = {
        locationArea: editedReport.locationArea || '',
        building: editedReport.building || '',
        specificPlace: editedReport.specificPlace || '',
        address: combinedAddress,
        timestamp: new Date().toISOString()
      };

      const payload = {
        status: editedReport.status,
        urgency: editedReport.urgency,
        incidentCategory: editedReport.category,
        description: editedReport.description,
        incidentDateTime: incidentDateTime,
        injuries: editedReport.injuries || null,
        damages: editedReport.damages || null,
        suspectDescription: editedReport.suspectDescription || null,
        assignedOfficer: editedReport.assignedOfficer || null,
        officerNotes: editedReport.officerNotes || null,
        studentName: editedReport.reporterName || null,
        studentEmail: editedReport.reporterEmail || null,
        studentPhone: editedReport.reporterPhone || null,
        studentMatrix: editedReport.reporterMatricNo || null,
        attachmentUrls: allUrls,
        attachmentPublicIds: allPublicIds,
        location: locationObj,
        mahallah: editedReport.locationArea || '',
        building: editedReport.building || '',
        specificPlace: editedReport.specificPlace || '',
        address: combinedAddress,
      };

      const reportId = editedReport.reportId;

      router.put(`/Reports/${reportId}`, payload, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setIsSaving(false);
          showToast('Report updated successfully', 'success');

          const updatedReportData = {
            ...editedReport,
            attachmentUrls: allUrls,
            attachmentPublicIds: allPublicIds,
          };

          if (onSaveSuccess) {
            onSaveSuccess(updatedReportData);
          }
          onClose();
          resetModalState();
          router.reload({ only: ['reports'] });
        },
        onError: (serverErrors) => {
          setIsSaving(false);
          setErrors(serverErrors);
          const errorMessage = Object.values(serverErrors).flat().join(', ');
          showToast('Failed to update report: ' + errorMessage, 'error');
          console.error('Save failed:', serverErrors);
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Failed to upload files: ' + error.message, 'error');
      setIsSaving(false);
    }
  };

  const handleDeleteAttachment = (url, publicId, index) => {
    if (!editedReport) return;

    if (url && url.startsWith('blob:')) {
      setEditedReport(prev => ({
        ...prev,
        attachmentUrls: (prev?.attachmentUrls || []).filter((_, i) => i !== index),
        attachmentPublicIds: (prev?.attachmentPublicIds || []).filter((_, i) => i !== index),
      }));

      const existingUrlsCount = (editedReport.attachmentUrls || []).filter(u => u && u.startsWith('http') && !u.startsWith('blob:')).length;
      const pendingIndex = index - existingUrlsCount;
      if (pendingIndex >= 0 && pendingIndex < pendingFiles.length) {
        URL.revokeObjectURL(tempPreviews[pendingIndex]);
        setPendingFiles(prev => prev.filter((_, i) => i !== pendingIndex));
        setTempPreviews(prev => prev.filter((_, i) => i !== pendingIndex));
      }

      showToast('Attachment will be removed when saving', 'info');
      return;
    }

    setAttachmentToDelete({ url, publicId, index });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAttachment = async () => {
    if (!attachmentToDelete) return;

    setPendingDeletions(prev => [...prev, {
      url: attachmentToDelete.url,
      publicId: attachmentToDelete.publicId,
      index: attachmentToDelete.index
    }]);

    setEditedReport(prev => ({
      ...prev,
      attachmentUrls: (prev?.attachmentUrls || []).filter((_, i) => i !== attachmentToDelete.index),
      attachmentPublicIds: (prev?.attachmentPublicIds || []).filter((_, i) => i !== attachmentToDelete.index),
    }));

    showToast('Attachment will be deleted from Cloudinary when you save', 'info');
    setIsDeleteModalOpen(false);
    setAttachmentToDelete(null);
  };

  const cancelDeleteAttachment = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsDeleteModalOpen(false);
    setAttachmentToDelete(null);
  };

  const handlePreview = (url) => {
    if (!url) return;
    if (url.includes('cloudinary.com') && !url.includes('.pdf')) {
      const baseUrl = url.split('?')[0];
      const highQualityUrl = `${baseUrl}?w=1200&h=1200&c=limit&q=auto&f=auto`;
      window.open(highQualityUrl, '_blank');
    } else if (url.startsWith('blob:')) {
      window.open(url, '_blank');
    } else {
      window.open(url, '_blank');
    }
  };

  const getImageUrl = (url) => {
    if (!url) return '';

    if (url.startsWith('http') && url.includes('cloudinary.com')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}w=400&h=400&c=fill&q=auto&f=auto`;
    }

    if (url.startsWith('blob:')) {
      return url;
    }

    return url;
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm animate-in slide-in-from-bottom-2 ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleClose = () => {
    if (isSaving) return;
    tempPreviews.forEach(url => URL.revokeObjectURL(url));
    resetModalState();
    onClose();
  };

  const getFileIcon = (url) => {
    if (!url) return <FileText className="w-8 h-8 text-gray-500 dark:text-gray-400" />;
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <Image className="w-8 h-8 text-blue-500 dark:text-blue-400" />;
    }
    if (extension === 'pdf') {
      return <FileText className="w-8 h-8 text-red-500 dark:text-red-400" />;
    }
    return <FileText className="w-8 h-8 text-gray-500 dark:text-gray-400" />;
  };

  const isImageFile = (url) => {
    if (!url) return false;

    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return true;
    }

    if (url.includes('cloudinary.com') && !url.includes('.pdf')) {
      return true;
    }

    if (url.startsWith('blob:')) {
      return true;
    }

    return false;
  };

  const getOfficerDisplayName = (officerId) => {
    const officer = officersList.find(o => o.officerId === officerId);
    return officer ? officer.officerName : 'Not Assigned';
  };

  if (!report || !isOpen || !editedReport) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!isDeleteModalOpen && !open) {
          handleClose();
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 bg-white dark:bg-slate-800 dark:border-slate-700" aria-describedby="dialog-description">
          <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center dark:bg-amber-900/20">
                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Edit Report {editedReport.reportId}
              </DialogTitle>
            </div>
            <div id="dialog-description" className="sr-only">
              Edit report form with reporter information, incident details, and attachments
            </div>
            {pendingFiles.length > 0 && (
              <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded dark:text-blue-400 dark:bg-blue-950/20">
                {pendingFiles.length} file(s) ready to upload to Cloudinary. Click Save Changes to upload.
              </div>
            )}
            {pendingDeletions.length > 0 && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded dark:text-red-400 dark:bg-red-950/20">
                {pendingDeletions.length} file(s) marked for deletion. Click Save Changes to delete from Cloudinary.
              </div>
            )}
          </DialogHeader>

          <div className="p-6 space-y-5">
            {/* Reporter Information */}
            <Card className="border-gray-200 bg-white dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center dark:bg-amber-900/20">
                    <User className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reporter Information</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-700 dark:text-gray-400">Full Name *</Label>
                    <Input
                      value={editedReport.reporterName || ''}
                      onChange={(e) => setEditedReport(prev => ({ ...prev, reporterName: e.target.value }))}
                      className="mt-1 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-700 dark:text-gray-400">Matric Number</Label>
                    <Input
                      value={editedReport.reporterMatricNo || ''}
                      onChange={(e) => setEditedReport(prev => ({ ...prev, reporterMatricNo: e.target.value }))}
                      className="mt-1 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                      placeholder="e.g., 2226488"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-700 dark:text-gray-400">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <Input
                          type="email"
                          value={editedReport.reporterEmail || ''}
                          onChange={(e) => setEditedReport(prev => ({ ...prev, reporterEmail: e.target.value }))}
                          className="mt-1 bg-white pl-9 text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                          placeholder="student@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-700 dark:text-gray-400">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <Input
                          type="tel"
                          value={editedReport.reporterPhone || ''}
                          onChange={(e) => setEditedReport(prev => ({ ...prev, reporterPhone: e.target.value }))}
                          className="mt-1 bg-white pl-9 text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                          placeholder="012-3456789"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Incident Details */}
            <Card className="border-gray-200 bg-white dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Incident Details</span>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-gray-700 dark:text-gray-400">Category *</Label>
                      <Select
                        value={editedReport.category}
                        onValueChange={handleCategoryChange}
                      >
                        <SelectTrigger className="mt-1 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="text-gray-700 dark:bg-slate-800 dark:border-slate-700">
                          {Object.entries(categoryLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key} className="text-gray-700 dark:text-gray-300 dark:focus:bg-slate-700 dark:focus:text-gray-100">{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-700 dark:text-gray-400">Urgency Level</Label>
                      <Select
                        value={editedReport.urgency}
                        onValueChange={handleUrgencyChange}
                      >
                        <SelectTrigger className="mt-1 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="text-gray-700 dark:bg-slate-800 dark:border-slate-700">
                          {Object.entries(urgencyLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key} className="text-gray-700 dark:text-gray-300 dark:focus:bg-slate-700 dark:focus:text-gray-100">{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-700 dark:text-gray-400">Status</Label>
                      <Select
                        value={editedReport.status}
                        onValueChange={(v) => setEditedReport(prev => ({ ...prev, status: v }))}
                      >
                        <SelectTrigger className="mt-1 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="text-gray-700 dark:bg-slate-800 dark:border-slate-700">
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key} className="text-gray-700 dark:text-gray-300 dark:focus:bg-slate-700 dark:focus:text-gray-100">{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-700 dark:text-gray-400">Incident Date *</Label>
                      <Input
                        type="date"
                        value={editedReport.incidentDate || ''}
                        onChange={(e) => setEditedReport(prev => ({ ...prev, incidentDate: e.target.value }))}
                        className="mt-1 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-700 dark:text-gray-400">Incident Time *</Label>
                      <Input
                        type="time"
                        value={editedReport.incidentTime || ''}
                        onChange={(e) => setEditedReport(prev => ({ ...prev, incidentTime: e.target.value }))}
                        className="mt-1 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
                      />
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="space-y-3">
                    {/* Location Area */}
                    <div>
                      <Label className="text-xs text-gray-700 dark:text-gray-400">Location Area *</Label>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400">
                        Select the general area where the incident occurred (Mahallah, Kulliyyah, or Facility)
                      </p>
                      <Select
                        value={editedReport.locationArea || ""}
                        onValueChange={handleLocationAreaChange}
                      >
                        <SelectTrigger className="mt-1 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                          <SelectValue placeholder="Select location area" />
                        </SelectTrigger>
                        <SelectContent className="text-gray-700 dark:bg-slate-800 dark:border-slate-700">
                          {Object.entries(locationLabels).map(([groupName, locations]) => (
                            <Fragment key={groupName}>
                              <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50 dark:text-gray-400 dark:bg-slate-700">
                                {groupName}
                              </div>
                              {Object.entries(locations).map(([key, label]) => (
                                <SelectItem key={key} value={label} className="text-gray-700 dark:text-gray-300 dark:focus:bg-slate-700 dark:focus:text-gray-100">
                                  {label}
                                </SelectItem>
                              ))}
                            </Fragment>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-blue-600 mt-1 dark:text-blue-400">
                        💡 Tip: Location Area is automatically determined from GPS coordinates when available
                      </p>
                    </div>

                    {/* Specific Address */}
                    <div>
                      <Label className="text-xs text-gray-700 dark:text-gray-400">Specific Address (Building/Room/Block/Specific Place)</Label>
                      <div className="flex items-start gap-1.5 mt-1 mb-1">
                        <p className="text-[10px] text-gray-600 dark:text-gray-400">
                          Enter the specific location where the incident happened (building name/number, room/block, landmarks, or specific place like '7 Eleven', 'Office')
                        </p>
                      </div>
                      <Textarea
                        value={editedReport.specificPlace || editedReport.building || ''}
                        onChange={(e) => handleCombinedAddressChange(e.target.value)}
                        className="mt-1 bg-white text-sm text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                        placeholder="e.g., Block A, Room 4.3, Floor 2, Near Canteen, 7 Eleven, Office, etc."
                        rows={2}
                      />
                      <p className="text-[10px] text-blue-600 mt-1 dark:text-blue-400">
                        💡 Tip: Be as specific as possible to help security personnel locate the exact spot
                      </p>
                    </div>

                    {/* Full Address (Combined) */}
                    {editedReport.fullAddress && editedReport.fullAddress !== 'No address specified' && (
                      <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-light text-amber-700 dark:text-amber-300">Full Address:</span>
                        </div>
                        <p className="text-sm text-amber-800 mt-1 dark:text-amber-300">{editedReport.fullAddress}</p>
                      </div>
                    )}
                  </div>

                  {/* Description with AI Feature */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs text-gray-700 dark:text-gray-400">Description *</Label>
                      {isAnalyzing && (
                        <div className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">AI analyzing...</span>
                        </div>
                      )}
                    </div>
                    <Textarea
                      value={editedReport.description || ''}
                      onChange={(e) => setEditedReport(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 bg-white min-h-[100px] text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                      placeholder="Describe what happened in detail... AI will automatically analyze and suggest category & urgency!"
                    />
                  </div>

                  {/* AI Suggestion Display */}
                  {isAnalyzing && (
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">AI analyzing description...</span>
                      </div>
                    </div>
                  )}

                  {aiSuggestion && !isAnalyzing && (
                    <div className={`p-3 rounded-lg border ${
                      aiSuggestion.confidence > 0.7
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                        : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
                    }`}>
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">🤖 AI SUGGESTION</p>
                            {aiSuggestion.applied ? (
                              <Badge variant="outline" className="text-green-600 border-green-300 text-xs dark:text-green-400 dark:border-green-700">
                                ✓ Applied - You can still change below
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-purple-600 border-purple-300 text-xs dark:text-purple-400 dark:border-purple-700">
                                Click to apply
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm mt-1">
                            <span className="text-gray-600 dark:text-gray-400">Category:</span>{' '}
                            <strong className="text-gray-800 dark:text-gray-200">{categoryLabels[aiSuggestion.category] || aiSuggestion.category}</strong>
                            {' • '}
                            <span className="text-gray-600 dark:text-gray-400">Urgency:</span>{' '}
                            <strong className="text-gray-800 dark:text-gray-200">{urgencyLabels[aiSuggestion.urgency]}</strong>
                            {aiSuggestion.confidence > 0.7 && (
                              <Badge variant="outline" className="ml-2 text-green-600 border-green-300 text-[10px] dark:text-green-400 dark:border-green-700">
                                ✓ High confidence
                              </Badge>
                            )}
                          </div>
                          {!aiSuggestion.applied && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-3"
                                onClick={applyAiSuggestion}
                              >
                                Apply Suggestion
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 text-xs h-7 px-2 dark:text-gray-400 dark:hover:bg-slate-700"
                                onClick={() => setAiSuggestion(null)}
                              >
                                Dismiss
                              </Button>
                            </div>
                          )}
                          {aiSuggestion.applied && (
                            <p className="text-xs text-gray-500 mt-2 italic dark:text-gray-400">
                              Suggestion applied. You can still change category or urgency using the dropdowns above.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Injuries & Damages */}
            <Card className="border-gray-200 bg-white dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Injuries & Damages</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-700 dark:text-gray-400">Injuries</Label>
                    <Textarea
                      value={editedReport.injuries || ''}
                      onChange={(e) => setEditedReport(prev => ({ ...prev, injuries: e.target.value }))}
                      className="mt-1 bg-white min-h-[80px] text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                      placeholder="Describe any injuries sustained..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-700 dark:text-gray-400">Damages</Label>
                    <Textarea
                      value={editedReport.damages || ''}
                      onChange={(e) => setEditedReport(prev => ({ ...prev, damages: e.target.value }))}
                      className="mt-1 bg-white min-h-[80px] text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                      placeholder="Describe any property damage..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suspect Information */}
            <Card className="border-gray-200 bg-white dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Suspect Information (if applicable)</span>
                </div>
                <div>
                  <Label className="text-xs text-gray-700 dark:text-gray-400">Suspect Description</Label>
                  <Textarea
                    value={editedReport.suspectDescription || ''}
                    onChange={(e) => setEditedReport(prev => ({ ...prev, suspectDescription: e.target.value }))}
                    className="mt-1 bg-white min-h-[80px] text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                    placeholder="Describe the suspect (height, build, clothing, distinguishing features)..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card className="border-gray-200 bg-white dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Attachments</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({editedReport.attachmentUrls?.length || 0} files)
                      {pendingFiles.length > 0 && ` (${pendingFiles.length} pending upload)`}
                      {pendingDeletions.length > 0 && ` (${pendingDeletions.length} pending deletion)`}
                    </span>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload-edit"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || isUploadingOnSave}
                      className="gap-2 text-gray-700 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700"
                    >
                      <Upload className="w-4 h-4" />
                      Select Files
                    </Button>
                  </div>
                </div>

                {editedReport.attachmentUrls && editedReport.attachmentUrls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {editedReport.attachmentUrls.map((url, index) => {
                      const publicId = editedReport.attachmentPublicIds?.[index];
                      const isPending = url && url.startsWith('blob:');
                      const isMarkedForDeletion = !isPending && pendingDeletions.some(d => d.url === url);
                      const isImage = isImageFile(url);

                      return (
                        <div key={index} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white dark:border-slate-700 dark:bg-slate-800">
                          {isImage ? (
                            <img
                              src={getImageUrl(url)}
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-24 object-cover"
                              onError={(e) => {
                                console.error('Image failed to load:', url);
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/400x400?text=Preview';
                              }}
                            />
                          ) : (
                            <div className="w-full h-24 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-700">
                              {getFileIcon(url)}
                              <span className="text-xs text-gray-500 mt-1 truncate px-1 max-w-full dark:text-gray-400">
                                {url?.split('/').pop()?.slice(0, 15) || `File ${index + 1}`}
                              </span>
                            </div>
                          )}

                          {isPending && (
                            <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded z-10">
                              Pending Upload
                            </div>
                          )}

                          {isMarkedForDeletion && (
                            <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1 rounded z-10">
                              Will be deleted
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-8 h-8 p-0 rounded-full hover:bg-white dark:hover:bg-slate-600"
                              onClick={() => handlePreview(url)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-8 h-8 p-0 rounded-full"
                              onClick={() => handleDeleteAttachment(url, publicId, index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-amber-50/30 dark:border-slate-700 dark:bg-slate-800/30">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2 dark:text-gray-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No attachments</p>
                    <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Click "Select Files" to add images or PDFs</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignment & Notes */}
            <Card className="border-gray-200 bg-white dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Assignment & Notes</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-700 dark:text-gray-400">Assigned Officer</Label>
                    <Select
                      value={editedReport.assignedOfficer || "unassigned"}
                      onValueChange={(value) => {
                        setEditedReport(prev => ({ ...prev, assignedOfficer: value === "unassigned" ? "" : value }));
                      }}
                    >
                      <SelectTrigger className="mt-1 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                        <SelectValue placeholder={isLoadingOfficers ? "Loading officers..." : "Select officer to assign"}>
                          {getOfficerDisplayName(editedReport.assignedOfficer)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="text-gray-700 dark:bg-slate-800 dark:border-slate-700">
                        <SelectItem value="unassigned" className="text-gray-700 dark:text-gray-300 dark:focus:bg-slate-700 dark:focus:text-gray-100">
                          <span className="text-gray-500 dark:text-gray-400">None (Not Assigned)</span>
                        </SelectItem>
                        {officersList.map((officer) => (
                          <SelectItem key={officer.officerId} value={officer.officerId} className="text-gray-700 dark:text-gray-300 dark:focus:bg-slate-700 dark:focus:text-gray-100">
                            {officer.officerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editedReport.assignedOfficer && (
                      <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                        Assigned: {getOfficerDisplayName(editedReport.assignedOfficer)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-gray-700 dark:text-gray-400">Officer Notes</Label>
                    <Textarea
                      value={editedReport.officerNotes || ''}
                      onChange={(e) => setEditedReport(prev => ({ ...prev, officerNotes: e.target.value }))}
                      className="mt-1 bg-white min-h-[60px] text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                      placeholder="Add internal notes..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" className="text-gray-700 border-gray-700 rounded-xl dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700" onClick={handleClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button className="bg-[#D4A853] hover:bg-[#C49A48] rounded-xl text-white" onClick={handleSaveChanges} disabled={isSaving || isUploadingOnSave}>
                {isSaving || isUploadingOnSave ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 dark:bg-slate-800 dark:border dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Delete Attachment</h3>
            <p className="text-sm text-gray-600 mb-6 dark:text-gray-400">
              Are you sure you want to delete this attachment? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelDeleteAttachment} disabled={isDeletingAttachment} className="dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700">
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteAttachment} disabled={isDeletingAttachment}>
                {isDeletingAttachment ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : 'Delete'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ReportsEditing;
