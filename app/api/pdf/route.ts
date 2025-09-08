import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { html } = await req.json();
    if (!html || typeof html !== 'string') {
      return new Response('Invalid html', { status: 400 });
    }

    // Use a serverless-friendly PDF generation service
    // For now, let's return the HTML with instructions to use browser print
    const responseHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CV Preview</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .instructions {
              background: #f0f8ff;
              border: 1px solid #4a90e2;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
              text-align: center;
            }
            .instructions h2 { color: #4a90e2; margin-top: 0; }
            .instructions p { margin: 10px 0; }
            .print-button {
              background: #4a90e2;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
              margin: 10px;
            }
            .print-button:hover { background: #357abd; }
            @media print {
              .instructions, .print-button { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="instructions">
            <h2>PDF ჩამოტვირთვის ინსტრუქცია</h2>
            <p>PDF-ის ჩამოსატვირთად, გამოიყენეთ ბრაუზერის Print ფუნქცია:</p>
            <button class="print-button" onclick="window.print()">Print / PDF</button>
            <p>1. დააჭირეთ "Print / PDF" ღილაკს ან Ctrl+P (Windows) / Cmd+P (Mac)</p>
            <p>2. აირჩიეთ "Save as PDF" ან "Microsoft Print to PDF"</p>
            <p>3. დააყენეთ Margins: Default ან Minimum</p>
            <p>4. დააჭირეთ "Save"</p>
          </div>
          ${html}
        </body>
      </html>
    `;
    
    return new Response(responseHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html'
      }
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response('Failed to generate PDF', { status: 500 });
  }
}


