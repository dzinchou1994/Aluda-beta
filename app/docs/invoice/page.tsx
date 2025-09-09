'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DocsHeader from '@/components/DocsHeader';

interface InvoiceItem {
  id: string;
  description: string;
  unit?: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceData {
  billerName: string;
  billerAddress: string;
  billerEmail: string;
  billerPhone: string;
  billerCompanyId: string;
  billerLogo: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  clientCompanyId: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxRate: number;
  notes: string;
  bankName: string;
  bankAccount: string;
  bankRecipientName: string;
  signature: string;
  companyStamp: string;
}

// Georgian banks list
const georgianBanks = [
  'TBC ბანკი',
  'საქართველოს ბანკი',
  'ბანკი ტბილისი',
  'პროკრედიტ ბანკი',
  'ვითიბი ბანკი',
  'ჰალიკ ბანკი',
  'ზირათ ბანკი',
  'ფრიდომ ბანკი',
  'ბაზის ბანკი',
  'პაშა ბანკი',
  'საქართველოს ბანკი (საქართველოს ბანკი)',
  'სხვა'
];

// Signature Capture Component
const SignatureCapture = ({ onSave, onCancel }: { onSave: (data: string) => void; onCancel: () => void }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL('image/png');
    onSave(dataURL);
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">ხელმოწერის დამატება</h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg mb-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full h-48 cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            გასუფთავება
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            გაუქმება
          </button>
          <button
            onClick={saveSignature}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            შენახვა
          </button>
        </div>
      </div>
    </div>
  );
};

