import BankCard from '@/components/BankCard';
import HeaderBox from '@/components/HeaderBox'
import { getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser, getDemoUser } from '@/lib/actions/user.actions';
import React from 'react'

const MyBanks = async () => {
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
        console.log('My Banks: Demo mode activated - using demo user:', loggedIn);
      } else {
        // Appwrite is configured but user not logged in - redirect to sign-in
        return (
          <div className="flex-center size-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
              <a href="/sign-in" className="text-blue-600 hover:underline">Go to Sign In</a>
            </div>
          </div>
        );
      }
    } catch (error) {
      // If health check fails, assume demo mode
      loggedIn = await getDemoUser();
      isDemoMode = true;
      console.log('My Banks: Demo mode activated (fallback) - using demo user:', loggedIn);
    }
  }

  const accounts = await getAccounts({ 
    userId: loggedIn.$id 
  })

  // Check if accounts exist
  if (!accounts || !accounts.data) {
    return (
      <section className='flex'>
        <div className="my-banks">
          <HeaderBox 
            title="My Bank Accounts"
            subtext="Effortlessly manage your banking activites."
          />
          <div className="space-y-4">
            <h2 className="header-2">Your cards</h2>
            <div className="text-center py-8 text-gray-500">
              <p>No bank accounts found. Please link a bank account first.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const accountsData = accounts.data;

  return (
    <section className='flex'>
      <div className="my-banks">
        <HeaderBox 
          title="My Bank Accounts"
          subtext="Effortlessly manage your banking activites."
        />

        <div className="space-y-4">
          <h2 className="header-2">
            Your cards
          </h2>
          <div className="flex flex-wrap gap-6">
            {accountsData.map((a: Account) => (
              <BankCard 
                key={a.id}
                account={a}
                userName={loggedIn.firstName || 'User'}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MyBanks