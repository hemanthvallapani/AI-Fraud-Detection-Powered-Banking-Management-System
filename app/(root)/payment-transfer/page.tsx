import HeaderBox from '@/components/HeaderBox'
import PaymentTransferForm from '@/components/PaymentTransferForm'
import { getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import FraudDetectionPanel from '@/components/FraudDetectionPanel';
import { analyzeTransactionFraud } from '@/lib/actions/fraud.actions';
import React from 'react'

const Transfer = async () => {
  const loggedIn = await getLoggedInUser();
  
  // Check if user is logged in
  if (!loggedIn) {
    return (
      <div className="flex-center size-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
          <a href="/sign-in" className="text-blue-600 hover:underline">Go to Sign In</a>
        </div>
      </div>
    );
  }

  const accounts = await getAccounts({ 
    userId: loggedIn.$id 
  })

  if(!accounts) return;
  
  const accountsData = accounts?.data || [];

  // Check if user has any bank accounts
  if (!accountsData.length) {
    return (
      <section className="payment-transfer">
        <HeaderBox 
          title="Payment Transfer"
          subtext="Please provide any specific details or notes related to the payment transfer"
        />
        <section className="size-full pt-5">
          <div className="text-center py-8 text-gray-500">
            <p>No bank accounts found. Please link a bank account first.</p>
            <a href="/my-banks" className="text-blue-600 hover:underline mt-2 inline-block">Go to My Banks</a>
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className="payment-transfer">
      <HeaderBox 
        title="Payment Transfer"
        subtext="Please provide any specific details or notes related to the payment transfer"
      />

      <section className="size-full pt-5">
        <PaymentTransferForm accounts={accountsData} />
        
        {/* Add Fraud Detection Panel */}
        <div className="mt-8">
          <FraudDetectionPanel />
        </div>
      </section>
    </section>
  )
}

export default Transfer