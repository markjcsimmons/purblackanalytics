import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'Missing URL' },
        { status: 400 }
      );
    }

    // Extract document ID from various Google Docs URL formats
    const docIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!docIdMatch) {
      return NextResponse.json(
        { error: 'Invalid Google Docs URL format' },
        { status: 400 }
      );
    }

    const docId = docIdMatch[1];

    // Try to fetch the document as plain text export
    // Google Docs allows exporting public documents as plain text
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PürblackAnalytics/1.0)',
      },
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 403) {
        return NextResponse.json(
          { 
            error: 'Document is not publicly accessible. Please either:\n1. Make the document public (Anyone with the link can view)\n2. Or copy and paste the content manually',
            needsManualPaste: true 
          },
          { status: 403 }
        );
      }
      throw new Error('Failed to fetch document');
    }

    const textContent = await response.text();

    if (!textContent || textContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'Document appears to be empty' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      content: textContent 
    });

  } catch (error: any) {
    console.error('Error fetching Google Doc:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch document' },
      { status: 500 }
    );
  }
}



