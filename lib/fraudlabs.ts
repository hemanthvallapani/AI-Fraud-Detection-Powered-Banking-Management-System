import axios from 'axios';

export interface TransactionData {
  amount: number;
  currency: string;
  ip_address: string;
  email?: string;
  phone?: string;
  user_agent?: string;
  accept_language?: string;
}

export interface FraudResponse {
  risk_score: number;
  risk_level: string;
  risk_factors: string[];
  ip_risk: number;
  email_risk: number;
  phone_risk: number;
  address_risk: number;
}

export class FraudLabsFraudDetection {
  private apiKey: string = 'KS0IHQSL1TBSJWOPHK6FYZLAE69OQ8OC';
  private baseUrl: string = 'https://api.fraudlabspro.com/v1/order/screen';

  async analyzeTransaction(transactionData: TransactionData): Promise<FraudResponse> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          ip: transactionData.ip_address,
          email: transactionData.email || '',
          amount: transactionData.amount,
          currency: transactionData.currency,
          user_agent: transactionData.user_agent || '',
          accept_language: transactionData.accept_language || 'en-US'
        }
      });

      const data = response.data;
      
      return {
        risk_score: data.risk_score || 0,
        risk_level: this.getRiskLevel(data.risk_score || 0),
        risk_factors: this.getRiskFactors(data),
        ip_risk: data.ip_risk || 0,
        email_risk: data.email_risk || 0,
        phone_risk: 0, // FraudLabs doesn't provide phone risk
        address_risk: 0 // FraudLabs doesn't provide address risk
      };
    } catch (error) {
      console.error('FraudLabs fraud detection error:', error);
      throw new Error('Failed to analyze transaction for fraud');
    }
  }

  private getRiskLevel(riskScore: number): string {
    if (riskScore < 10) return 'LOW RISK';
    if (riskScore < 25) return 'MEDIUM RISK';
    if (riskScore < 50) return 'HIGH RISK';
    return 'VERY HIGH RISK';
  }

  private getRiskFactors(data: any): string[] {
    const factors: string[] = [];
    
    if (data.proxy) factors.push('Proxy/VPN detected');
    if (data.tor) factors.push('Tor network detected');
    if (data.disposable_email) factors.push('Disposable email detected');
    if (data.high_risk_country) factors.push('High risk country');
    if (data.ship_forward) factors.push('Shipping forwarding detected');
    if (data.risk_score > 75) factors.push('High risk score');
    
    return factors.length > 0 ? factors : ['No specific risk factors detected'];
  }
}

export const fraudLabsFraud = new FraudLabsFraudDetection();