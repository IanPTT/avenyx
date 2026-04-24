'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function NodesPage() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', location: 'India', apiUrl: '', apiKey: '', inboundId: 443, capacity: 100 });

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const { data } = await axios.get(`${API_URL}/nodes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNodes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await axios.post(`${API_URL}/nodes`, form, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setShowForm(false);
    setForm({ name: '', location: 'India', apiUrl: '', apiKey: '', inboundId: 443, capacity: 100 });
    fetchNodes();
  };

  const handleToggle = async (node) => {
    const token = localStorage.getItem('token');
    await axios.put(`${API_URL}/nodes/${node.id}`, 
      { ...node, active: !node.active },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchNodes();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this node?')) return;
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/nodes/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchNodes();
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Nodes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="gradient-bg text-white px-4 py-2 rounded"
        >
          {showForm ? 'Cancel' : 'Add Node'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <select
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="India">India</option>
                  <option value="Germany">Germany</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">API URL</label>
                <input
                  value={form.apiUrl}
                  onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="https://marzban.example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <input
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Inbound ID</label>
                <input
                  type="number"
                  value={form.inboundId}
                  onChange={(e) => setForm({ ...form, inboundId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Capacity</label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
            </div>
            <button type="submit" className="gradient-bg text-white px-6 py-2 rounded">
              Add Node
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {nodes.map(node => (
              <tr key={node.id}>
                <td className="px-6 py-4 font-medium">{node.name}</td>
                <td className="px-6 py-4">{node.location}</td>
                <td className="px-6 py-4 text-gray-500">{node.apiUrl}</td>
                <td className="px-6 py-4">{node.capacity}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggle(node)}
                    className={`px-2 py-1 rounded text-xs ${node.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {node.active ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDelete(node.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {nodes.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No nodes added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}