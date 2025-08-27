import { getLoggedInUser } from '@/lib/actions/user.actions';
import  HeaderBox  from '@/components/HeaderBox';
import  RightSidebar  from '@/components/RightSidebar';
import FraudDetectionPanel from '@/components/FraudDetectionPanel';
import { analyzeTransactionFraud } from '@/lib/actions/fraud.actions';

const FraudDetection = async () => {
  const loggedIn = await getLoggedInUser();

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