import { useEffect, useState } from 'react';

export default function Wallet({ userId }) {
  const [balance, setBalance] = useState(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const fetchBalance = async () => {
    if (!userId) {
      setError('❌ Invalid user ID');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/wallet/${userId}`);
      const data = await res.json();
      console.log("📥 Wallet API response:", data);

      if (data.status === 'success') {
        setBalance(data.balance);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch wallet balance');
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
      setError('Network error');
    }
  };

  const handleAddMoney = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/wallet/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, amount: parseFloat(amount) }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        setBalance(data.balance);
        setAmount('');
        alert('✅ Money added successfully!');
      } else {
        alert(data.message || 'Error adding money');
      }
    } catch (err) {
      console.error('Add money error:', err);
      alert('Failed to add money. Try again.');
    }
  };

  useEffect(() => {
    console.log("👤 Fetching balance for userId:", userId);
    fetchBalance();
  }, [userId]);

  return (
    <div className="bg-black text-white p-6 rounded-2xl shadow-md border border-orange-500">
      <h2 className="text-xl font-bold mb-4 text-orange-400">💰 Wallet</h2>
      {error && <p className="text-red-400 mb-2">{error}</p>}
      <p className="mb-4 text-orange-100">Current Balance: ₹{balance ?? '...'}</p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="bg-gray-800 text-white border border-orange-500 px-3 py-2 rounded w-40 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          onClick={handleAddMoney}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition"
        >
          Add Money
        </button>
      </div>
    </div>
  );
}
