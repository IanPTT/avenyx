'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: 0, duration: 30, maxDevices: 1, active: true });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const { data } = await axios.get(`${API_URL}/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await axios.post(`${API_URL}/plans`, form, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setShowForm(false);
    setForm({ name: '', price: 0, duration: 30, maxDevices: 1, active: true });
    fetchPlans();
  };

  const handleToggle = async (plan) => {
    const token = localStorage.getItem('token');
    await axios.put(`${API_URL}/plans/${plan.id}`, 
      { ...plan, active: !plan.active },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchPlans();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this plan?')) return;
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/plans/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchPlans();
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Plans</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="gradient-bg text-white px-4 py-2 rounded"
        >
          {showForm ? 'Cancel' : 'Add Plan'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Plan Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Premium"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (days)</label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Devices</label>
                <input
                  type="number"
                  value={form.maxDevices}
                  onChange={(e) => setForm({ ...form, maxDevices: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
            </div>
            <button type="submit" className="gradient-bg text-white px-6 py-2 rounded">
              Create Plan
            </button>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className={`bg-white p-6 rounded-lg shadow ${!plan.active ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <button
                onClick={() => handleToggle(plan)}
                className={`px-2 py-1 rounded text-xs ${plan.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                {plan.active ? 'Active' : 'Disabled'}
              </button>
            </div>
            <p className="text-3xl font-bold mb-2">${plan.price}</p>
            <p className="text-gray-600 mb-4">{plan.duration} days</p>
            <p className="text-gray-600 mb-4">Max {plan.maxDevices} devices</p>
            <button
              onClick={() => handleDelete(plan.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Delete Plan
            </button>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="col-span-3 text-center py-8 text-gray-500">
            No plans created yet
          </div>
        )}
      </div>
    </div>
  );
}