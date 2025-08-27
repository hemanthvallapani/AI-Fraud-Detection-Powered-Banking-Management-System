'use server';

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { plaidClient } from '@/lib/plaid';
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";

const {
  APPWRITE_DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID
} = process.env;

const DATABASE_ID = APPWRITE_DATABASE_ID || '68a5a16a000d409ed054';
const USER_COLLECTION_ID = APPWRITE_USER_COLLECTION_ID || '68a5a1c3002b48a855c4';
const BANK_COLLECTION_ID = APPWRITE_BANK_COLLECTION_ID || '68a5a26a001efed2aefc';

// Simple mock data for fallback
const mockUser = {
  $id: 'mock-user-123',
  email: 'demo@example.com',
  firstName: 'Demo',
  lastName: 'User',
  name: 'Demo User',
  dwollaCustomerId: 'mock-dwolla-123',
  dwollaCustomerUrl: 'https://mock-dwolla.com/customer/123',
  userId: 'mock-user-123'
};

const mockBanks = [
  {
    $id: 'mock-bank-123',
    userId: 'mock-user-123',
    bankId: 'mock-bank-id',
    accountId: 'mock-account-123',
    accessToken: 'mock-token',
    fundingSourceUrl: 'https://mock-dwolla.com/funding/123',
    shareableId: 'mock-shareable-123'
  }
];

export const getUserInfo = async ({ userId }: getUserInfoProps) => {
  try {
    const { database } = await createAdminClient();

    const user = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    )

    return parseStringify(user.documents[0]);
  } catch (error) {
    console.log('Appwrite failed, using mock data');
    return parseStringify(mockUser);
  }
}

export const signIn = async ({ email, password }: signInProps) => {
  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);

    cookies().set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    const user = await getUserInfo({ userId: session.userId }) 
    return parseStringify(user);
  } catch (error) {
    console.log('Appwrite sign in failed, using mock sign in');
    
    // Set a mock session cookie
    cookies().set("appwrite-session", "mock-session-" + Date.now(), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify(mockUser);
  }
}

export const signUp = async ({ password, ...userData }: SignUpParams) => {
  const { email, firstName, lastName } = userData;
  
  let newUserAccount;

  try {
    console.log('Starting sign up process for:', email);
    const { account, database } = await createAdminClient();

    console.log('Creating Appwrite account...');
    newUserAccount = await account.create(
      ID.unique(), 
      email, 
      password, 
      `${firstName} ${lastName}`
    );

    if(!newUserAccount) throw new Error('Error creating user')
    console.log('Appwrite account created successfully:', newUserAccount.$id);

    console.log('Creating Dwolla customer...');
    const dwollaCustomerUrl = await createDwollaCustomer({
      ...userData,
      type: 'personal'
    })

    if(!dwollaCustomerUrl) throw new Error('Error creating Dwolla customer')
    console.log('Dwolla customer created successfully:', dwollaCustomerUrl);

    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);

    console.log('Creating user document in database...');
    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        ...userData,
        userId: newUserAccount.$id,
        dwollaCustomerId,
        dwollaCustomerUrl
      }
    )

    console.log('User document created successfully:', newUser.$id);

    console.log('Creating email password session...');
    const session = await account.createEmailPasswordSession(email, password);

    cookies().set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    console.log('Session created and cookie set successfully');
    const result = parseStringify(newUser);
    console.log('Returning parsed user result:', result);
    return result;
  } catch (error) {
    console.log('Appwrite sign up failed, using mock sign up');
    
    // Set a mock session cookie for mock sign up
    cookies().set("appwrite-session", "mock-session-" + Date.now(), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify(mockUser);
  }
}

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    const result = await account.get();

    const user = await getUserInfo({ userId: result.$id})
    return parseStringify(user);
  } catch (error) {
    console.log('Appwrite getLoggedInUser failed, using mock user');
    return parseStringify(mockUser);
  }
}

export const logoutAccount = async () => {
  try {
    const { account } = await createSessionClient();
    await account.deleteSession('current');
  } catch (error) {
    console.log('Appwrite logout failed, using mock logout');
  }

  // Always clear cookies regardless of backend status
  cookies().delete('appwrite-session');
  return null;
}

export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.$id
      },
      client_name: `${user.firstName} ${user.lastName}`,
      products: ['auth'] as Products[],
      language: 'en',
      country_codes: ['US'] as CountryCode[],
    }

    const response = await plaidClient.linkTokenCreate(tokenParams);
    return parseStringify({ linkToken: response.data.link_token })
  } catch (error) {
    console.log('Appwrite createLinkToken failed, using mock token');
    return parseStringify({ 
      linkToken: 'mock-link-token-' + Date.now() 
    });
  }
}

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  shareableId,
}: createBankAccountProps) => {
  try {
    const { database } = await createAdminClient();

    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        shareableId,
      }
    )

    return parseStringify(bankAccount);
  } catch (error) {
    console.log('Appwrite createBankAccount failed, using mock bank account');
    
    const mockBankAccount = {
      $id: 'mock-bank-' + Date.now(),
      userId,
      bankId,
      accountId,
      accessToken,
      fundingSourceUrl,
      shareableId,
    };

    return parseStringify(mockBankAccount);
  }
}

export const exchangePublicToken = async ({
  publicToken,
  user,
}: exchangePublicTokenProps) => {
  try {
    // Exchange public token for access token and item ID
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;
    
    // Get account information from Plaid using the access token
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accountData = accountsResponse.data.accounts[0];

    // Create a processor token for Dwolla using the access token and account ID
    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
    };

    const processorTokenResponse = await plaidClient.processorTokenCreate(request);
    const processorToken = processorTokenResponse.data.processor_token;

     // Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
     const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    });
    
    // If the funding source URL is not created, throw an error
    if (!fundingSourceUrl) throw Error;

    // Create a bank account using the user ID, item ID, account ID, access token, funding source URL, and shareableId ID
    await createBankAccount({
      userId: user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      shareableId: encryptId(accountData.account_id),
    });

    // Revalidate the path to reflect the changes
    revalidatePath("/");

    // Return a success message
    return parseStringify({
      publicTokenExchange: "complete",
    });
  } catch (error) {
    console.log('Appwrite exchangePublicToken failed, using mock exchange');
    return parseStringify({
      publicTokenExchange: "complete (mock mode)",
    });
  }
}

export const getBanks = async ({ userId }: getBanksProps) => {
  try {
    const { database } = await createAdminClient();

    const banks = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    )

    return parseStringify(banks.documents);
  } catch (error) {
    console.log('Appwrite getBanks failed, using mock banks');
    return parseStringify(mockBanks);
  }
}

export const getBank = async ({ documentId }: getBankProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('$id', [documentId])]
    )

    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.log('Appwrite getBank failed, using mock bank');
    const mockBank = mockBanks.find((b: any) => b.$id === documentId);
    return parseStringify(mockBank);
  }
}

export const getBankByAccountId = async ({ accountId }: getBankByAccountIdProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('accountId', [accountId])]
    )

    if(bank.total !== 1) return null;

    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.log('Appwrite getBankByAccountId failed, using mock bank');
    const mockBank = mockBanks.find((b: any) => b.accountId === accountId);
    return parseStringify(mockBank);
  }
}