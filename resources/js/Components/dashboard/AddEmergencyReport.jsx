import { useState, useEffect, useRef, Fragment } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, User, AlertCircle, Image, MessageSquare, Upload, Mail, Phone, Loader2, Eye, Trash2, MapPin, Clock, AlertTriangle, Sparkles, Search } from 'lucide-react';
import { categoryLabels, statusLabels, urgencyLabels, locationLabels } from '@/Pages/Reports';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/axios';

export const AddEmergencyReport = ({ isOpen, onClose, onSave, emergencyData }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState([]);
  const [attachmentPublicIds, setAttachmentPublicIds] = useState([]);
  const [officersList, setOfficersList] = useState([]);
  const [isLoadingOfficers, setIsLoadingOfficers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [foundStudent, setFoundStudent] = useState(null);

  // AI Feature State
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisTimeout, setAnalysisTimeout] = useState(null);

  const [newReport, setNewReport] = useState({
    reporterName: '',
    reporterEmail: '',
    reporterPhone: '',
    reporterMatricNo: '',
    category: 'emergency_alert',
    urgency: 'urgent',
    status: 'pending',
    description: '',
    locationArea: '',
    building: '',
    fullAddress: '',
    damages: '',
    suspectDescription: '',
    injuries: '',
    assignedOfficer: '',
    officerNotes: '',
    incidentDate: '',
    incidentTime: '',
  });

  // Update full address when locationArea or building changes
  const updateFullAddress = (locationAreaVal, buildingVal) => {
    let full = locationAreaVal || '';
    if (buildingVal && buildingVal.trim() !== '') {
      full = `${locationAreaVal}, ${buildingVal}`;
    }
    return full;
  };

  const handleLocationAreaChange = (value) => {
    const newFullAddress = updateFullAddress(value, newReport.building);
    setNewReport(prev => ({
      ...prev,
      locationArea: value,
      fullAddress: newFullAddress
    }));
  };

  const handleBuildingChange = (value) => {
    const newFullAddress = updateFullAddress(newReport.locationArea, value);
    setNewReport(prev => ({
      ...prev,
      building: value,
      fullAddress: newFullAddress
    }));
  };

  // Search student by matric number
  const searchStudentByMatric = async () => {
    if (!newReport.reporterMatricNo) {
      showToast('Please enter a matric number', 'error');
      return;
    }

    setIsSearchingStudent(true);
    try {
      const response = await api.get(`/api/students/search?matric=${newReport.reporterMatricNo}`);
      const data = response.data;

      if (data.student) {
        setFoundStudent(data.student);
        setNewReport(prev => ({
          ...prev,
          reporterName: data.student.name,
          reporterEmail: data.student.email,
          reporterPhone: data.student.phone,
        }));
        showToast('Student found! Information auto-filled.', 'success');
      } else {
        setFoundStudent(null);
        showToast('Student not found. Please enter details manually.', 'info');
      }
    } catch (error) {
      console.error('Error searching student:', error);
      showToast('Error searching for student', 'error');
    } finally {
      setIsSearchingStudent(false);
    }
  };

  // Helper function to extract location area from emergency address
  const extractLocationAreaFromAddress = (address) => {
    if (!address) return '';

    for (const group of Object.values(locationLabels)) {
      for (const [key, label] of Object.entries(group)) {
        if (address.toLowerCase().includes(key.toLowerCase()) ||
            address.toLowerCase().includes(label.toLowerCase())) {
          return label;
        }
      }
    }

    const mahallahNames = ['Asiah', 'Aminah', 'Safiyyah', 'Maryam', 'Ruqayyah', 'Ali', 'Faruq', 'Bilal', 'Asma', 'Hafsah', 'Halimah', 'Siddiq', 'Salahuddin', 'Uthman', 'Nusaibah', 'Zubair', 'Sumayyah'];
    for (const name of mahallahNames) {
      if (address.toLowerCase().includes(name.toLowerCase())) {
        return `Mahallah ${name}`;
      }
    }

    return address;
  };

  const extractBuildingFromAddress = (address, locationArea) => {
    if (!address) return '';
    if (locationArea && address.toLowerCase().includes(locationArea.toLowerCase())) {
      let remaining = address.replace(new RegExp(locationArea, 'i'), '').trim();
      remaining = remaining.replace(/^[,-\s]+/, '');
      if (remaining) return remaining;
    }
    return '';
  };

  // Populate form with emergency data when modal opens
  useEffect(() => {
    if (emergencyData && isOpen) {
      const date = new Date(emergencyData.triggeredAt);
      const formattedDate = date.toISOString().split('T')[0];
      const formattedTime = date.toTimeString().slice(0, 5);

      const emergencyAddress = emergencyData.address || '';
      let matchedLocationArea = extractLocationAreaFromAddress(emergencyAddress);
      let extractedBuilding = extractBuildingFromAddress(emergencyAddress, matchedLocationArea);

      if (emergencyData.location && emergencyData.location.building) {
        extractedBuilding = emergencyData.location.building;
      }

      if (!matchedLocationArea || matchedLocationArea === emergencyAddress) {
        matchedLocationArea = 'Mahallah Asiah';
      }

      const fullAddress = extractedBuilding
        ? `${matchedLocationArea}, ${extractedBuilding}`
        : matchedLocationArea;

      if (emergencyData.student) {
        setFoundStudent(emergencyData.student);
      }

      setNewReport({
        reporterName: emergencyData.student?.name || emergencyData.reporterName || '',
        reporterEmail: emergencyData.student?.email || emergencyData.reporterEmail || '',
        reporterPhone: emergencyData.student?.phone || emergencyData.reporterPhone || '',
        reporterMatricNo: emergencyData.student?.matrixNumber || emergencyData.reporterMatric || '',
        category: 'emergency_alert',
        urgency: 'urgent',
        status: 'pending',
        description: `🚨 EMERGENCY ALERT 🚨\n\nOriginal Location: ${emergencyAddress}\n\nTriggered at: ${date.toLocaleString()}\n\nThis report was automatically generated from an emergency alert.`,
        locationArea: matchedLocationArea,
        building: extractedBuilding,
        fullAddress: fullAddress,
        damages: '',
        suspectDescription: '',
        injuries: '',
        assignedOfficer: emergencyData.assigned_officer_id || '',
        officerNotes: `Converted from emergency alert. Original alert ID: ${emergencyData._id || emergencyData.id}\nOriginal Address: ${emergencyAddress}\n${emergencyData.dispatch_notes ? `\nDispatch Notes: ${emergencyData.dispatch_notes}` : ''}`,
        incidentDate: formattedDate,
        incidentTime: formattedTime,
      });

      setAiSuggestion(null);
      setIsAnalyzing(false);
      if (analysisTimeout) {
        clearTimeout(analysisTimeout);
      }
    }
  }, [emergencyData, isOpen]);

  // Fetch officers for dropdown
  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    setIsLoadingOfficers(true);
    try {
      const response = await api.get('/api/officers/list');
      setOfficersList(response.data);
    } catch (error) {
      console.error('Failed to fetch officers:', error);
    } finally {
      setIsLoadingOfficers(false);
    }
  };

  // Debounced description analysis
  useEffect(() => {
    if (analysisTimeout) {
      clearTimeout(analysisTimeout);
    }

    if (!newReport.description || newReport.description.length < 15) {
      setAiSuggestion(null);
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);

    const timeout = setTimeout(() => {
      analyzeDescription(newReport.description);
    }, 1200);

    setAnalysisTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [newReport.description]);

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
        setNewReport(prev => ({ ...prev, ...updates }));
        showToast(`AI suggestion applied: ${categoryLabels[aiSuggestion.category] || aiSuggestion.category} / ${urgencyLabels[aiSuggestion.urgency]}`, 'success');
      }
      setAiSuggestion(prev => prev ? { ...prev, applied: true } : null);
      setTimeout(() => {
        setAiSuggestion(prev => prev?.applied ? null : prev);
      }, 3000);
    }
  };

  const handleCategoryChange = (value) => {
    setNewReport(prev => ({ ...prev, category: value }));
    if (aiSuggestion && !aiSuggestion.applied) {
      setAiSuggestion(null);
      showToast('Manual selection made, AI suggestion cleared', 'info');
    }
  };

  const handleUrgencyChange = (value) => {
    setNewReport(prev => ({ ...prev, urgency: value }));
    if (aiSuggestion && !aiSuggestion.applied) {
      setAiSuggestion(null);
      showToast('Manual selection made, AI suggestion cleared', 'info');
    }
  };

  const getOfficerDisplayName = (officerId) => {
    const officer = officersList.find(o => o.officerId === officerId);
    return officer ? officer.officerName : 'Not Assigned';
  };

  const isImageFile = (url) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  };

  const getFileIcon = (url) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <Image className="w-8 h-8 text-blue-500 dark:text-blue-400" />;
    }
    if (extension === 'pdf') {
      return <FileText className="w-8 h-8 text-red-500 dark:text-red-400" />;
    }
    return <FileText className="w-8 h-8 text-gray-500 dark:text-gray-400" />;
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

  // File upload with AXIOS
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachments[]', file);
    });

    try {
      const response = await api.post('/reports/upload-attachments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;
      setAttachmentUrls(prev => [...prev, ...data.urls]);
      setAttachmentPublicIds(prev => [...prev, ...data.publicIds]);
      showToast('Files uploaded successfully', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Failed to upload files', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (url, index) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await api.delete('/reports/delete-attachment', {
        data: {
          attachmentUrl: url,
          attachmentPublicId: attachmentPublicIds[index],
        }
      });

      setAttachmentUrls(prev => prev.filter((_, i) => i !== index));
      setAttachmentPublicIds(prev => prev.filter((_, i) => i !== index));
      showToast('Attachment deleted successfully', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete attachment', 'error');
    }
  };

  const handlePreview = (url) => {
    if (url.includes('cloudinary.com') && !url.includes('.pdf')) {
      const baseUrl = url.split('?')[0];
      const highQualityUrl = `${baseUrl}?w=1200&h=1200&c=limit&q=auto&f=auto`;
      window.open(highQualityUrl, '_blank');
    } else {
      window.open(url, '_blank');
    }
  };

  const getOptimizedImageUrl = (url) => {
    if (!url) return '';
    if (url.includes('cloudinary.com')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}w=400&h=400&c=fill&q=auto&f=auto`;
    }
    return url;
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    const combinedAddress = (newReport.locationArea && newReport.building)
      ? `${newReport.locationArea}, ${newReport.building}`
      : (newReport.locationArea || '');

    const locationObj = {
      locationArea: newReport.locationArea || '',
      building: newReport.building || '',
      address: combinedAddress,
      timestamp: new Date().toISOString()
    };

    let incidentDateTime = null;
    if (newReport.incidentDate && newReport.incidentTime) {
      incidentDateTime = new Date(`${newReport.incidentDate}T${newReport.incidentTime}:00`).toISOString();
    }

    const payload = {
      studentId: foundStudent?._id || null,
      studentName: newReport.reporterName,
      studentEmail: newReport.reporterEmail,
      studentPhone: newReport.reporterPhone,
      studentMatric: newReport.reporterMatricNo,
      incidentCategory: newReport.category,
      description: newReport.description,
      mahallah: newReport.locationArea,
      incidentDateTime: incidentDateTime,
      urgency: newReport.urgency,
      injuries: newReport.injuries || null,
      damages: newReport.damages || null,
      suspectDescription: newReport.suspectDescription || null,
      assignedOfficer: newReport.assignedOfficer === "unassigned" ? null : newReport.assignedOfficer,
      officerNotes: newReport.officerNotes || null,
      attachmentUrls: attachmentUrls,
      attachmentPublicIds: attachmentPublicIds,
      location: locationObj,
    };

    console.log('Creating report from emergency:', payload);
    onSave(payload);

    resetForm();
    onClose();
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setNewReport({
      reporterName: '',
      reporterEmail: '',
      reporterPhone: '',
      reporterMatricNo: '',
      category: 'emergency_alert',
      urgency: 'urgent',
      status: 'pending',
      description: '',
      locationArea: '',
      building: '',
      fullAddress: '',
      damages: '',
      suspectDescription: '',
      injuries: '',
      assignedOfficer: '',
      officerNotes: '',
      incidentDate: '',
      incidentTime: '',
    });
    setAttachmentUrls([]);
    setAttachmentPublicIds([]);
    setFoundStudent(null);
    setAiSuggestion(null);
    setIsAnalyzing(false);
    if (analysisTimeout) {
      clearTimeout(analysisTimeout);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!emergencyData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 bg-white dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center dark:bg-red-900/20">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Create Report from Emergency Alert
              <p className="text-xs font-medium text-gray-600 mt-1 dark:text-gray-400">
                Converting emergency from {emergencyData.address || 'Unknown Location'}
              </p>
            </DialogTitle>
          </div>
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
                    value={newReport.reporterName}
                    onChange={(e) => setNewReport({...newReport, reporterName: e.target.value})}
                    className="mt-1 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-700 dark:text-gray-400">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <Input
                        type="email"
                        value={newReport.reporterEmail}
                        onChange={(e) => setNewReport({...newReport, reporterEmail: e.target.value})}
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
                        value={newReport.reporterPhone}
                        onChange={(e) => setNewReport({...newReport, reporterPhone: e.target.value})}
                        className="mt-1 bg-white pl-9 text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                        placeholder="012-3456789"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-700 dark:text-gray-400">Matric Number</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newReport.reporterMatricNo}
                      onChange={(e) => {
                        setNewReport({...newReport, reporterMatricNo: e.target.value});
                        setFoundStudent(null);
                      }}
                      className="bg-white flex-1 text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                      placeholder="e.g., 2226488"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={searchStudentByMatric}
                      disabled={isSearchingStudent || !newReport.reporterMatricNo}
                      className="shrink-0 gap-2 text-gray-700 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700"
                    >
                      {isSearchingStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Search
                    </Button>
                  </div>
                  {foundStudent && (
                    <p className="text-xs text-green-600 mt-1 dark:text-green-400">
                      ✓ Registered student found. Information auto-filled.
                    </p>
                  )}
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
                    <Select value={newReport.category} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="mt-1 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="text-gray-700 dark:bg-slate-800 dark:border-slate-700">
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="text-gray-700 dark:text-gray-300 dark:focus:bg-slate-700 dark:focus:text-gray-100">{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-700 dark:text-gray-400">Urgency Level *</Label>
                    <Select value={newReport.urgency} onValueChange={handleUrgencyChange}>
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
                    <Select value={newReport.status} onValueChange={(v) => setNewReport({...newReport, status: v})}>
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
                      value={newReport.incidentDate}
                      onChange={(e) => setNewReport({...newReport, incidentDate: e.target.value})}
                      className="mt-1 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-700 dark:text-gray-400">Incident Time *</Label>
                    <Input
                      type="time"
                      value={newReport.incidentTime}
                      onChange={(e) => setNewReport({...newReport, incidentTime: e.target.value})}
                      className="mt-1 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
                    />
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-700 dark:text-gray-400">Location Area *</Label>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400">
                      Select the general area where the incident occurred (Mahallah, Kulliyyah, or Facility)
                    </p>
                    <Select
                      value={newReport.locationArea || ""}
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
                  </div>

                  <div>
                    <Label className="text-xs text-gray-700 dark:text-gray-400">Specific Address (Building/Room/Block)</Label>
                    <div className="flex items-start gap-1.5 mt-1 mb-1">
                      <p className="text-[10px] text-gray-600 dark:text-gray-400">
                        Enter the specific location where the incident happened (building name/number, room/block, landmarks)
                      </p>
                    </div>
                    <Textarea
                      value={newReport.building || ''}
                      onChange={(e) => handleBuildingChange(e.target.value)}
                      className="mt-1 bg-white text-sm text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                      placeholder="e.g., Block A, Room 4.3, Floor 2, Near Canteen, etc."
                      rows={2}
                    />
                    <p className="text-[10px] text-blue-600 mt-1 dark:text-blue-400">
                      💡 Tip: Be as specific as possible to help security personnel locate the exact spot
                    </p>
                  </div>

                  {newReport.fullAddress && (
                    <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-light text-amber-700 dark:text-amber-300">Full Address:</span>
                      </div>
                      <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">{newReport.fullAddress}</p>
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
                    value={newReport.description}
                    onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                    className="mt-1 bg-white min-h-[100px] text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                    placeholder="Describe the incident in detail... AI will automatically analyze and suggest category & urgency!"
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
                    value={newReport.injuries}
                    onChange={(e) => setNewReport({...newReport, injuries: e.target.value})}
                    className="mt-1 bg-white min-h-[80px] text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                    placeholder="Describe any injuries sustained..."
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-700 dark:text-gray-400">Damages</Label>
                  <Textarea
                    value={newReport.damages}
                    onChange={(e) => setNewReport({...newReport, damages: e.target.value})}
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
                  value={newReport.suspectDescription}
                  onChange={(e) => setNewReport({...newReport, suspectDescription: e.target.value})}
                  className="mt-1 bg-white min-h-[80px] text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                  placeholder="Describe the suspect..."
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
                  <span className="text-xs text-gray-500 dark:text-gray-400">({attachmentUrls.length} files)</span>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2 text-gray-700 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : 'Select Files'}
                  </Button>
                </div>
              </div>

              {attachmentUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {attachmentUrls.map((url, index) => {
                    const isImage = isImageFile(url);
                    return (
                      <div key={index} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white dark:border-slate-700 dark:bg-slate-800">
                        {isImage ? (
                          <img
                            src={getOptimizedImageUrl(url)}
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
                            <span className="text-xs text-gray-500 mt-1 truncate px-1 dark:text-gray-400">
                              {url.split('/').pop()?.slice(0, 15) || `File ${index + 1}`}
                            </span>
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
                            onClick={() => handleDeleteAttachment(url, index)}
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
                    value={newReport.assignedOfficer || "unassigned"}
                    onValueChange={(value) => {
                      setNewReport(prev => ({ ...prev, assignedOfficer: value === "unassigned" ? "" : value }));
                    }}
                  >
                    <SelectTrigger className="mt-1 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                      <SelectValue placeholder={isLoadingOfficers ? "Loading officers..." : "Select officer to assign"} />
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
                  {newReport.assignedOfficer && (
                    <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                      Assigned: {getOfficerDisplayName(newReport.assignedOfficer)}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-700 dark:text-gray-400">Internal Notes</Label>
                  <Textarea
                    value={newReport.officerNotes}
                    onChange={(e) => setNewReport({...newReport, officerNotes: e.target.value})}
                    className="mt-1 bg-white min-h-[60px] text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                    placeholder="Add internal notes..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              className="text-gray-700 border-gray-300 rounded-xl dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#D4A853] hover:bg-[#C49A48] rounded-xl text-white"
              onClick={handleSubmit}
              disabled={isSubmitting || !newReport.reporterName || !newReport.reporterEmail || !newReport.reporterPhone || !newReport.category || !newReport.description || !newReport.locationArea || !newReport.incidentDate || !newReport.incidentTime}
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
