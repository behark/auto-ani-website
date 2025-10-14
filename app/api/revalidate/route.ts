import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verify secret token
    const secret = request.nextUrl.searchParams.get('secret');
    
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { message: 'Invalid token' }, 
        { status: 401 }
      );
    }

    // Parse webhook payload
    const body = await request.json();
    console.log('Revalidation triggered:', body);

    // Revalidate relevant paths
    revalidatePath('/');
    revalidatePath('/vehicles');
    revalidatePath('/inventory');
    
    // If you're using tags, revalidate them
    revalidateTag('vehicles');

    return NextResponse.json({ 
      revalidated: true, 
      now: Date.now(),
      message: 'Successfully revalidated'
    });

  } catch (err) {
    console.error('Revalidation error:', err);
    return NextResponse.json(
      { message: 'Error revalidating', error: String(err) }, 
      { status: 500 }
    );
  }
}

// Handle GET requests to test the endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Revalidation endpoint active. Use POST with secret token.' 
  });
}