export default function InvoiceGeneratorPage() {
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    billerName: '',
    billerAddress: '',
    billerEmail: '',
    billerPhone: '',
    billerCompanyId: '',
    billerLogo: '',
    clientName: '',
    clientAddress: '',
    clientEmail: '',
    clientPhone: '',
    clientCompanyId: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    taxRate: 0,
    notes: '',
    bankName: '',
    bankAccount: '',
    bankRecipientName: '',
    signature: '',
    companyStamp: ''
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', unit: 'ცალი', quantity: 1, price: 0, total: 0 }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<string>('');
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [previewZoom, setPreviewZoom] = useState(0.5);
  const [customBankName, setCustomBankName] = useState<string>('');
  const [templateStyle, setTemplateStyle] = useState<'modern' | 'classic'>('modern');
  const [useGeorgianVAT, setUseGeorgianVAT] = useState<boolean>(false);
  const [vatIncluded, setVatIncluded] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false);
  const [showStampModal, setShowStampModal] = useState<boolean>(false);

  // Step-by-step wizard state
  const steps = [
    { key: 'header', label: 'ინვოისი' },
    { key: 'biller', label: 'გამყიდველი' },
    { key: 'client', label: 'მყიდველი' },
    { key: 'items', label: 'ნივთები & გადასახადი' },
    { key: 'bank', label: 'ბანკი' },
    { key: 'signature', label: 'ხელმოწერა & შენიშვნები' },
  ] as const;
  const [currentStep, setCurrentStep] = useState<number>(0);

  const canProceedFromStep = (stepIndex: number) => {
    if (stepIndex === 0) {
      return Boolean(invoiceData.invoiceNumber && invoiceData.invoiceDate);
    }
    if (stepIndex === 1) {
      return Boolean(invoiceData.billerName && invoiceData.billerEmail && invoiceData.billerPhone);
    }
    if (stepIndex === 2) {
      return Boolean(invoiceData.clientName && invoiceData.clientEmail);
    }
    if (stepIndex === 3) {
      return items.some(item => item.description && item.quantity > 0 && item.price > 0);
    }
    return true;
  };

  const goNext = () => {
    if (canProceedFromStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
    }
  };

  const goBack = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  // Approximate A4 size at 96 DPI
  const a4WidthPx = 794; // 210mm @ ~96dpi
  const a4HeightPx = 1123; // 297mm @ ~96dpi

  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('invoiceData');
    const savedItems = localStorage.getItem('invoiceItems');
    const savedSettings = localStorage.getItem('invoiceSettings');
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setInvoiceData(parsedData);
      } catch (error) {
        console.error('Error loading saved invoice data:', error);
      }
    }
    
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems);
        setItems(parsedItems);
      } catch (error) {
        console.error('Error loading saved items:', error);
      }
    }
    
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setUseGeorgianVAT(parsedSettings.useGeorgianVAT || false);
        setVatIncluded(parsedSettings.vatIncluded || false);
        setCustomBankName(parsedSettings.customBankName || '');
        setTemplateStyle(parsedSettings.templateStyle || 'modern');
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
    
    // Mark initial load as complete
    setIsInitialLoad(false);
  }, []);

  // Save data whenever it changes (but not during initial load)
  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem('invoiceData', JSON.stringify(invoiceData));
    }
  }, [invoiceData, isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem('invoiceItems', JSON.stringify(items));
    }
  }, [items, isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem('invoiceSettings', JSON.stringify({
        useGeorgianVAT,
        vatIncluded,
        customBankName,
        templateStyle
      }));
    }
  }, [useGeorgianVAT, vatIncluded, customBankName, templateStyle, isInitialLoad]);

  const handleInputChange = (field: keyof InvoiceData, value: string | number) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setInvoiceData(prev => ({ ...prev, billerLogo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setInvoiceData(prev => ({ ...prev, billerLogo: '' }));
  };

  const handleSignatureCapture = (signatureData: string) => {
    setInvoiceData(prev => ({ ...prev, signature: signatureData }));
    setShowSignatureModal(false);
  };

  const handleStampUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setInvoiceData(prev => ({ ...prev, companyStamp: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSignature = () => {
    setInvoiceData(prev => ({ ...prev, signature: '' }));
  };

  const removeStamp = () => {
    setInvoiceData(prev => ({ ...prev, companyStamp: '' }));
  };

  const handleVatOptionChange = (option: 'none' | 'add' | 'included') => {
    if (option === 'none') {
      setUseGeorgianVAT(false);
      setVatIncluded(false);
      setInvoiceData(prev => ({ ...prev, taxRate: 0 }));
    } else if (option === 'add') {
      setUseGeorgianVAT(true);
      setVatIncluded(false);
      setInvoiceData(prev => ({ ...prev, taxRate: 18 }));
    } else if (option === 'included') {
      setUseGeorgianVAT(false);
      setVatIncluded(true);
      setInvoiceData(prev => ({ ...prev, taxRate: 18 }));
    }
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      unit: 'ცალი',
      quantity: 1,
      price: 0,
      total: 0
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updatedItem.total = updatedItem.quantity * updatedItem.price;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const generateLivePreview = () => {
    return createInvoiceHTML(invoiceData, items, templateStyle, useGeorgianVAT, vatIncluded);
  };

  const generateInvoice = async () => {
    if (!invoiceData.billerName || !invoiceData.clientName || !invoiceData.invoiceNumber) {
      alert('გთხოვთ შეავსოთ ყველა სავალდებულო ველი');
      return;
    }

    const validItems = items.filter(item => item.description && item.quantity > 0 && item.price > 0);
    if (validItems.length === 0) {
      alert('გთხოვთ დაამატოთ მინიმუმ ერთი ნივთი');
      return;
    }

    try {
    setIsGenerating(true);
      console.log('Generating PDF directly from form data...');
    
      const invoiceHTML = createInvoiceHTML(invoiceData, validItems, templateStyle, useGeorgianVAT, vatIncluded);
      await downloadPDFViaAPI(invoiceHTML, `Invoice-${invoiceData.invoiceNumber || 'Document'}`);
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('შეცდომა PDF-ის გენერაციისას. გთხოვთ სცადოთ კვლავ.');
      setIsGenerating(false);
    }
  };

  const createInvoiceHTML = (data: InvoiceData, items: InvoiceItem[], style: 'modern' | 'classic' = 'modern', isGeorgianVAT: boolean = false, isVatIncluded: boolean = false) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    
    let tax, total, subtotalWithoutVat;
    
    if (isVatIncluded && data.taxRate > 0) {
      // VAT is included in the price, so we need to calculate the VAT amount from the total
      total = subtotal; // Total is what user entered
      tax = total * (data.taxRate / (100 + data.taxRate)); // Calculate VAT from total
      subtotalWithoutVat = total - tax; // Subtotal without VAT
    } else if (isGeorgianVAT && data.taxRate > 0) {
      // VAT is added to the price
      tax = subtotal * (data.taxRate / 100);
      total = subtotal + tax;
      subtotalWithoutVat = subtotal;
    } else {
      // No VAT
      tax = 0;
      total = subtotal;
      subtotalWithoutVat = subtotal;
    }
    
    // Use custom bank name if "სხვა" is selected
    const displayBankName = data.bankName === 'სხვა' ? customBankName : data.bankName;

    if (style === 'classic') {
      return createClassicInvoiceHTML(data, items, subtotalWithoutVat, tax, total, displayBankName, isGeorgianVAT, isVatIncluded);
    }
    
    return createModernInvoiceHTML(data, items, subtotalWithoutVat, tax, total, displayBankName, isGeorgianVAT, isVatIncluded);
  };

  const createModernInvoiceHTML = (data: InvoiceData, items: InvoiceItem[], subtotal: number, tax: number, total: number, displayBankName: string, isGeorgianVAT: boolean = false, isVatIncluded: boolean = false) => {

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ინვოისი - ${data.invoiceNumber}</title>
        <style>
          :root { --text:#0f172a; --muted:#475569; --border:#e2e8f0; --bg:#ffffff; --subtle:#f8fafc; --accent:#16a34a; }
          * { box-sizing: border-box; }
          body { font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin:0; padding:24px; background:var(--bg); color:var(--text); line-height:1.6; }
          .invoice-page { max-width: 900px; margin:0 auto; background:#fff; }
          .invoice-header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:16px; border-bottom:1px solid var(--border); }
          .brand-section { display:flex; align-items:center; gap:16px; }
          .company-logo { width:60px; height:60px; object-fit:contain; border-radius:8px; }
          .brand { font-size:28px; font-weight:700; letter-spacing:-0.02em; color:var(--text); }
          .meta { text-align:right; color:var(--muted); font-size:14px; }
          .meta .number { font-size:16px; color:var(--text); font-weight:600; }
          .parties { display:grid; grid-template-columns:1fr 1fr; gap:24px; padding:18px 0; border-bottom:1px solid var(--border); }
          .card { background:var(--subtle); border:1px solid var(--border); border-radius:10px; padding:16px; }
          .card h3 { margin:0 0 10px 0; font-size:13px; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); }
          .card p { margin:6px 0; }
          table { width:100%; border-collapse: collapse; margin-top:18px; border:1px solid var(--border); }
          thead th { font-size:13px; text-transform:uppercase; letter-spacing:0.08em; text-align:left; padding:12px; background:var(--subtle); color:var(--muted); border-bottom:1px solid var(--border); }
          tbody td { padding:12px; border-bottom:1px solid var(--border); }
          tbody tr:nth-child(odd) { background:#fff; }
          tbody tr:nth-child(even) { background:#fcfdff; }
          .right { text-align:right; }
          .totals { display:grid; grid-template-columns: 1fr 280px; gap:20px; align-items:start; margin-top:16px; }
          .totals .summary { background:var(--subtle); border:1px solid var(--border); border-radius:8px; padding:12px; }
          .row { display:flex; justify-content:space-between; padding:4px 0; font-size:14px; }
          .row.total { border-top:1px dashed var(--border); margin-top:6px; padding-top:8px; font-weight:700; font-size:16px; }
          .notes { background:var(--subtle); border:1px solid var(--border); border-radius:10px; padding:16px; margin-top:18px; }
          .badge { display:inline-block; font-size:12px; padding:4px 8px; border-radius:9999px; border:1px solid var(--border); background:#fff; color:var(--muted); }
          @media print { @page { size:A4; margin: 12mm; } body { padding:0; } }
        </style>
      </head>
      <body>
        <div class="invoice-page">
          <div class="invoice-header">
            <div class="brand-section">
              ${data.billerLogo ? `<img src="${data.billerLogo}" alt="Company Logo" class="company-logo" />` : ''}
            <div>
              <div class="brand">${data.billerName || 'კომპანია'}</div>
              <div class="badge">ინვოისი</div>
              </div>
            </div>
            <div class="meta">
              <div class="number">#${data.invoiceNumber}</div>
              <div>${new Date(data.invoiceDate).toLocaleDateString('ka-GE')}</div>
            </div>
          </div>

          <div class="parties">
            <div class="card">
              <h3>გამყიდველი</h3>
              <p><strong>${data.billerName || ''}</strong></p>
              ${data.billerCompanyId ? `<p><strong>საიდენტიფიკაციო კოდი:</strong> ${data.billerCompanyId}</p>` : ''}
              ${data.billerAddress ? `<p>${data.billerAddress}</p>` : ''}
              ${data.billerEmail ? `<p>${data.billerEmail}</p>` : ''}
              ${data.billerPhone ? `<p>${data.billerPhone}</p>` : ''}
            </div>
            <div class="card">
              <h3>მყიდველი</h3>
              <p><strong>${data.clientName || ''}</strong></p>
              ${data.clientCompanyId ? `<p><strong>საიდენტიფიკაციო კოდი:</strong> ${data.clientCompanyId}</p>` : ''}
              ${data.clientAddress ? `<p>${data.clientAddress}</p>` : ''}
              ${data.clientEmail ? `<p>${data.clientEmail}</p>` : ''}
              ${data.clientPhone ? `<p>${data.clientPhone}</p>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>აღწერა</th>
                <th class="right">რაოდენობა</th>
                <th class="right">ფასი</th>
                <th class="right">ჯამი</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.description}${item.unit ? ` (${item.unit})` : ''}</td>
                  <td class="right">${item.quantity}</td>
                  <td class="right">₾${item.price.toFixed(2)}</td>
                  <td class="right">₾${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div></div>
            <div class="summary">
              ${isVatIncluded && data.taxRate > 0 ? `
                <div class="row"><span>ჯამი (დღგ-ს გარეშე)</span><span>₾${subtotal.toFixed(2)}</span></div>
                <div class="row"><span>${isGeorgianVAT ? 'დღგ' : 'გადასახადი'} ${data.taxRate}%</span><span>₾${tax.toFixed(2)}</span></div>
                <div class="row total"><span>საბოლოო ჯამი (დღგ ჩათვლით)</span><span>₾${total.toFixed(2)}</span></div>
              ` : `
                <div class="row"><span>ჯამი</span><span>₾${subtotal.toFixed(2)}</span></div>
                ${data.taxRate > 0 ? `<div class="row"><span>${isGeorgianVAT ? 'დღგ' : 'გადასახადი'} ${data.taxRate}%</span><span>₾${tax.toFixed(2)}</span></div>` : ''}
                <div class="row total"><span>საბოლოო ჯამი</span><span>₾${total.toFixed(2)}</span></div>
              `}
            </div>
          </div>

          ${displayBankName || data.bankAccount || data.bankRecipientName ? `
          <div class="notes">
            <div class="badge">ბანკის ანგარიშის ინფორმაცია</div>
            ${displayBankName ? `<p><strong>ბანკი:</strong> ${displayBankName}</p>` : ''}
            ${data.bankAccount ? `<p><strong>ანგარიშის ნომერი:</strong> ${data.bankAccount}</p>` : ''}
            ${data.bankRecipientName ? `<p><strong>მიმღების სახელი:</strong> ${data.bankRecipientName}</p>` : ''}
          </div>
          ` : ''}

          ${data.notes ? `
          <div class="notes">
            <div class="badge">შენიშვნები</div>
            <p>${data.notes}</p>
          </div>
          ` : ''}

          ${data.signature || data.companyStamp ? `
          <div class="notes" style="margin-top: 20px;">
            <div class="badge">ხელმოწერა და ბეჭედი</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
              ${data.signature ? `<div><img src="${data.signature}" alt="Signature" style="max-width: 150px; max-height: 60px; border: 1px solid #ccc;" /></div>` : '<div></div>'}
              ${data.companyStamp ? `<div><img src="${data.companyStamp}" alt="Company Stamp" style="max-width: 100px; max-height: 100px; border: 1px solid #ccc;" /></div>` : '<div></div>'}
            </div>
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  };

  const createClassicInvoiceHTML = (data: InvoiceData, items: InvoiceItem[], subtotal: number, tax: number, total: number, displayBankName: string, isGeorgianVAT: boolean = false, isVatIncluded: boolean = false) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ინვოისი - ${data.invoiceNumber}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Times New Roman', serif; margin:0; padding:20px; background:#fff; color:#000; line-height:1.4; }
          .invoice-page { max-width: 800px; margin:0 auto; background:#fff; }
          .invoice-header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:20px; border-bottom:2px solid #000; }
          .brand-section { display:flex; align-items:center; gap:20px; }
          .company-logo { width:80px; height:80px; object-fit:contain; border:1px solid #ccc; }
          .brand { font-size:24px; font-weight:bold; color:#000; text-transform:uppercase; }
          .meta { text-align:right; color:#000; font-size:14px; }
          .meta .number { font-size:18px; color:#000; font-weight:bold; }
          .parties { display:grid; grid-template-columns:1fr 1fr; gap:30px; padding:20px 0; border-bottom:1px solid #000; }
          .card { border:1px solid #000; padding:15px; }
          .card h3 { margin:0 0 10px 0; font-size:14px; font-weight:bold; color:#000; text-transform:uppercase; }
          .card p { margin:5px 0; }
          table { width:100%; border-collapse: collapse; margin-top:20px; border:1px solid #000; }
          thead th { font-size:12px; font-weight:bold; text-align:left; padding:10px; background:#f0f0f0; color:#000; border:1px solid #000; }
          tbody td { padding:10px; border:1px solid #000; }
          .right { text-align:right; }
          .totals { display:grid; grid-template-columns: 1fr 300px; gap:24px; align-items:start; margin-top:18px; }
          .totals .summary { border:1px solid #000; padding:12px; }
          .row { display:flex; justify-content:space-between; padding:3px 0; font-size:13px; }
          .row.total { border-top:2px solid #000; margin-top:8px; padding-top:8px; font-weight:bold; font-size:15px; }
          .notes { border:1px solid #000; padding:15px; margin-top:20px; }
          .badge { display:inline-block; font-size:10px; padding:3px 6px; border:1px solid #000; background:#fff; color:#000; font-weight:bold; }
          @media print { @page { size:A4; margin: 15mm; } body { padding:0; } }
        </style>
      </head>
      <body>
        <div class="invoice-page">
          <div class="invoice-header">
            <div class="brand-section">
              ${data.billerLogo ? `<img src="${data.billerLogo}" alt="Company Logo" class="company-logo" />` : ''}
              <div>
                <div class="brand">${data.billerName || 'კომპანია'}</div>
                <div class="badge">ინვოისი</div>
              </div>
            </div>
            <div class="meta">
              <div class="number">#${data.invoiceNumber}</div>
              <div>${new Date(data.invoiceDate).toLocaleDateString('ka-GE')}</div>
            </div>
          </div>

          <div class="parties">
            <div class="card">
              <h3>გამყიდველი</h3>
              <p><strong>${data.billerName || ''}</strong></p>
              ${data.billerCompanyId ? `<p><strong>საიდენტიფიკაციო კოდი:</strong> ${data.billerCompanyId}</p>` : ''}
              ${data.billerAddress ? `<p>${data.billerAddress}</p>` : ''}
              ${data.billerEmail ? `<p>${data.billerEmail}</p>` : ''}
              ${data.billerPhone ? `<p>${data.billerPhone}</p>` : ''}
            </div>
            <div class="card">
              <h3>მყიდველი</h3>
              <p><strong>${data.clientName || ''}</strong></p>
              ${data.clientCompanyId ? `<p><strong>საიდენტიფიკაციო კოდი:</strong> ${data.clientCompanyId}</p>` : ''}
              ${data.clientAddress ? `<p>${data.clientAddress}</p>` : ''}
              ${data.clientEmail ? `<p>${data.clientEmail}</p>` : ''}
              ${data.clientPhone ? `<p>${data.clientPhone}</p>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>აღწერა</th>
                <th class="right">რაოდენობა</th>
                <th class="right">ფასი</th>
                <th class="right">ჯამი</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.description}${item.unit ? ` (${item.unit})` : ''}</td>
                  <td class="right">${item.quantity}</td>
                  <td class="right">₾${item.price.toFixed(2)}</td>
                  <td class="right">₾${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div></div>
            <div class="summary">
              ${isVatIncluded && data.taxRate > 0 ? `
                <div class="row"><span>ჯამი (დღგ-ს გარეშე)</span><span>₾${subtotal.toFixed(2)}</span></div>
                <div class="row"><span>${isGeorgianVAT ? 'დღგ' : 'გადასახადი'} ${data.taxRate}%</span><span>₾${tax.toFixed(2)}</span></div>
                <div class="row total"><span>საბოლოო ჯამი (დღგ ჩათვლით)</span><span>₾${total.toFixed(2)}</span></div>
              ` : `
                <div class="row"><span>ჯამი</span><span>₾${subtotal.toFixed(2)}</span></div>
                ${data.taxRate > 0 ? `<div class="row"><span>${isGeorgianVAT ? 'დღგ' : 'გადასახადი'} ${data.taxRate}%</span><span>₾${tax.toFixed(2)}</span></div>` : ''}
                <div class="row total"><span>საბოლოო ჯამი</span><span>₾${total.toFixed(2)}</span></div>
              `}
            </div>
          </div>

          ${displayBankName || data.bankAccount || data.bankRecipientName ? `
          <div class="notes">
            <div class="badge">ბანკის ანგარიშის ინფორმაცია</div>
            ${displayBankName ? `<p><strong>ბანკი:</strong> ${displayBankName}</p>` : ''}
            ${data.bankAccount ? `<p><strong>ანგარიშის ნომერი:</strong> ${data.bankAccount}</p>` : ''}
            ${data.bankRecipientName ? `<p><strong>მიმღების სახელი:</strong> ${data.bankRecipientName}</p>` : ''}
          </div>
          ` : ''}

          ${data.notes ? `
          <div class="notes">
            <div class="badge">შენიშვნები</div>
            <p>${data.notes}</p>
          </div>
          ` : ''}

          ${data.signature || data.companyStamp ? `
          <div class="notes" style="margin-top: 20px;">
            <div class="badge">ხელმოწერა და ბეჭედი</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
              ${data.signature ? `<div><img src="${data.signature}" alt="Signature" style="max-width: 150px; max-height: 60px; border: 1px solid #ccc;" /></div>` : '<div></div>'}
              ${data.companyStamp ? `<div><img src="${data.companyStamp}" alt="Company Stamp" style="max-width: 100px; max-height: 100px; border: 1px solid #ccc;" /></div>` : '<div></div>'}
            </div>
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  };

  const downloadPDFViaAPI = async (html: string, suggestedName: string) => {
    const name = (suggestedName && suggestedName.trim()) || 'Invoice';
    const response = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, fileName: name })
    });
    if (!response.ok) {
      throw new Error('PDF API returned non-OK');
    }
    
    // The API now returns HTML with print instructions
    const htmlContent = await response.text();
    
    // Open the HTML in a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Auto-trigger print dialog after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      // Fallback: create a blob and download as HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
      a.download = `${name}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    }
  };

  const downloadInvoiceFromPreview = async () => {
    try {
      console.log('Generating PDF from Live Preview via API...');
      
      // Check if there's any meaningful content
      if (!invoiceData.billerName && !invoiceData.clientName && !invoiceData.invoiceNumber) {
        alert('გთხოვთ შეავსოთ მინიმუმ გამყიდველის სახელი, მყიდველის სახელი და ინვოისის ნომერი PDF-ის ჩამოტვირთვისთვის.');
        return;
      }
      
      const invoiceHTML = generateLivePreview();
      console.log('Generated HTML length:', invoiceHTML.length);
      await downloadPDFViaAPI(invoiceHTML, `Invoice-${invoiceData.invoiceNumber || 'Document'}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('შეცდომა PDF-ის გენერაციისას. გთხოვთ სცადოთ კვლავ.');
    }
  };

  const downloadInvoice = async () => {
    if (!generatedInvoice) {
      alert('ინვოისი არ არის გენერირებული. გთხოვთ ჯერ გენერირება დააჭიროთ.');
      return;
    }
    try {
      console.log('Generating PDF from generated invoice via API...');
      await downloadPDFViaAPI(generatedInvoice, `Invoice-${invoiceData.invoiceNumber || 'Document'}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('შეცდომა PDF-ის გენერაციისას. გთხოვთ სცადოთ კვლავ.');
    }
  };

  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatedInvoice);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (generatedInvoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <DocsHeader backHref="/docs" backLabel="უკან" title="ინვოისის გენერატორი" showBeta />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setGeneratedInvoice('')}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>უკან</span>
            </button>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadInvoice}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">ჩამოტვირთვა</span>
                <span className="sm:hidden">Download</span>
              </button>
              <button
                onClick={printInvoice}
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
              srcDoc={generatedInvoice}
              className="w-full h-screen border-0"
              title="გენერირებული ინვოისი"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DocsHeader backHref="/docs" backLabel="უკან" title="ინვოისის გენერატორი" showBeta />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Template Style Switcher */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-700">შაბლონი:</span>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTemplateStyle('modern')}
                  className={`px-3 py-2 text-sm transition-colors ${
                    templateStyle === 'modern'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  თანამედროვე
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateStyle('classic')}
                  className={`px-3 py-2 text-sm transition-colors ${
                    templateStyle === 'classic'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  კლასიკური
                </button>
              </div>
            </div>
            
            {/* Live Preview Button */}
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showLivePreview 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-sm sm:text-base">ცოცხალი გადახედვა</span>
              </span>
            </button>
          </div>
        </div>

        <div className={`mx-auto ${showLivePreview ? 'max-w-7xl' : 'max-w-6xl'}`}>
          <div className={`${showLivePreview ? 'grid grid-cols-1 lg:grid-cols-5 gap-8 items-start' : ''}`}>
            
            {/* Sticky Stepper - Outside form block */}
            <div className={`${showLivePreview ? 'lg:col-span-5' : ''} sticky top-16 z-30 bg-white/80 backdrop-blur border-b border-slate-200/60 mb-6`}>
              <div className="overflow-x-auto">
                <div className="flex items-center min-w-max">
                  {steps.map((s, idx) => (
                    <div key={s.key} className="flex items-center">
                      {idx !== 0 && <div className={`h-0.5 w-10 sm:w-14 ${idx <= currentStep ? 'bg-blue-600' : 'bg-slate-200'}`} />}
                      <button
                        type="button"
                        onClick={() => setCurrentStep(idx)}
                        className={`ml-2 flex items-center gap-2 whitespace-nowrap select-none ${idx === currentStep ? 'text-slate-900' : 'text-slate-500'}`}
                      >
                        <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${idx <= currentStep ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{idx + 1}</span>
                        <span className="text-sm">{s.label}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`bg-white rounded-xl shadow-lg p-8 ${showLivePreview ? 'lg:col-span-3 max-h-[800px] overflow-y-auto' : ''}`}> 
              <form onSubmit={(e) => { e.preventDefault(); generateInvoice(); }} className="space-y-8">
              
              {/* Step 0: Invoice Header */}
              <div className={currentStep === 0 ? '' : 'hidden'}>
              {/* Invoice Header */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ინვოისის ნომერი *
                  </label>
                  <input
                    type="text"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="INV-001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    თარიღი
                  </label>
                  <input
                    type="date"
                    value={invoiceData.invoiceDate}
                    onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Company Logo Upload */}
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">კომპანიის ლოგო</h3>
                <div className="flex items-center space-x-4">
                  {invoiceData.billerLogo ? (
                    <div className="relative">
                      <img 
                        src={invoiceData.billerLogo} 
                        alt="Company Logo" 
                        className="w-20 h-20 object-cover rounded-lg border border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>ლოგოს ატვირთვა</span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF (მაქს. 5MB)</p>
                  </div>
                </div>
              </div>
              </div>

              {/* Step 1: Biller Information */}
              <div className={currentStep === 1 ? '' : 'hidden'}>
              {/* Biller Information */}
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">გამყიდველის ინფორმაცია</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      კომპანიის სახელი *
                    </label>
                    <input
                      type="text"
                      value={invoiceData.billerName}
                      onChange={(e) => handleInputChange('billerName', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="კომპანიის სახელი"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      კომპანიის საიდენტიფიკაციო კოდი
                    </label>
                    <input
                      type="text"
                      value={invoiceData.billerCompanyId}
                      onChange={(e) => handleInputChange('billerCompanyId', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      ელ-ფოსტა
                    </label>
                    <input
                      type="email"
                      value={invoiceData.billerEmail}
                      onChange={(e) => handleInputChange('billerEmail', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="info@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      ტელეფონი
                    </label>
                    <input
                      type="tel"
                      value={invoiceData.billerPhone}
                      onChange={(e) => handleInputChange('billerPhone', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="+995 555 123 456"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      მისამართი
                    </label>
                    <input
                      type="text"
                      value={invoiceData.billerAddress}
                      onChange={(e) => handleInputChange('billerAddress', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="თბილისი, საქართველო"
                    />
                  </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Client Information */}
              <div className={currentStep === 2 ? '' : 'hidden'}>
              {/* Client Information */}
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">მყიდველის ინფორმაცია</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      კომპანიის სახელი *
                    </label>
                    <input
                      type="text"
                      value={invoiceData.clientName}
                      onChange={(e) => handleInputChange('clientName', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="კომპანიის სახელი"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      კომპანიის საიდენტიფიკაციო კოდი
                    </label>
                    <input
                      type="text"
                      value={invoiceData.clientCompanyId}
                      onChange={(e) => handleInputChange('clientCompanyId', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      ელ-ფოსტა
                    </label>
                    <input
                      type="email"
                      value={invoiceData.clientEmail}
                      onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="client@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      ტელეფონი
                    </label>
                    <input
                      type="tel"
                      value={invoiceData.clientPhone}
                      onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="+995 555 123 456"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      მისამართი
                    </label>
                    <input
                      type="text"
                      value={invoiceData.clientAddress}
                      onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="მისამართი"
                    />
                  </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Items and Tax */}
              <div className={currentStep === 3 ? '' : 'hidden'}>
              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-slate-800">ნივთები</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>ნივთის დამატება</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-4 bg-slate-50 rounded-lg">
                      <div className="col-span-3">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          აღწერა
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="პროდუქტის დასახელება"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          ერთეული
                        </label>
                        <select
                          value={item.unit || 'ცალი'}
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          {['ცალი','კგ','გრ','ტ','ლ','მლ','მ','სმ','მმ','მ²','მ³','წუთი','საათი','დღე','თვე','წელი','სერვისი','პაკეტი','ჯამი','კვ','კვტს'].map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          რაოდენობა
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={item.quantity ? String(item.quantity) : ''}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '');
                            const next = raw === '' ? 0 : parseInt(raw, 10);
                            updateItem(item.id, 'quantity', next);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          ფასი (₾)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price || ''}
                          onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          ჯამი (₾)
                        </label>
                        <input
                          type="number"
                          value={item.total.toFixed(2)}
                          readOnly
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100"
                        />
                      </div>
                        {items.length > 1 && (
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="w-full p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax Settings */}
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">გადასახადის პარამეტრები</h3>
                <div className="bg-slate-50 p-6 rounded-lg">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    გადასახადი (%)
                  </label>
                  <div className="space-y-3">
                    {/* VAT Options - Radio Buttons */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="vat-none"
                          name="vat-option"
                          checked={!useGeorgianVAT && !vatIncluded}
                          onChange={() => handleVatOptionChange('none')}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <label htmlFor="vat-none" className="text-sm font-medium text-slate-700">
                          გადასახადი არ არის
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="vat-add"
                          name="vat-option"
                          checked={useGeorgianVAT && !vatIncluded}
                          onChange={() => handleVatOptionChange('add')}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <label htmlFor="vat-add" className="text-sm font-medium text-slate-700">
                          დაარიცხე დ.ღ.გ (18%)
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="vat-included"
                          name="vat-option"
                          checked={vatIncluded && !useGeorgianVAT}
                          onChange={() => handleVatOptionChange('included')}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <label htmlFor="vat-included" className="text-sm font-medium text-slate-700">
                          ფასში შეიყვანე დღგ
                        </label>
                      </div>
                    </div>
                    
                    {/* Manual Tax Rate Input */}
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={invoiceData.taxRate}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        handleInputChange('taxRate', value);
                        if (value === 18) {
                          handleVatOptionChange('add');
                        } else if (value === 0) {
                          handleVatOptionChange('none');
                        }
                      }}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                      disabled={useGeorgianVAT || vatIncluded}
                    />
                  </div>
                </div>
              </div>
              </div>

              {/* Step 4: Bank Account Information */}
              <div className={currentStep === 4 ? '' : 'hidden'}>
              {/* Bank Account Information */}
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">ბანკის ანგარიშის ინფორმაცია</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      ბანკის სახელი
                    </label>
                    <select
                      value={invoiceData.bankName}
                      onChange={(e) => {
                        handleInputChange('bankName', e.target.value);
                        if (e.target.value !== 'სხვა') {
                          setCustomBankName('');
                        }
                      }}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">აირჩიეთ ბანკი</option>
                      {georgianBanks.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                    {invoiceData.bankName === 'სხვა' && (
                      <input
                        type="text"
                        value={customBankName}
                        onChange={(e) => setCustomBankName(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mt-2"
                        placeholder="შეიყვანეთ ბანკის სახელი"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      ანგარიშის ნომერი
                    </label>
                    <input
                      type="text"
                      value={invoiceData.bankAccount}
                      onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="GE00TB0000000000000000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      მიმღების სახელი
                    </label>
                    <input
                      type="text"
                      value={invoiceData.bankRecipientName}
                      onChange={(e) => handleInputChange('bankRecipientName', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="კომპანიის სახელი ან ფიზიკური პირის სახელი"
                    />
                  </div>
                  </div>
                </div>
              </div>

              {/* Step 5: Signature and Notes */}
              <div className={currentStep === 5 ? '' : 'hidden'}>
              {/* Signature and Stamp */}
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">ხელმოწერა და ბეჭედი</h3>
              <div className="grid md:grid-cols-2 gap-6">
                  {/* Signature */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                      ხელმოწერა
                  </label>
                    <div className="flex items-center space-x-4">
                      {invoiceData.signature ? (
                        <div className="relative">
                          <img 
                            src={invoiceData.signature} 
                            alt="Signature" 
                            className="w-32 h-16 object-contain border border-slate-300 rounded-lg bg-white"
                          />
                          <button
                            type="button"
                            onClick={removeSignature}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                </div>
                      ) : (
                        <div className="w-32 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowSignatureModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>ხელმოწერის დამატება</span>
                      </button>
                    </div>
                  </div>

                  {/* Company Stamp */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      კომპანიის ბეჭედი
                    </label>
                    <div className="flex items-center space-x-4">
                      {invoiceData.companyStamp ? (
                        <div className="relative">
                          <img 
                            src={invoiceData.companyStamp} 
                            alt="Company Stamp" 
                            className="w-32 h-32 object-contain border border-slate-300 rounded-lg bg-white"
                          />
                          <button
                            type="button"
                            onClick={removeStamp}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 8h6m-6 4h6m-6 4h6" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleStampUpload}
                          className="hidden"
                          id="stamp-upload"
                        />
                        <label
                          htmlFor="stamp-upload"
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer inline-flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span>ბეჭდის ატვირთვა</span>
                        </label>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Notes inside step 5 */}
                <div className="mt-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    შენიშვნები
                  </label>
                  <textarea
                    value={invoiceData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="დამატებითი ინფორმაცია..."
                  />
                </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-6">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={currentStep === 0}
                  className={`px-4 py-2 rounded-lg border ${currentStep === 0 ? 'opacity-50 cursor-not-allowed border-slate-200 text-slate-400' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                >
                  უკან
                </button>
                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canProceedFromStep(currentStep)}
                    className={`px-6 py-2 rounded-lg ${canProceedFromStep(currentStep) ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
                  >
                    შემდეგი
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={generateInvoice}
                  disabled={isGenerating}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>მომზადება...</span>
                    </>
                  ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>ინვოისის გენერირება</span>
                    </>
                  )}
                </button>
                )}
              </div>

              </form>
            </div>

          {showLivePreview && (
            <div className={`bg-white rounded-xl shadow-lg p-8 max-h-[800px] flex flex-col lg:sticky lg:top-4 ${showLivePreview ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-slate-800">ცოცხალი გადახედვა</h3>
                <div className="flex items-center space-x-1">
                  <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
                    <button type="button" onClick={() => setPreviewZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))} className="px-1.5 py-0.5 text-slate-700 hover:bg-slate-100" aria-label="Zoom out">−</button>
                    <div className="px-2 py-0.5 text-xs tabular-nums text-slate-700">{Math.round(previewZoom * 100)}%</div>
                    <button type="button" onClick={() => setPreviewZoom(z => Math.min(2, Math.round((z + 0.1) * 10) / 10))} className="px-1.5 py-0.5 text-slate-700 hover:bg-slate-100" aria-label="Zoom in">+</button>
                  </div>
                  <button
                    onClick={downloadInvoiceFromPreview}
                    className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>ჩამოტვირთვა</span>
                  </button>
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-auto flex-1 bg-slate-50">
                <div className="mx-auto my-4" style={{ width: `${Math.round(a4WidthPx * previewZoom)}px`, height: `${Math.round(a4HeightPx * previewZoom)}px` }}>
                  <iframe
                    srcDoc={generateLivePreview()}
                    title="ინვოისის ცოცხალი გადახედვა"
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

      {/* Signature Modal */}
      {showSignatureModal && (
        <SignatureCapture
          onSave={handleSignatureCapture}
          onCancel={() => setShowSignatureModal(false)}
        />
      )}
    </div>
  );
}

