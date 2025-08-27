import { getLoggedInUser, getDemoUser } from '@/lib/actions/user.actions';
import  HeaderBox  from '@/components/HeaderBox';
import  RightSidebar  from '@/components/RightSidebar';
import FraudDetectionPanel from '@/components/FraudDetectionPanel';
import { analyzeTransactionFraud } from '@/lib/actions/fraud.actions';

const FraudDetection = async () => {
  let loggedIn = await getLoggedInUser();
  let isDemoMode = false;

  // If no user logged in, check if we should show demo mode
  if (!loggedIn) {
    try {
      const healthResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/health`);
      const healthData = await healthResponse.json();
      
      if (healthData.mode === 'demo') {
        loggedIn = await getDemoUser();
        isDemoMode = true;
        console.log('Fraud Detection: Demo mode activated - using demo user:', loggedIn);
      }
    } catch (error) {
      // If health check fails, assume demo mode
      loggedIn = await getDemoUser();
      isDemoMode = true;
      console.log('Fraud Detection: Demo mode activated (fallback) - using demo user:', loggedIn);
    }
  }

  return (
    <section className="flex">
      <div className="my-banks">
        <HeaderBox 
          title="AI Fraud Detection"
          subtext="Monitor and analyze transactions for potential fraud"
        />

        <section className="size-full pt-5">
          <FraudDetectionPanel />
        </section>
      </div>

      <RightSidebar 
        user={loggedIn}
        transactions={[]}
        banks={[]}
      />
    </section>
  );
}

export default FraudDetection;