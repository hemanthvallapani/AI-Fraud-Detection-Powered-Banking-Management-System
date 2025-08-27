"use server";

import { Client } from "dwolla-v2";

const getEnvironment = (): "production" | "sandbox" => {
  const environment = process.env.DWOLLA_ENV as string;

  switch (environment) {
    case "sandbox":
      return "sandbox";
    case "production":
      return "production";
    default:
      throw new Error(
        "Dwolla environment should either be set to `sandbox` or `production`"
      );
  }
};

const dwollaClient = new Client({
  environment: getEnvironment(),
  key: process.env.DWOLLA_KEY as string,
  secret: process.env.DWOLLA_SECRET as string,
});

// Create a Dwolla Funding Source using a Plaid Processor Token
export const createFundingSource = async (
  options: CreateFundingSourceOptions
) => {
  try {
    const response = await dwollaClient
      .post(`customers/${options.customerId}/funding-sources`, {
        name: options.fundingSourceName,
        plaidToken: options.plaidToken,
      });
    
    const fundingSourceUrl = response.headers.get("location");
    
    if (!fundingSourceUrl) {
      throw new Error('No funding source URL returned from Dwolla');
    }
    
    return fundingSourceUrl;
  } catch (err) {
    console.error("Creating a Funding Source Failed: ", err);
    throw err;
  }
};

export const createOnDemandAuthorization = async () => {
  try {
    const onDemandAuthorization = await dwollaClient.post(
      "on-demand-authorizations"
    );
    const authLink = onDemandAuthorization.body._links;
    return authLink;
  } catch (err) {
    console.error("Creating an On Demand Authorization Failed: ", err);
  }
};

export const createDwollaCustomer = async (
  newCustomer: NewDwollaCustomerParams
) => {
  try {
    console.log('Creating Dwolla customer with original data:', newCustomer);
    
    // Format postal code to ensure it's valid for Dwolla
    const formattedCustomer = {
      ...newCustomer,
      postalCode: newCustomer.postalCode.replace(/\D/g, '').slice(0, 5), // Remove non-digits and limit to 5 characters
      dateOfBirth: newCustomer.dateOfBirth.split('T')[0], // Ensure date format is YYYY-MM-DD
    };

    console.log('Creating Dwolla customer with formatted data:', formattedCustomer);

    const response = await dwollaClient.post("customers", formattedCustomer);
    const customerUrl = response.headers.get("location");
    
    console.log('Dwolla API response:', response);
    console.log('Customer URL from headers:', customerUrl);
    
    if (!customerUrl) {
      throw new Error('No customer URL returned from Dwolla');
    }
    
    console.log('Dwolla customer created successfully with URL:', customerUrl);
    return customerUrl;
  } catch (err) {
    console.error("Creating a Dwolla Customer Failed: ", err);
    throw err; // Re-throw the error so it can be handled by the caller
  }
};

export const createTransfer = async ({
  sourceFundingSourceUrl,
  destinationFundingSourceUrl,
  amount,
}: TransferParams) => {
  try {
    const requestBody = {
      _links: {
        source: {
          href: sourceFundingSourceUrl,
        },
        destination: {
          href: destinationFundingSourceUrl,
        },
      },
      amount: {
        currency: "USD",
        value: amount,
      },
    };
    return await dwollaClient
      .post("transfers", requestBody)
      .then((res) => res.headers.get("location"));
  } catch (err) {
    console.error("Transfer fund failed: ", err);
  }
};

export const addFundingSource = async ({
  dwollaCustomerId,
  processorToken,
  bankName,
}: AddFundingSourceParams) => {
  try {
    // create dwolla auth link
    const dwollaAuthLinks = await createOnDemandAuthorization();

    // add funding source to the dwolla customer & get the funding source url
    const fundingSourceOptions = {
      customerId: dwollaCustomerId,
      fundingSourceName: bankName,
      plaidToken: processorToken,
      _links: dwollaAuthLinks,
    };
    return await createFundingSource(fundingSourceOptions);
  } catch (err) {
    console.error("Transfer fund failed: ", err);
  }
};
