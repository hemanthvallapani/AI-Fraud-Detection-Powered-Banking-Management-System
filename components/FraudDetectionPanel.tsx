'use client';

import { useState } from 'react';
import { analyzeTransactionFraud, getFraudRiskLevel } from '@/lib/actions/fraud.actions';
import { TransactionData, FraudResponse } from '@/lib/fraudlabs';

export default function FraudDetectionPanel() {
  const [transactionData, setTransactionData] = useState<TransactionData>({
    amount: 0,
    currency: 'USD',
    ip_address: '',
    email: '',
    phone: '',
    user_agent: '',
    accept_language: 'en-US'
  });
  
  const [fraudResult, setFraudResult] = useState<FraudResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeTransactionFraud(transactionData);
      setFraudResult(result);
    } catch (error) {
      console.error('Fraud analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        �� AI Fraud Detection System
      </h2>
      
      {/* Transaction Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            value={transactionData.amount}
            onChange={(e) => setTransactionData({...transactionData, amount: parseFloat(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={transactionData.currency}
            onChange={(e) => setTransactionData({...transactionData, currency: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IP Address
          </label>
          <input
            type="text"
            value={transactionData.ip_address}
            onChange={(e) => setTransactionData({...transactionData, ip_address: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="192.168.1.1"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={transactionData.email}
            onChange={(e) => setTransactionData({...transactionData, email: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="user@example.com"
          />
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? '🔍 Analyzing...' : '🚨 Analyze for Fraud'}
      </button>

      {/* Fraud Analysis Results */}
      {fraudResult && (
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Fraud Analysis Results
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className="text-3xl font-bold mb-2">
                {fraudResult.risk_score}
              </div>
              <div className="text-sm text-gray-600">Risk Score</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className={`text-lg font-semibold px-3 py-1 rounded-full ${getRiskColor(fraudResult.risk_level)}`}>
                {fraudResult.risk_level.toUpperCase()} RISK
              </div>
              <div className="text-sm text-gray-600 mt-2">Risk Level</div>
            </div>
          </div>

          {/* Risk Factors */}
          {fraudResult.risk_factors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">Risk Factors:</h4>
              <div className="space-y-1">
                {fraudResult.risk_factors.map((factor, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
                    ⚠️ {factor}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Risk Scores */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{fraudResult.ip_risk}</div>
              <div className="text-xs text-gray-600">IP Risk</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{fraudResult.email_risk}</div>
              <div className="text-xs text-gray-600">Email Risk</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">{fraudResult.phone_risk}</div>
              <div className="text-xs text-gray-600">Phone Risk</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">{fraudResult.address_risk}</div>
              <div className="text-xs text-gray-600">Address Risk</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}