import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Wallet from './Wallet';

export default function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState('auctions');
  const [auctions, setAuctions] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidsForAuction, setBidsForAuction] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const navigate = useNavigate();
  const buyerId = parseInt(localStorage.getItem("userId"));

  useEffect(() => {
    fetch('http://localhost:5000/live-auctions')
      .then(res => res.json())
      .then(data => setAuctions(data))
      .catch(err => console.error('Error fetching auctions:', err));
  }, []);

  useEffect(() => {
    if (activeTab === 'bids') {
      fetch(`http://localhost:5000/my-bids/${buyerId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setMyBids(data.bids);
          }
        })
        .catch(err => console.error('Error fetching my bids:', err));
    }
  }, [activeTab]);

  const handleTab = (tab) => setActiveTab(tab);

  const fetchBidsForAuction = async (auctionId) => {
    try {
      const res = await fetch(`http://localhost:5000/bids/${auctionId}`);
      const data = await res.json();
      if (data.status === 'success') {
        setBidsForAuction(data.bids);
      } else {
        console.error('Error loading bids:', data.message);
      }
    } catch (err) {
      console.error('Network error while fetching bids:', err);
    }
  };

  const handlePlaceBid = async () => {
    if (!bidAmount || isNaN(bidAmount)) {
      alert('Please enter a valid bid amount');
      return;
    }

    const res = await fetch('http://localhost:5000/place-bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyer_id: buyerId,
        auction_id: selectedAuction.auction_id,
        bid_amount: parseFloat(bidAmount)
      })
    });

    const data = await res.json();
    if (data.status === 'success') {
      alert('✅ Bid placed successfully!');
      setBidAmount('');
      setSelectedAuction(null);
      setBidsForAuction([]);
    } else {
      alert(`❌ ${data.message}`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-orange-500">Buyer Dashboard</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
          >
            🏠 Home
          </button>
        </div>

        {/* Wallet */}
        <div className="mb-12 max-w-md">
          <Wallet userId={buyerId} />
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-10">
          {['auctions', 'bids', 'orders'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium border-2 ${
                activeTab === tab
                  ? 'bg-orange-500 text-white border-orange-600'
                  : 'bg-white text-black border-gray-300 hover:bg-orange-100'
              }`}
            >
              {tab === 'auctions' ? 'Live Auctions' : tab === 'bids' ? 'My Bids' : 'Order History'}
            </button>
          ))}
        </div>

        {/* Auctions */}
        {activeTab === 'auctions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <div
                key={auction.auction_id}
                className="bg-white text-black rounded-3xl shadow-lg p-6 border border-gray-300 hover:shadow-xl transition-all"
              >
                <h2 className="text-xl font-bold mb-2">{auction.name}</h2>
                <p className="text-sm text-gray-600">Category: {auction.category}</p>
                <p className="text-sm text-gray-600 mb-2">Ends: {new Date(auction.end_time).toLocaleString()}</p>
                <p className="font-semibold text-orange-600">Starting Bid: ₹{auction.starting_price}</p>
                <button
                  onClick={() => {
                    setSelectedAuction(auction);
                    fetchBidsForAuction(auction.auction_id);
                  }}
                  className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg"
                >
                  Place Bid
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal for Bidding */}
        {selectedAuction && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-black">
              <h2 className="text-lg font-bold mb-4">Place Bid for {selectedAuction.name}</h2>

              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Enter your bid"
                className="w-full mb-4 px-3 py-2 border rounded"
              />

              {bidsForAuction.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-bold mb-2">All Bids (Ascending)</h3>
                  <table className="w-full text-sm bg-gray-100 rounded border text-left">
                    <thead className="bg-gray-300 text-black">
                      <tr>
                        <th className="px-2 py-1">Bidder</th>
                        <th className="px-2 py-1">Amount</th>
                        <th className="px-2 py-1">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bidsForAuction.map((bid) => (
                        <tr key={bid.bid_id} className="border-t">
                          <td className="px-2 py-1">{bid.bidder}</td>
                          <td className="px-2 py-1">₹{bid.bid_amount}</td>
                          <td className="px-2 py-1">{new Date(bid.bid_time).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setSelectedAuction(null)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
                <button onClick={handlePlaceBid} className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600">Submit Bid</button>
              </div>
            </div>
          </div>
        )}

        {/* My Bids */}
        {activeTab === 'bids' && (
          <div className="overflow-x-auto">
            <table className="w-full bg-white text-black rounded-lg shadow">
              <thead className="bg-orange-600 text-white">
                <tr>
                  <th className="py-2 px-4 text-left">Item</th>
                  <th className="py-2 px-4 text-left">Your Bid</th>
                  <th className="py-2 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {myBids.length > 0 ? (
                  myBids.map((bid, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2 px-4">{bid.item_name}</td>
                      <td className="py-2 px-4">₹{bid.bid_amount}</td>
                      <td className={`py-2 px-4 font-semibold ${bid.status === 'Winning' ? 'text-green-600' : 'text-red-500'}`}>{bid.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-4 px-4 text-center text-gray-500">No bids placed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Order History (Static for now) */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full bg-white text-black rounded-lg shadow">
              <thead className="bg-orange-600 text-white">
                <tr>
                  <th className="py-2 px-4 text-left">Item</th>
                  <th className="py-2 px-4 text-left">Paid</th>
                  <th className="py-2 px-4 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-4">Digital Camera</td>
                  <td className="py-2 px-4">₹3500</td>
                  <td className="py-2 px-4">2025-04-10</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
