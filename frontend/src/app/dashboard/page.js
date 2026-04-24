'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [apk, setApk] = useState({ version: '1.0.0', size: 0 });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [location, setLocation] = useState('India');
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [userRes, subRes, plansRes, apkRes] = await Promise.all([
        axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/subscriptions/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/plans`),
        axios.get(`${API_URL}/apk/latest`)
      ]);

      setUser(userRes.data.user);
      setSubscription(subRes.data);
      setPlans(plansRes.data);
      setApk(apkRes.data);
      setLocation(userRes.data.user.location || 'India');
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = async (newLocation) => {
    const token = localStorage.getItem('token');
    await axios.put(`${API_URL}/location`, 
      { location: newLocation },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setLocation(newLocation);
  };

  const handleCreateSubscription = async () => {
    if (!selectedPlan) return;
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/subscriptions`,
        { planId: selectedPlan },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create subscription');
    }
  };

  const handleConnect = async () => {
    const token = localStorage.getItem('token');
    setConnecting(true);
    try {
      await axios.post(`${API_URL}/vpn/connect`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConnected(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold gradient-bg text-white px-3 py-1 rounded">Avenyx</Link>
          <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
              {subscription?.status === 'ACTIVE' ? (
                <div>
                  <div className="flex items-center mb-4">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                  <p className="text-gray-600">Plan: {subscription.plan?.name}</p>
                  <p className="text-gray-600">Expires: {new Date(subscription.endDate).toLocaleDateString()}</p>
                  <p className="text-gray-600">Devices: {subscription.plan?.maxDevices} max</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">No active subscription</p>
                  <div className="space-y-2">
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="">Select a plan</option>
                      {plans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} - ${plan.price} ({plan.duration} days)
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleCreateSubscription}
                      disabled={!selectedPlan}
                      className="w-full gradient-bg text-white py-2 rounded hover:opacity-90 disabled:opacity-50"
                    >
                      Create Subscription
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Select Location</h2>
              <div className="space-y-2">
                {['India', 'Germany'].map(loc => (
                  <button
                    key={loc}
                    onClick={() => handleLocationChange(loc)}
                    className={`w-full p-3 rounded border text-left ${location === loc ? 'border-purple-500 bg-purple-50' : ''}`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">VPN Connection</h2>
              <div className="text-center py-8">
                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 ${connected ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <button
                    onClick={handleConnect}
                    disabled={connecting || subscription?.status !== 'ACTIVE'}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold ${connected ? 'bg-green-500' : 'gradient-bg'} ${subscription?.status !== 'ACTIVE' ? 'opacity-50' : ''}`}
                  >
                    {connecting ? '...' : connected ? 'ON' : 'OFF'}
                  </button>
                </div>
                <p className="text-gray-600">
                  {connected ? `Connected to ${location}` : 'Tap to connect'}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Download App</h2>
              <a
                href={`${API_URL}/apk/download`}
                className="block w-full gradient-bg text-white py-3 rounded-lg text-center hover:opacity-90"
              >
                Download Avenyx APK
              </a>
              <p className="text-center text-gray-500 mt-2">v{apk.version} - {Math.round(apk.size / 1024 / 1024)}MB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}