import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messageId, chatflowId, chatId, rating, content } = body;

    if (!messageId || !chatflowId || !chatId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, chatflowId, chatId, rating' },
        { status: 400 }
      );
    }

    if (!['THUMBS_UP', 'THUMBS_DOWN'].includes(rating)) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be THUMBS_UP or THUMBS_DOWN' },
        { status: 400 }
      );
    }

    // Get Flowise configuration
    const flowiseHost = process.env.ALUDAAI_FLOWISE_HOST || process.env.FLOWISE_HOST;
    const apiKey = process.env.ALUDAAI_FLOWISE_API_KEY || process.env.FLOWISE_API_KEY;

    if (!flowiseHost) {
      return NextResponse.json(
        { error: 'Flowise host not configured' },
        { status: 500 }
      );
    }

    // Normalize host URL
    const normalizedHost = flowiseHost.replace(/\/+$/, '');
    const feedbackUrl = `${normalizedHost}/api/v1/feedback/${chatflowId}`;

    // Prepare feedback payload
    const feedbackPayload = {
      chatflowid: chatflowId,
      chatId: chatId,
      messageId: messageId,
      rating: rating,
      content: content || '',
    };

    // Send feedback to Flowise
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['x-api-key'] = apiKey;
    }

    const response = await fetch(feedbackUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(feedbackPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Flowise feedback error:', response.status, errorText);
      
      return NextResponse.json(
        { error: 'Failed to submit feedback to Flowise' },
        { status: response.status }
      );
    }

    const result = await response.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: result,
    });

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
