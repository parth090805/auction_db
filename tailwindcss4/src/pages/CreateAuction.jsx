import { useState } from 'react';

export default function CreateAuction() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [endTime, setEndTime] = useState('');
  const sellerId = parseInt(localStorage.getItem("userId")); // ✅ Now dynamic

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('http://localhost:5000/create-auction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seller_id: sellerId,
        name,
        description,
        category,
        starting_price: startingPrice,
        end_time: endTime,
      }),
    });

    const data = await response.json();
    if (data.status === 'success') {
      alert('Auction created successfully!');
      setName('');
      setDescription('');
      setCategory('');
      setStartingPrice('');
      setEndTime('');
    } else {
      alert('Error: ' + data.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-10">
      <div className="bg-white text-black p-10 rounded-3xl shadow-xl w-full max-w-lg border-2 border-orange-500">
        <h2 className="text-3xl font-bold text-center text-orange-600 mb-8">
          🛠 Create New Auction
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Item Name"
            className="w-full p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <textarea
            placeholder="Item Description"
            className="w-full p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Category"
            className="w-full p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Starting Price"
            className="w-full p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
            required
          />
          <input
            type="datetime-local"
            className="w-full p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-3 rounded-md hover:bg-orange-700 transition"
          >
            🚀 Create Auction
          </button>
        </form>
      </div>
    </div>
  );
}
