import BankCard from '@/components/BankCard';
import HeaderBox from '@/components/HeaderBox'
import { getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import React from 'react'

const MyBanks = async () => {
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