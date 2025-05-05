import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function HomePage() {
  const { pathname } = useLocation();
  const [darkMode, setDarkMode] = useState(() => localStorage.theme === 'dark');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [darkMode]);

  return (
    <div className="w-full min-h-screen bg-black text-white overflow-x-hidden relative">
      {/* Navbar */}
      <header className="w-full flex justify-between items-center px-10 py-4 bg-gradient-to-r from-black via-gray-900 to-black shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img
            src="https://cdn-icons-png.flaticon.com/512/869/869636.png"
            alt="logo"
            className="w-7 h-7"
          />
          <h1 className="text-2xl font-extrabold tracking-wide text-orange-500">AuctionHub</h1>
        </div>
        <nav className="space-x-6 text-sm md:text-base font-medium flex items-center">
          {[['/', 'Home'], ['/login', 'Login'], ['/register', 'Register']].map(([path, label]) => (
            <Link
              key={label}
              to={path}
              className={`transition transform hover:scale-110 ${
                pathname === path
                  ? 'text-orange-500 font-semibold cursor-default'
                  : 'text-orange-400 hover:text-orange-500'
              }`}
            >
              {label}
            </Link>
          ))}
          <a
            href="http://localhost:5000"
            className="text-orange-400 hover:text-orange-500 transition transform hover:scale-110"
            target="_blank"
            rel="noopener noreferrer"
          >
            Query Dashboard
          </a>
        </nav>
      </header>

      {/* Hero Section - now with image */}
      <section
        className="relative w-full h-[100vh] flex items-center justify-center text-center"
        style={{
          backgroundImage: "url('/hammer-image.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="relative z-10 text-white bg-black/40 p-6 rounded-xl backdrop-blur-md">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-orange-500 drop-shadow-lg">
            Bid Bold. Win Big.
          </h2>
          <p className="text-lg text-orange-100 max-w-2xl mx-auto">
            A secure and premium auction platform where verified buyers and sellers trade exclusive items
            with confidence and flair.
          </p>
        </div>
      </section>

      {/* What You Can Do Section */}
      <section className="bg-black text-orange-100 py-20 px-4">
        <h2 className="text-4xl font-extrabold text-center text-orange-400 mb-12">What You Can Do</h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-4">
          {/* Buyers Card */}
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-300/5 p-6 rounded-2xl border border-orange-400 shadow-md hover:shadow-orange-500/30 transition duration-300 hover:scale-[1.02] backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-orange-300 mb-4 flex items-center gap-2">🛒 For Buyers</h3>
            <ul className="list-disc list-inside text-orange-100 space-y-2 text-base pl-2">
              <li>🎯 Place bids on live auctions</li>
              <li>💰 View wallet balance and deposit money</li>
              <li>📊 Track current bids and win status</li>
              <li>📁 Check transaction and order history</li>
            </ul>
          </div>

          {/* Sellers Card */}
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-300/5 p-6 rounded-2xl border border-orange-400 shadow-md hover:shadow-orange-500/30 transition duration-300 hover:scale-[1.02] backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-orange-300 mb-4 flex items-center gap-2">🏷 For Sellers</h3>
            <ul className="list-disc list-inside text-orange-100 space-y-2 text-base pl-2">
              <li>🧾 Create new auctions easily</li>
              <li>📈 Monitor live auctions</li>
              <li>📚 Access complete transaction history</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-[#511d0d] text-white py-14">
        <h2 className="text-3xl font-bold text-center mb-10 text-orange-300">Live Stats</h2>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center px-6">
          {[
            { icon: '📦', label: 'Live Auctions', color: 'bg-orange-600' },
            { icon: '👥', label: 'Total Users', color: 'bg-orange-600' },
            { icon: '💸', label: 'Active Bids', color: 'bg-orange-600' },
            { icon: '📂', label: 'Categories', color: 'bg-orange-600' }
          ].map((stat, index) => (
            <div key={index} className="flex flex-col items-center hover:scale-110 transform transition">
              <div className={`w-20 h-20 flex items-center justify-center rounded-full text-3xl text-white ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="mt-4 font-semibold text-lg text-white">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Ticker */}
      <div className="fixed bottom-0 left-0 w-full bg-orange-600 py-1.5 shadow-inner z-50 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee text-white font-medium text-sm px-4">
          🕐 Auction ending soon: Smart Watch — ₹4200
          &nbsp;&nbsp;&nbsp;&nbsp;🔥 New listing: PlayStation 5 — Starting ₹39,999
          &nbsp;&nbsp;&nbsp;&nbsp;💎 Rare Find: Diamond Pendant — Last Bid ₹11,000
          &nbsp;&nbsp;&nbsp;&nbsp;📦 Fresh Drop: Wireless Earbuds — ₹799 Only!
        </div>
      </div>
    </div>
  );
}
