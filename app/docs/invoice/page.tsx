'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceData {
  billerName: string;
  billerAddress: string;
  billerEmail: string;
  billerPhone: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxRate: number;
  notes: string;
}

export default function InvoiceGeneratorPage() {
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    billerName: '',
    billerAddress: '',
    billerEmail: '',
    billerPhone: '',
    clientName: '',
    clientAddress: '',
    clientEmail: '',
    clientPhone: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    taxRate: 0,
    notes: ''
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, price: 0, total: 0 }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<string>('');
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [previewZoom, setPreviewZoom] = useState(0.5);

  // Approximate A4 size at 96 DPI
  const a4WidthPx = 794; // 210mm @ ~96dpi
  const a4HeightPx = 1123; // 297mm @ ~96dpi

  const handleInputChange = (field: keyof InvoiceData, value: string | number) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
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
    return createInvoiceHTML(invoiceData, items);
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

    setIsGenerating(true);
    
    setTimeout(() => {
      const invoiceHTML = createInvoiceHTML(invoiceData, validItems);
      setGeneratedInvoice(invoiceHTML);
      setIsGenerating(false);
    }, 2000);
  };

  const createInvoiceHTML = (data: InvoiceData, items: InvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * (data.taxRate / 100);
    const total = subtotal + tax;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ${data.invoiceNumber}</title>
        <style>
          :root { --text:#0f172a; --muted:#475569; --border:#e2e8f0; --bg:#ffffff; --subtle:#f8fafc; --accent:#16a34a; }
          * { box-sizing: border-box; }
          body { font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin:0; padding:24px; background:var(--bg); color:var(--text); line-height:1.6; }
          .invoice-page { max-width: 900px; margin:0 auto; background:#fff; }
          .invoice-header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:16px; border-bottom:1px solid var(--border); }
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
          .totals { display:grid; grid-template-columns: 1fr 280px; gap:24px; align-items:start; margin-top:18px; }
          .totals .summary { background:var(--subtle); border:1px solid var(--border); border-radius:10px; padding:16px; }
          .row { display:flex; justify-content:space-between; padding:6px 0; }
          .row.total { border-top:1px dashed var(--border); margin-top:8px; padding-top:10px; font-weight:700; font-size:18px; }
          .notes { background:var(--subtle); border:1px solid var(--border); border-radius:10px; padding:16px; margin-top:18px; }
          .badge { display:inline-block; font-size:12px; padding:4px 8px; border-radius:9999px; border:1px solid var(--border); background:#fff; color:var(--muted); }
          @media print { @page { size:A4; margin: 12mm; } body { padding:0; } }
        </style>
      </head>
      <body>
        <div class="invoice-page">
          <div class="invoice-header">
            <div>
              <div class="brand">${data.billerName || 'Company'}</div>
              <div class="badge">Invoice</div>
            </div>
            <div class="meta">
              <div class="number">#${data.invoiceNumber}</div>
              <div>${new Date(data.invoiceDate).toLocaleDateString('ka-GE')}</div>
            </div>
          </div>

          <div class="parties">
            <div class="card">
              <h3>From</h3>
              <p><strong>${data.billerName || ''}</strong></p>
              ${data.billerAddress ? `<p>${data.billerAddress}</p>` : ''}
              ${data.billerEmail ? `<p>${data.billerEmail}</p>` : ''}
              ${data.billerPhone ? `<p>${data.billerPhone}</p>` : ''}
            </div>
            <div class="card">
              <h3>To</h3>
              <p><strong>${data.clientName || ''}</strong></p>
              ${data.clientAddress ? `<p>${data.clientAddress}</p>` : ''}
              ${data.clientEmail ? `<p>${data.clientEmail}</p>` : ''}
              ${data.clientPhone ? `<p>${data.clientPhone}</p>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="right">Qty</th>
                <th class="right">Price</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.description}</td>
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
              <div class="row"><span>Subtotal</span><span>₾${subtotal.toFixed(2)}</span></div>
              ${data.taxRate > 0 ? `<div class="row"><span>Tax (${data.taxRate}%)</span><span>₾${tax.toFixed(2)}</span></div>` : ''}
              <div class="row total"><span>Total</span><span>₾${total.toFixed(2)}</span></div>
            </div>
          </div>

          ${data.notes ? `
          <div class="notes">
            <div class="badge">Notes</div>
            <p>${data.notes}</p>
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  };

  const downloadInvoice = () => {
    const blob = new Blob([generatedInvoice], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoiceData.invoiceNumber || 'Document'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              title="Generated Invoice"
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
            <h1 className="text-3xl font-bold text-slate-800">ინვოისის გენერატორი</h1>
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showLivePreview 
                  ? 'bg-emerald-600 text-white' 
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

        <div className={`mx-auto ${showLivePreview ? 'max-w-7xl' : 'max-w-6xl'}`}>
          <div className={`${showLivePreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-start' : ''}`}>
            <div className={`bg-white rounded-xl shadow-lg p-8 ${showLivePreview ? 'max-h-[800px] overflow-y-auto' : ''}`}>
              <form onSubmit={(e) => { e.preventDefault(); generateInvoice(); }} className="space-y-8">
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

              {/* Biller Information */}
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">გადამხდელი ინფორმაცია</h3>
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
                      placeholder="თქვენი კომპანია"
                      required
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
                </div>
              </div>

              {/* Client Information */}
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">მომხმარებლის ინფორმაცია</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      კლიენტის სახელი *
                    </label>
                    <input
                      type="text"
                      value={invoiceData.clientName}
                      onChange={(e) => handleInputChange('clientName', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="კლიენტის სახელი"
                      required
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
                      მისამართი
                    </label>
                    <input
                      type="text"
                      value={invoiceData.clientAddress}
                      onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="კლიენტის მისამართი"
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
                </div>
              </div>

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
                    <div key={item.id} className="grid grid-cols-12 gap-4 items-end p-4 bg-slate-50 rounded-lg">
                      <div className="col-span-5">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          აღწერა
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="ნივთის აღწერა"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          რაოდენობა
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      <div className="col-span-1">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="w-full p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax and Notes */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    გადასახადი (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={invoiceData.taxRate}
                    onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
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

              {/* Generate Button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>გენერირება...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>ინვოისის გენერირება</span>
                    </>
                  )}
                </button>
              </div>
              </form>
            </div>

          {showLivePreview && (
            <div className="bg-white rounded-xl shadow-lg p-8 max-h-[800px] flex flex-col lg:sticky lg:top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-800">Live Preview</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
                    <button type="button" onClick={() => setPreviewZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))} className="px-2 py-1 text-slate-700 hover:bg-slate-100" aria-label="Zoom out">−</button>
                    <div className="px-3 py-1 text-sm tabular-nums text-slate-700">{Math.round(previewZoom * 100)}%</div>
                    <button type="button" onClick={() => setPreviewZoom(z => Math.min(2, Math.round((z + 0.1) * 10) / 10))} className="px-2 py-1 text-slate-700 hover:bg-slate-100" aria-label="Zoom in">+</button>
                  </div>
                  <button
                    onClick={() => {
                      const previewHTML = generateLivePreview();
                      const blob = new Blob([previewHTML], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Invoice-Preview-${invoiceData.invoiceNumber || 'Document'}.html`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center space-x-2 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download</span>
                  </button>
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-auto flex-1 bg-slate-50">
                <div className="mx-auto my-4" style={{ width: `${Math.round(a4WidthPx * previewZoom)}px`, height: `${Math.round(a4HeightPx * previewZoom)}px` }}>
                  <iframe
                    srcDoc={generateLivePreview()}
                    title="Live Invoice Preview"
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
