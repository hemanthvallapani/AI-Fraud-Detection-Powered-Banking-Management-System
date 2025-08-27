import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { getLoggedInUser, getDemoUser } from "@/lib/actions/user.actions";
import StatusIndicator from "@/components/StatusIndicator";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let loggedIn = await getLoggedInUser();
  let isDemoMode = false;

  // If no user logged in, check if we should show demo mode
  if (!loggedIn) {
    // Check if we're in demo mode (Appwrite not configured)
    try {
      const healthResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/health`);
      const healthData = await healthResponse.json();
      
      if (healthData.mode === 'demo') {
        loggedIn = await getDemoUser();
        isDemoMode = true;
        console.log('Root layout: Demo mode activated - using demo user:', loggedIn);
      } else {
        // Appwrite is configured but user not logged in - redirect to sign-in
        redirect('/sign-in');
      }
    } catch (error) {
      // If health check fails, assume demo mode
      loggedIn = await getDemoUser();
      isDemoMode = true;
      console.log('Root layout: Demo mode activated (fallback) - using demo user:', loggedIn);
    }
  }

  return (
    <main className="flex h-screen w-full font-inter">
      <Sidebar user={loggedIn} isDemoMode={isDemoMode} />

      <div className="flex size-full flex-col">
        <div className="root-layout">
          <Image src="/icons/logo.svg" width={30} height={30} alt="logo" />
          <div>
            <MobileNav user={loggedIn} isDemoMode={isDemoMode} />
          </div>
        </div>
        {children}
        <StatusIndicator />
      </div>
    </main>
  );
}
