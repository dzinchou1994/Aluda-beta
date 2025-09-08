'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CVData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  picture: string;
}

export default function CVGeneratorPage() {
  const router = useRouter();
  const [cvData, setCvData] = useState<CVData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    linkedin: '',
    summary: '',
    experience: '',
    education: '',
    skills: '',
    picture: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCV, setGeneratedCV] = useState<string>('');
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [previewZoom, setPreviewZoom] = useState(0.5);
  const [cvTemplate, setCvTemplate] = useState<'minimal' | 'classic'>('minimal');

  // Approximate A4 size at 96 DPI
  const a4WidthPx = 794; // 210mm @ ~96dpi
  const a4HeightPx = 1123; // 297mm @ ~96dpi

  const handleInputChange = (field: keyof CVData, value: string) => {
    setCvData(prev => ({ ...prev, [field]: value }));
  };

  const handlePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCvData(prev => ({ ...prev, picture: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePicture = () => {
    setCvData(prev => ({ ...prev, picture: '' }));
  };

  const generateLivePreview = () => {
    return createCVHTML(cvData, cvTemplate);
  };

  const generateCV = async () => {
    if (!cvData.fullName || !cvData.email || !cvData.phone) {
      alert('გთხოვ თ შეავსოთ ყველა სავალდებულო ველი');
      return;
    }

    setIsGenerating(true);
    
    // Simulate generation process
    setTimeout(() => {
      const cvHTML = createCVHTML(cvData, cvTemplate);
      setGeneratedCV(cvHTML);
      setIsGenerating(false);
    }, 2000);
  };

  const createCVHTML = (data: CVData, template: 'minimal' | 'classic') => {
    const skillItems = (data.skills || '')
      .split(/[\,\n]/)
      .map(s => s.trim())
      .filter(Boolean);
    const experienceItems = (data.experience || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const educationItems = (data.education || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>CV - ${data.fullName}</title>
        <style>
          :root { --text: #0f172a; --muted: #475569; --border: #e2e8f0; --bg: #ffffff; --subtle: #f8fafc; --accent: #2563eb; --font: 'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, 'Apple Color Emoji', 'Segoe UI Emoji'; }
          body.t-minimal { --text: #0f172a; --muted: #475569; --border: #e2e8f0; --bg: #ffffff; --subtle: #f8fafc; --accent: #2563eb; --font: 'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; }
          body.t-classic { --text: #111827; --muted: #4b5563; --border: #e5e7eb; --bg: #ffffff; --subtle: #ffffff; --accent: #111827; --font: Georgia, 'Times New Roman', serif; }
          /* art template removed */
          * { box-sizing: border-box; }
          body { font-family: var(--font); margin: 0; padding: 24px; background: var(--bg); color: var(--text); line-height: 1.6; }
          .cv-page { max-width: 800px; margin: 0 auto; background: #fff; }
          .cv-header { padding-bottom: 20px; border-bottom: 1px solid var(--border); text-align: center; }
          .cv-photo { margin-bottom: 16px; }
          .cv-photo img { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid var(--border); box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          .cv-name { margin: 0 0 8px 0; font-size: 34px; letter-spacing: -0.02em; }
          .contact-info { display: flex; justify-content: center; flex-wrap: wrap; gap: 16px; color: var(--muted); font-size: 14px; }
          .cv-section { padding: 18px 0; border-bottom: 1px solid var(--border); }
          .cv-section:last-child { border-bottom: 0; }
          .cv-section h2 { margin: 0 0 10px 0; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
          .cv-section p { margin: 8px 0; color: var(--text); }
          ul.clean { margin: 8px 0; padding-left: 18px; }
          ul.clean li { margin: 6px 0; }
          .chips { display: flex; flex-wrap: wrap; gap: 8px; }
          .chip { display: inline-block; padding: 6px 10px; border-radius: 9999px; background: var(--subtle); border: 1px solid var(--border); font-size: 13px; color: var(--text); }
          .placeholder { color: #94a3b8; }
          .placeholder-block { background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; }
          /* Classic tweaks */
          .t-classic .cv-header { text-align: left; padding-bottom: 12px; border-bottom: 2px solid var(--accent); }
          .t-classic .cv-name { font-size: 36px; letter-spacing: 0; }
          .t-classic .contact-info { justify-content: flex-start; gap: 12px; font-style: italic; }
          .t-classic .cv-section { padding: 20px 0; border-bottom: 1px solid var(--border); }
          .t-classic .cv-section h2 { font-variant: small-caps; letter-spacing: 0.12em; color: var(--text); }
          /* art template removed */
          @media print { @page { size: A4; margin: 16mm; } body { padding: 0; } }
        </style>
      </head>
      <body class="t-${template}">
        <div class="cv-page">
          <div class="cv-header">
            ${data.picture ? `<div class="cv-photo"><img src="${data.picture}" alt="Profile Photo"></div>` : ''}
            <h1 class="cv-name">${data.fullName || 'თქვენი სრული სახელი'}</h1>
            <div class="contact-info">
              <span>${data.email || '<span class="placeholder">ელ-ფოსტა</span>'}</span>
              <span>${data.phone || '<span class="placeholder">ტელეფონი</span>'}</span>
              <span>${data.address || '<span class="placeholder">მისამართი</span>'}</span>
              <span>${data.linkedin || '<span class="placeholder">LinkedIn</span>'}</span>
            </div>
          </div>

          <div class="cv-section cv-summary">
            <h2>შესახებ</h2>
            ${data.summary ? `<p>${data.summary}</p>` : `<div class="placeholder-block"><p class="placeholder">მოკლე შეჯამება თქვენი გამოცდილებისა და მიზნების შესახებ...</p></div>`}
          </div>

          <div class="cv-section cv-experience">
            <h2>გამოცდილება</h2>
            ${experienceItems.length ? `<ul class="clean">${experienceItems.map(i => `<li>${i}</li>`).join('')}</ul>` : `<div class="placeholder-block"><p class="placeholder">დაამატეთ თქვენი სამუშაო გამოცდილება, როლები და მიღწევები...</p></div>`}
          </div>

          <div class="cv-section cv-education">
            <h2>განათლება</h2>
            ${educationItems.length ? `<ul class="clean">${educationItems.map(i => `<li>${i}</li>`).join('')}</ul>` : `<div class="placeholder-block"><p class="placeholder">დაამატეთ სასწავლებლები, ხარისხები და თარიღები...</p></div>`}
          </div>

          <div class="cv-section cv-skills">
            <h2>უნარები</h2>
            ${skillItems.length ? `<div class="chips">${skillItems.map(s => `<span class="chip">${s}</span>`).join('')}</div>` : `<div class="placeholder-block"><p class="placeholder">ჩამოთვალეთ თქვენი ძირითადი ტექნიკური და რბილი უნარები...</p></div>`}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const downloadCV = () => {
    const blob = new Blob([generatedCV], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CV-${cvData.fullName || 'Document'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printCV = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatedCV);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (generatedCV) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setGeneratedCV('')}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>უკან</span>
            </button>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadCV}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">ჩამოტვირთვა</span>
                <span className="sm:hidden">Download</span>
              </button>
              <button
                onClick={printCV}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span className="hidden sm:inline">ბეჭდვა</span>
                <span className="sm:hidden">Print</span>
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <iframe
              srcDoc={generatedCV}
              className="w-full h-screen border-0"
              title="Generated CV"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={() => router.push('/docs')}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>უკან</span>
            </button>
          </div>
          
          {/* Title and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">CV გენერატორი</h1>
            
            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Template Selector - Mobile Friendly */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-slate-600 whitespace-nowrap">Template:</label>
                <select
                  value={cvTemplate}
                  onChange={(e) => setCvTemplate(e.target.value as 'minimal' | 'classic')}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="minimal">Minimalistic</option>
                  <option value="classic">Classic</option>
                </select>
              </div>
              
              {/* Live Preview Button */}
              <button
                type="button"
                onClick={() => setShowLivePreview(!showLivePreview)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showLivePreview 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm sm:text-base">Live Preview</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className={`mx-auto ${showLivePreview ? 'max-w-7xl' : 'max-w-4xl'}`}>
          <div className={`${showLivePreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-start' : ''}`}>
            <div className={`bg-white rounded-xl shadow-lg p-8 ${showLivePreview ? 'max-h-[800px] overflow-y-auto' : ''}`}>
            <form onSubmit={(e) => { e.preventDefault(); generateCV(); }} className="space-y-6">
              {/* Picture Upload */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  პროფილის ფოტო
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {cvData.picture ? (
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-300">
                        <img
                          src={cvData.picture}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePictureUpload}
                      className="hidden"
                      id="picture-upload"
                    />
                    <label
                      htmlFor="picture-upload"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm"
                    >
                      ფოტოს არჩევა
                    </label>
                    {cvData.picture && (
                      <button
                        type="button"
                        onClick={removePicture}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        წაშლა
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">ატვირთეთ თქვენი პროფესიონალური ფოტო (არასავალდებულო)</p>
              </div>

              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    სრული სახელი *
                  </label>
                  <input
                    type="text"
                    value={cvData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="შეიყვანეთ თქვენი სრული სახელი"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ელ-ფოსტა *
                  </label>
                  <input
                    type="email"
                    value={cvData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="example@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ტელეფონი *
                  </label>
                  <input
                    type="tel"
                    value={cvData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+995 555 123 456"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    მისამართი
                  </label>
                  <input
                    type="text"
                    value={cvData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="თბილისი, საქართველო"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={cvData.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>

              {/* Professional Summary */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  პროფესიონალური შეჯამება
                </label>
                <textarea
                  value={cvData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="მოკლე აღწერა თქვენი პროფესიონალური გამოცდილებისა და მიზნების შესახებ..."
                />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  გამოცდილება
                </label>
                <textarea
                  value={cvData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="შეიყვანეთ თქვენი სამუშაო გამოცდილება..."
                />
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  განათლება
                </label>
                <textarea
                  value={cvData.education}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="შეიყვანეთ თქვენი განათლება..."
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  უნარები
                </label>
                <textarea
                  value={cvData.skills}
                  onChange={(e) => handleInputChange('skills', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="შეიყვანეთ თქვენი უნარები..."
                />
              </div>

              {/* Generate Button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>გენერირება...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>CV-ის გენერირება</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            </div>
            
            {/* Live Preview Panel */}
            {showLivePreview && (
              <div className="bg-white rounded-xl shadow-lg p-8 max-h-[800px] flex flex-col lg:sticky lg:top-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-slate-800">Live Preview</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setPreviewZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
                        className="px-2 py-1 text-slate-700 hover:bg-slate-100"
                        aria-label="Zoom out"
                      >
                        −
                      </button>
                      <div className="px-3 py-1 text-sm tabular-nums text-slate-700">{Math.round(previewZoom * 100)}%</div>
                      <button
                        type="button"
                        onClick={() => setPreviewZoom(z => Math.min(2, Math.round((z + 0.1) * 10) / 10))}
                        className="px-2 py-1 text-slate-700 hover:bg-slate-100"
                        aria-label="Zoom in"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        const previewHTML = generateLivePreview();
                        const blob = new Blob([previewHTML], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `CV-Preview-${cvData.fullName || 'Document'}.html`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-auto flex-1 bg-slate-50">
                  <div
                    className="mx-auto my-4"
                    style={{ width: `${Math.round(a4WidthPx * previewZoom)}px`, height: `${Math.round(a4HeightPx * previewZoom)}px` }}
                  >
                    <iframe
                      srcDoc={generateLivePreview()}
                      title="Live CV Preview"
                      style={{
                        width: `${a4WidthPx}px`,
                        height: `${a4HeightPx}px`,
                        border: '0',
                        transform: `scale(${previewZoom})`,
                        transformOrigin: 'top left',
                        background: 'white',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}