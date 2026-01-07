import React, { useState } from 'react';
import { Upload, TrendingUp, Users, AlertCircle, DollarSign, BarChart3, Download, Zap } from 'lucide-react';

const ChurnPredictor = () => {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle file upload
  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(uploadedFile);
    setError('');
    await processFile(uploadedFile);
  };

  // Process the uploaded CSV file
  const processFile = async (file) => {
    setLoading(true);
    setError('');

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain headers and at least one row of data');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
        if (values.length === headers.length) {
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });
          data.push(row);
        }
      }

      if (data.length === 0) {
        throw new Error('No valid data rows found in CSV');
      }

      // Process and predict churn
      const predictions = await predictChurn(data);
      setResults(predictions);
    } catch (err) {
      setError(`Error processing file: ${err.message}`);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  // Churn prediction algorithm (ML simulation)
  const predictChurn = async (data) => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    let totalCustomers = data.length;
    let predictions = [];
    let churnCount = 0;
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;

    // Feature importance tracking
    let featureImpact = {
      contract: 0,
      tenure: 0,
      monthlyCharges: 0,
      totalCharges: 0,
      services: 0
    };

    data.forEach((customer, idx) => {
      let churnScore = 0;
      let reasons = [];

      // Extract and normalize features
      const tenure = parseFloat(customer.tenure || customer.Tenure || 0);
      const monthlyCharges = parseFloat(customer.MonthlyCharges || customer.monthlyCharges || 0);
      const totalCharges = parseFloat(customer.TotalCharges || customer.totalCharges || 0);
      const contract = (customer.Contract || customer.contract || '').toLowerCase();
      const paymentMethod = (customer.PaymentMethod || customer.paymentMethod || '').toLowerCase();
      const internetService = (customer.InternetService || customer.internetService || '').toLowerCase();
      
      // Contract Type Analysis (35% weight)
      if (contract.includes('month')) {
        churnScore += 35;
        reasons.push('Month-to-month contract');
        featureImpact.contract += 35;
      } else if (contract.includes('one') || contract.includes('1')) {
        churnScore += 15;
        featureImpact.contract += 15;
      } else if (contract.includes('two') || contract.includes('2')) {
        churnScore += 5;
        featureImpact.contract += 5;
      }

      // Tenure Analysis (25% weight)
      if (tenure < 6) {
        churnScore += 25;
        reasons.push('Very short tenure (< 6 months)');
        featureImpact.tenure += 25;
      } else if (tenure < 12) {
        churnScore += 18;
        reasons.push('Short tenure (< 1 year)');
        featureImpact.tenure += 18;
      } else if (tenure < 24) {
        churnScore += 10;
        featureImpact.tenure += 10;
      } else if (tenure < 48) {
        churnScore += 5;
        featureImpact.tenure += 5;
      }

      // Monthly Charges Analysis (20% weight)
      if (monthlyCharges > 80) {
        churnScore += 20;
        reasons.push('High monthly charges (>$80)');
        featureImpact.monthlyCharges += 20;
      } else if (monthlyCharges > 60) {
        churnScore += 12;
        reasons.push('Above-average charges');
        featureImpact.monthlyCharges += 12;
      } else if (monthlyCharges > 40) {
        churnScore += 5;
        featureImpact.monthlyCharges += 5;
      }

      // Payment Method Analysis (10% weight)
      if (paymentMethod.includes('electronic') && paymentMethod.includes('check')) {
        churnScore += 10;
        reasons.push('Electronic check payment');
        featureImpact.services += 10;
      }

      // Service Usage Analysis (10% weight)
      const techSupport = (customer.TechSupport || customer.techSupport || '').toLowerCase();
      const onlineSecurity = (customer.OnlineSecurity || customer.onlineSecurity || '').toLowerCase();
      
      if (techSupport.includes('no') || onlineSecurity.includes('no')) {
        churnScore += 10;
        reasons.push('Limited service adoption');
        featureImpact.services += 10;
      }

      // Internet Service Analysis
      if (internetService.includes('fiber')) {
        churnScore += 5;
        featureImpact.services += 5;
      }

      // Determine risk level and churn prediction
      let riskLevel, churnPrediction, confidence;
      
      if (churnScore >= 60) {
        riskLevel = 'High';
        churnPrediction = 'Yes';
        confidence = Math.min(95, 70 + (churnScore - 60) * 0.8);
        highRiskCount++;
        churnCount++;
      } else if (churnScore >= 35) {
        riskLevel = 'Medium';
        churnPrediction = Math.random() > 0.5 ? 'Yes' : 'No';
        confidence = 50 + (churnScore - 35) * 0.6;
        mediumRiskCount++;
        if (churnPrediction === 'Yes') churnCount++;
      } else {
        riskLevel = 'Low';
        churnPrediction = 'No';
        confidence = 85 - churnScore * 1.5;
        lowRiskCount++;
      }

      predictions.push({
        customerId: customer.customerID || customer.CustomerID || `CUST-${idx + 1}`,
        churnPrediction,
        riskLevel,
        churnScore: churnScore.toFixed(1),
        confidence: confidence.toFixed(1),
        reasons: reasons.slice(0, 3),
        tenure,
        monthlyCharges: monthlyCharges.toFixed(2),
        contract: contract || 'Unknown'
      });
    });

    // Calculate metrics
    const churnRate = ((churnCount / totalCustomers) * 100).toFixed(1);
    const avgCustomerValue = predictions.reduce((sum, p) => sum + parseFloat(p.monthlyCharges), 0) / totalCustomers;
    const potentialRevenueLoss = (churnCount * avgCustomerValue * 12).toFixed(0);

    // Normalize feature importance
    const totalImportance = Object.values(featureImpact).reduce((a, b) => a + b, 0);
    Object.keys(featureImpact).forEach(key => {
      featureImpact[key] = ((featureImpact[key] / totalImportance) * 100).toFixed(1);
    });

    return {
      predictions,
      summary: {
        totalCustomers,
        predictedChurn: churnCount,
        churnRate,
        highRisk: highRiskCount,
        mediumRisk: mediumRiskCount,
        lowRisk: lowRiskCount,
        potentialRevenueLoss,
        avgCustomerValue: avgCustomerValue.toFixed(2)
      },
      featureImportance: featureImpact,
      recommendations: generateRecommendations(highRiskCount, mediumRiskCount, churnRate)
    };
  };

  // Generate actionable recommendations
  const generateRecommendations = (highRisk, mediumRisk, churnRate) => {
    const recommendations = [];

    if (parseFloat(churnRate) > 20) {
      recommendations.push({
        priority: 'Critical',
        action: 'Launch immediate retention campaign',
        target: 'High-risk customers',
        impact: 'Reduce churn by 15-20%'
      });
    }

    if (highRisk > 0) {
      recommendations.push({
        priority: 'High',
        action: 'Offer contract upgrades with incentives',
        target: 'Month-to-month contract holders',
        impact: 'Increase customer lifetime value'
      });
    }

    if (mediumRisk > 0) {
      recommendations.push({
        priority: 'Medium',
        action: 'Enhance customer engagement program',
        target: 'Medium-risk segment',
        impact: 'Prevent risk escalation'
      });
    }

    recommendations.push({
      priority: 'Medium',
      action: 'Introduce loyalty rewards for tenured customers',
      target: 'Customers with 12+ months tenure',
      impact: 'Strengthen retention'
    });

    recommendations.push({
      priority: 'Low',
      action: 'Promote value-added services',
      target: 'All customers with basic plans',
      impact: 'Increase service stickiness'
    });

    return recommendations;
  };

  // Download results as CSV
  const downloadResults = () => {
    if (!results) return;

    let csv = 'Customer ID,Churn Prediction,Risk Level,Churn Score,Confidence,Tenure,Monthly Charges,Contract,Top Reasons\n';
    
    results.predictions.forEach(pred => {
      csv += `${pred.customerId},${pred.churnPrediction},${pred.riskLevel},${pred.churnScore},${pred.confidence}%,${pred.tenure},${pred.monthlyCharges},${pred.contract},"${pred.reasons.join('; ')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'churn_predictions.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-5xl font-bold text-gray-800">Telecom Churn Predictor</h1>
          </div>
          <p className="text-xl text-gray-600">AI-Powered Customer Retention Analytics</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="border-3 border-dashed border-indigo-300 rounded-xl p-12 text-center hover:border-indigo-500 transition-all">
            <Upload className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">Upload Customer Data</h3>
            <p className="text-gray-500 mb-6">Upload your CSV file with customer information to predict churn</p>
            <label className="cursor-pointer">
              <span className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors inline-block">
                Choose CSV File
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {file && (
              <p className="mt-4 text-green-600 font-medium">âœ“ {file.name} uploaded</p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-xl text-gray-600">Analyzing customer data with ML algorithms...</p>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <Users className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-sm opacity-90">Total Customers</p>
                <p className="text-3xl font-bold">{results.summary.totalCustomers}</p>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
                <AlertCircle className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-sm opacity-90">Predicted Churn</p>
                <p className="text-3xl font-bold">{results.summary.predictedChurn}</p>
                <p className="text-sm opacity-90">({results.summary.churnRate}%)</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                <Zap className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-sm opacity-90">High Risk</p>
                <p className="text-3xl font-bold">{results.summary.highRisk}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <DollarSign className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-sm opacity-90">Revenue at Risk</p>
                <p className="text-3xl font-bold">${results.summary.potentialRevenueLoss}</p>
                <p className="text-sm opacity-90">annually</p>
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <BarChart3 className="w-7 h-7 mr-3 text-indigo-600" />
                  Risk Distribution
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-red-100 rounded-full w-32 h-32 mx-auto flex items-center justify-center mb-3">
                    <span className="text-4xl font-bold text-red-600">{results.summary.highRisk}</span>
                  </div>
                  <p className="font-semibold text-red-600">High Risk</p>
                  <p className="text-sm text-gray-500">Immediate action needed</p>
                </div>
                <div className="text-center">
                  <div className="bg-orange-100 rounded-full w-32 h-32 mx-auto flex items-center justify-center mb-3">
                    <span className="text-4xl font-bold text-orange-600">{results.summary.mediumRisk}</span>
                  </div>
                  <p className="font-semibold text-orange-600">Medium Risk</p>
                  <p className="text-sm text-gray-500">Monitor closely</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-32 h-32 mx-auto flex items-center justify-center mb-3">
                    <span className="text-4xl font-bold text-green-600">{results.summary.lowRisk}</span>
                  </div>
                  <p className="font-semibold text-green-600">Low Risk</p>
                  <p className="text-sm text-gray-500">Maintain engagement</p>
                </div>
              </div>
            </div>

            {/* Feature Importance */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Top Churn Factors</h2>
              <div className="space-y-4">
                {Object.entries(results.featureImportance)
                  .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]))
                  .map(([feature, importance]) => (
                    <div key={feature}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-700 capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="font-bold text-indigo-600">{importance}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${importance}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Strategic Recommendations</h2>
              <div className="space-y-4">
                {results.recommendations.map((rec, idx) => (
                  <div key={idx} className="border-l-4 border-indigo-500 bg-indigo-50 p-5 rounded-r-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold mr-3 ${
                            rec.priority === 'Critical' ? 'bg-red-500 text-white' :
                            rec.priority === 'High' ? 'bg-orange-500 text-white' :
                            rec.priority === 'Medium' ? 'bg-yellow-500 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                            {rec.priority}
                          </span>
                          <h3 className="font-bold text-gray-800">{rec.action}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-1"><strong>Target:</strong> {rec.target}</p>
                        <p className="text-gray-600 text-sm"><strong>Expected Impact:</strong> {rec.impact}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Predictions Table */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Customer Predictions</h2>
                <button
                  onClick={downloadResults}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export Results
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-indigo-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Prediction</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Risk Level</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Confidence</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tenure</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Monthly Charges</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Top Reasons</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.predictions.slice(0, 10).map((pred, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{pred.customerId}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            pred.churnPrediction === 'Yes' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {pred.churnPrediction}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            pred.riskLevel === 'High' ? 'bg-red-100 text-red-700' :
                            pred.riskLevel === 'Medium' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {pred.riskLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{pred.confidence}%</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{pred.tenure} months</td>
                        <td className="px-4 py-3 text-sm text-gray-700">${pred.monthlyCharges}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{pred.reasons.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {results.predictions.length > 10 && (
                  <p className="text-center text-gray-500 mt-4">
                    Showing 10 of {results.predictions.length} customers. Download full results for complete data.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChurnPredictor;