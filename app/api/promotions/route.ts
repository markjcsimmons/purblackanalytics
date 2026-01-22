import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekId, name, offer, startDate, endDate, grossSales, netSales } = body;

    // Validation
    if (!name || !offer || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, offer, startDate, endDate' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (end < start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Validate sales numbers
    const gross = grossSales !== null && grossSales !== undefined ? parseFloat(String(grossSales)) : null;
    const net = netSales !== null && netSales !== undefined ? parseFloat(String(netSales)) : null;

    if (gross !== null && (isNaN(gross) || gross < 0)) {
      return NextResponse.json(
        { error: 'Gross sales must be a valid positive number' },
        { status: 400 }
      );
    }

    if (net !== null && (isNaN(net) || net < 0)) {
      return NextResponse.json(
        { error: 'Net sales must be a valid positive number' },
        { status: 400 }
      );
    }

    if (gross !== null && net !== null && net > gross) {
      return NextResponse.json(
        { error: 'Net sales cannot be greater than gross sales' },
        { status: 400 }
      );
    }

    // Dynamically import database functions
    const { savePromotion } = await import('@/lib/db');

    // Combine name and offer into offer_type (as expected by the database)
    const offerType = `${name} - ${offer}`;

    const result = savePromotion({
      weekId: weekId || undefined,
      startDate,
      endDate,
      offerType,
      netSales: net,
      grossSales: gross,
    });

    return NextResponse.json({
      success: true,
      id: result.id,
      message: 'Promotion saved successfully',
    });
  } catch (error: any) {
    console.error('Save promotion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save promotion' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Dynamically import database functions
    const { getAllPromotions } = await import('@/lib/db');
    
    const promotions = getAllPromotions();
    return NextResponse.json({
      success: true,
      promotions,
    });
  } catch (error: any) {
    console.error('Get promotions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve promotions' },
      { status: 500 }
    );
  }
}
