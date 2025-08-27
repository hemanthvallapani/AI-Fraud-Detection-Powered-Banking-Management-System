import { fraudLabsFraud } from './fraudlabs';

async function testFraudLabs() {
  try {
    console.log('🔍 Testing FraudLabs Pro...');
    
    const result = await fraudLabsFraud.analyzeTransaction({
      ip_address: '8.8.8.8',
      email: 'test@example.com',
      amount: 150,
      currency: 'USD',
      user_agent: 'Mozilla/5.0',
      accept_language: 'en-US'
    });
    
    console.log('✅ FraudLabs working!', result);
    
  } catch (error: any) {
    console.log('❌ Error:', error.message);
  }
}

testFraudLabs();