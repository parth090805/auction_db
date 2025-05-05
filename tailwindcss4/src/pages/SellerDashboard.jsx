import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Wallet from './Wallet';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const sellerId = parseInt(localStorage.getItem("userId"));

  useEffect(() => {
    fetchAuctions();
  }, [sellerId]);

  const fetchAuctions = async () => {
    const res = await fetch(`http://localhost:5000/seller-auctions/${sellerId}`);
    const data = await res.json();
    const updatedItems = await Promise.all(
      data.map(async (item) => {
        try {
          const res2 = await fetch(`http://localhost:5000/highest-bidder/${item.auction_id}`);
          const bidderData = await res2.json();
          if (bidderData.status === 'success') {
            return {
              ...item,
              highestBidder: bidderData.data.username,
              highestBidderId: bidderData.data.user_id,
              highestBid: bidderData.data.bid_amount,
            };
          } else {
            return { ...item, highestBidder: 'No bids', highestBid: null };
          }
        } catch {
          return { ...item, highestBidder: 'Error', highestBid: null };
        }
      })
    );
    setItems(updatedItems);
  };

  const handleDeclareWinner = async (auctionId, winnerId, finalPrice) => {
    try {
      const res = await fetch('http://localhost:5000/declare-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auction_id: auctionId, winner_id: winnerId, final_price: finalPrice }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        alert('✅ Winner declared successfully!');
        fetchAuctions(); // Refresh
      } else {
        alert('❌ Failed to declare winner. Please try again later.');
      }
    } catch (err) {
      alert('❌ Network error. Try again.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold text-orange-500">Seller Dashboard</h1>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
          >
            🏠 Home
          </button>
          <button
            onClick={() => navigate('/create-auction')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            + Create Auction
          </button>
        </div>
      </div>

      {/* Auction Table */}
      <div className="overflow-x-auto bg-white text-black rounded-xl shadow mb-12">
        <table className="w-full table-auto text-left">
          <thead className="bg-orange-600 text-white">
            <tr>
              <th className="py-3 px-4">Auction ID</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Starting Price</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">End Time</th>
              <th className="py-3 px-4">Highest Bidder</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.auction_id} className="border-b hover:bg-orange-50 transition">
                <td className="py-3 px-4">{item.auction_id}</td>
                <td className="py-3 px-4">{item.name}</td>
                <td className="py-3 px-4">{item.category}</td>
                <td className="py-3 px-4">₹{item.starting_price}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'completed'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="py-3 px-4">{new Date(item.end_time).toLocaleString()}</td>
                <td className="py-3 px-4">
                  {item.highestBidder ? (
                    <span className="font-semibold text-orange-600">
                      👑 {item.highestBidder} — ₹{item.highestBid}
                    </span>
                  ) : (
                    <span className="text-gray-400">No Bids</span>
                  )}
                </td>
                <td className="py-3 px-4 space-y-1 space-x-2">
                  <button className="bg-black text-blue-400 px-3 py-1 rounded">Edit</button>
                  <button className="bg-black text-red-500 px-3 py-1 rounded">Delete</button>
                  {item.highestBidderId && item.status === 'active' && (
                    <button
                      className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                      onClick={() =>
                        handleDeclareWinner(item.auction_id, item.highestBidderId, item.highestBid)
                      }
                    >
                      Declare Winner
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Wallet Section */}
      <div className="max-w-md mx-auto">
        <Wallet userId={sellerId} />
      </div>
    </div>
  );
}
