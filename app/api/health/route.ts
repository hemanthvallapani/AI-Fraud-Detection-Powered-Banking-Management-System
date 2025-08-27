export async function GET() {
  try {
    // Check if Appwrite environment variables are available
    const hasAppwriteConfig = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && 
                             process.env.NEXT_PUBLIC_APPWRITE_PROJECT && 
                             process.env.NEXT_APPWRITE_KEY;
    
    console.log('Health Check - Appwrite Config:', {
      endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ? '✅ Set' : '❌ Missing',
      project: process.env.NEXT_PUBLIC_APPWRITE_PROJECT ? '✅ Set' : '❌ Missing',
      key: process.env.NEXT_APPWRITE_KEY ? '✅ Set' : '❌ Missing'
    });
    
    if (!hasAppwriteConfig) {
      console.log('Health Check - Missing Appwrite config, using demo mode');
      return Response.json({ 
        status: 'offline', 
        message: 'Missing Appwrite configuration - using demo mode',
        mode: 'demo'
      }, { status: 503 });
    }

    // Test actual Appwrite connection
    try {
      const { createAdminClient } = await import('@/lib/appwrite');
      const { database } = await createAdminClient();
      
      // Try to list documents to test connection (safer than account.get)
      await database.listDocuments(
        process.env.APPWRITE_DATABASE_ID || '68a5a16a000d409ed054',
        process.env.APPWRITE_USER_COLLECTION_ID || '68a5a1c3002b48a855c4',
        []
      );
      
      return Response.json({ 
        status: 'online', 
        message: 'Appwrite connection successful',
        mode: 'production'
      });
    } catch (appwriteError) {
      console.log('Appwrite connection failed:', appwriteError);
      return Response.json({ 
        status: 'offline', 
        message: 'Appwrite connection failed - using demo mode',
        mode: 'demo'
      }, { status: 503 });
    }
  } catch (error) {
    return Response.json({ 
      status: 'offline', 
      message: 'Health check failed - using demo mode',
      mode: 'demo'
    }, { status: 500 });
  }
}
