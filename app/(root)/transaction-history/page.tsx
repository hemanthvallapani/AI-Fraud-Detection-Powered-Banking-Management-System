import HeaderBox from '@/components/HeaderBox'
import { Pagination } from '@/components/Pagination';
import TransactionsTable from '@/components/TransactionsTable';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser, getDemoUser } from '@/lib/actions/user.actions';
import { formatAmount } from '@/lib/utils';
import React from 'react'

const TransactionHistory = async ({ searchParams: { id, page }}:SearchParamProps) => {
  const currentPage = Number(page as string) || 1;
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
        console.log('Transaction History: Demo mode activated - using demo user:', loggedIn);
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
      console.log('Transaction History: Demo mode activated (fallback) - using demo user:', loggedIn);
    }
  }

  const accounts = await getAccounts({ 
    userId: loggedIn.$id 
  })

  if(!accounts) return;
  
  const accountsData = accounts?.data;
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;

  const account = await getAccount({ appwriteItemId })

  // Safety check for transactions
  const transactions = account?.transactions || [];
  const rowsPerPage = 10;
  const totalPages = Math.ceil(transactions.length / rowsPerPage);

  const indexOfLastTransaction = currentPage * rowsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;

  const currentTransactions = transactions.slice(
    indexOfFirstTransaction, indexOfLastTransaction
  )
  return (
    <div className="transactions">
      <div className="transactions-header">
        <HeaderBox 
          title="Transaction History"
          subtext="See your bank details and transactions."
        />
      </div>

      <div className="space-y-6">
        <div className="transactions-account">
          <div className="flex flex-col gap-2">
            <h2 className="text-18 font-bold text-white">{account?.data.name}</h2>
            <p className="text-14 text-blue-25">
              {account?.data.officialName}
            </p>
            <p className="text-14 font-semibold tracking-[1.1px] text-white">
              ●●●● ●●●● ●●●● {account?.data.mask}
            </p>
          </div>
          
          <div className='transactions-account-balance'>
            <p className="text-14">Current balance</p>
            <p className="text-24 text-center font-bold">{formatAmount(account?.data.currentBalance)}</p>
          </div>
        </div>

        <section className="flex w-full flex-col gap-6">
          <TransactionsTable 
            transactions={currentTransactions || []}
          />
            {totalPages > 1 && (
              <div className="my-4 w-full">
                <Pagination totalPages={totalPages} page={currentPage} />
              </div>
            )}
        </section>
      </div>
    </div>
  )
}

export default TransactionHistory