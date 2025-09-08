import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { html, fileName } = await req.json();
    if (!html || typeof html !== 'string') {
      return new Response('Invalid html', { status: 400 });
    }

    const puppeteer = await import('puppeteer');

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new'
    } as any);
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });


    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', right: '16mm', bottom: '16mm', left: '16mm' },
      preferCSSPageSize: true
    });

    await browser.close();

    // Return PDF buffer; client controls filename via anchor download attribute
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf'
      }
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response('Failed to generate PDF', { status: 500 });
  }
}


