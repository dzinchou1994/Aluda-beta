'use client';

import { useState, useEffect } from 'react';
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
    skills: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCV, setGeneratedCV] = useState<string>('');
  const [showLivePreview, setShowLivePreview] = useState(false);

  const handleInputChange = (field: keyof CVData, value: string) => {
    setCvData(prev => ({ ...prev, [field]: value }));
  };

  const generateLivePreview = () => {
    return createCVHTML(cvData);
  };

  const generateCV = async () => {
    if (!cvData.fullName || !cvData.email || !cvData.phone) {
      alert('გთხოვთ შეავსოთ ყველა სავალდებულო ველი');
      return;
    }

    setIsGenerating(true);
    
    // Simulate generation process
    setTimeout(() => {
      const cvHTML = createCVHTML(cvData);
      setGeneratedCV(cvHTML);
      setIsGenerating(false);
    }, 2000);
  };

  const createCVHTML = (data: CVData) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>CV - ${data.fullName}</title>
        <style>
          body { 
            font-family: 'Inter', Arial, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background: white; 
            line-height: 1.6;
            color: #333;
          }
          .cv-container { max-width: 800px; margin: 0 auto; }
          .cv-header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding-bottom: 20px; 
            border-bottom: 3px solid #667eea; 
          }
          .cv-header h1 { 
            color: #333; 
            margin-bottom: 15px; 
            font-size: 2.5rem;
            font-weight: 700;
          }
          .contact-info { 
            display: flex; 
            justify-content: center; 
            gap: 30px; 
            flex-wrap: wrap;
            margin-top: 20px;
          }
          .contact-info p { 
            margin: 5px 0; 
            color: #666; 
            font-size: 1rem;
          }
          .cv-section { 
            margin-bottom: 30px; 
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 4px solid #667eea;
          }
          .cv-section h2 { 
            color: #333; 
            border-bottom: 2px solid #667eea; 
            padding-bottom: 10px; 
            margin-bottom: 15px;
            font-size: 1.5rem;
            font-weight: 600;
          }
          .cv-section p { 
            margin: 10px 0; 
            color: #555;
            font-size: 1rem;
          }
          @media print {
            body { padding: 20px; }
            .cv-section { background: white; border: 1px solid #ddd; }
          }
        </style>
      </head>
      <body>
        <div class="cv-container">
          <div class="cv-header">
            <h1>${data.fullName || ''}</h1>
            <div class="contact-info">
              ${data.email ? `<p>📧 ${data.email}</p>` : ''}
              ${data.phone ? `<p>📱 ${data.phone}</p>` : ''}
              ${data.address ? `<p>📍 ${data.address}</p>` : ''}
              ${data.linkedin ? `<p>🔗 ${data.linkedin}</p>` : ''}
            </div>
          </div>
          
          ${data.summary ? `
          <div class="cv-section">
            <h2>შესახებ</h2>
            <p>${data.summary}</p>
          </div>
          ` : ''}
          
          ${data.experience ? `
          <div class="cv-section">
            <h2>გამოცდილება</h2>
            <p>${data.experience}</p>
          </div>
          ` : ''}
          
          ${data.education ? `
          <div class="cv-section">
            <h2>განათლება</h2>
            <p>${data.education}</p>
          </div>
          ` : ''}
          
          ${data.skills ? `
          <div class="cv-section">
            <h2>უნარები</h2>
            <p>${data.skills}</p>
          </div>
          ` : ''}
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
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/docs')}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>უკან</span>
          </button>
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-slate-800">CV გენერატორი</h1>
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showLivePreview 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Live Preview</span>
              </span>
            </button>
          </div>
        </div>

        <div className={`mx-auto ${showLivePreview ? 'max-w-7xl' : 'max-w-4xl'}`}>
          <div className={`${showLivePreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : ''}`}>
            <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={(e) => { e.preventDefault(); generateCV(); }} className="space-y-6">
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
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-slate-800">Live Preview</h3>
                  <div className="flex space-x-2">
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
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={generateLivePreview()}
                    className="w-full h-96 border-0"
                    title="Live CV Preview"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}