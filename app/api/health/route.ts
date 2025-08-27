export async function GET() {
  try {
    // Check if Appwrite environment variables are available
    const hasAppwriteConfig = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && 
                             process.env.NEXT_PUBLIC_APPWRITE_PROJECT && 
                             process.env.NEXT_APPWRITE_KEY;
    
    if (!hasAppwriteConfig) {
      return Response.json({ 
        status: 'offline', 
        message: 'Missing Appwrite configuration',
        mode: 'demo'
      }, { status: 503 });
    }

    return Response.json({ 
      status: 'online', 
      message: 'Appwrite configuration found',
      mode: 'production'
    });
  } catch (error) {
    return Response.json({ 
      status: 'offline', 
      message: 'Health check failed',
      mode: 'demo'
    }, { status: 500 });
  }
}
