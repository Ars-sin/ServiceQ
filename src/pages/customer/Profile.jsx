import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Bell, Lock, ChevronDown, ChevronUp } from 'lucide-react';

const TABS = ['Profile', 'Transaction History', 'Help & FAQ', 'Settings'];

const MOCK_TRANSACTIONS = [
  { id: 'SQ-001', service: 'Deep House Cleaning', date: 'Sep 15, 2025', amount: 1100, status: 'Paid' },
  { id: 'SQ-002', service: 'AC Repair & Cleaning', date: 'Sep 10, 2025', amount: 880, status: 'Paid' },
  { id: 'SQ-003', service: 'Hair & Makeup Artist', date: 'Aug 28, 2025', amount: 1320, status: 'Paid' },
  { id: 'SQ-004', service: 'Laptop Repair', date: 'Aug 20, 2025', amount: 495, status: 'Paid' },
  { id: 'SQ-005', service: 'Toyota Innova Rental', date: 'Aug 15, 2025', amount: 2750, status: 'Refunded' },
];

const FAQ_ITEMS = [
  {
    q: 'How do I book a service?',
    a: 'Browse listings on the Discover page, select a listing, choose your preferred date and duration, then click Book Now. You will be directed to checkout.',
  },
  {
    q: 'How do I pay for bookings?',
    a: 'We accept GCash, Maya, Credit/Debit Cards, and Cash on Service. Select your preferred method at checkout.',
  },
  {
    q: 'Can I cancel a booking?',
    a: 'Yes, you can cancel a Scheduled booking from My Bookings. Cancellation policies vary per provider. Refunds are processed within 3–5 business days.',
  },
  {
    q: 'How are providers verified?',
    a: 'All service providers undergo identity verification and background checks before they can list services on ServiceQ.',
  },
  {
    q: 'What is the platform fee?',
    a: 'ServiceQ charges a 10% platform fee on each transaction to maintain the platform, payment security, and customer support.',
  },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
      >
        <span className="font-medium text-gray-800 text-sm">{item.q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-500 bg-gray-50 border-t border-gray-100">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState('Profile');
  const [profileForm, setProfileForm] = useState({
    fullName: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '09171234567',
    address: 'Makati City, Metro Manila',
  });
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [notifications, setNotifications] = useState({
    bookingUpdates: true,
    promotions: false,
    reminders: true,
    newsletter: false,
  });

  const handleProfileSave = (e) => {
    e.preventDefault();
    toast.success('Profile updated successfully!');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    toast.success('Password changed successfully!');
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-brand-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                MS
              </div>
              <h2 className="font-bold text-gray-900">{profileForm.fullName}</h2>
              <p className="text-sm text-gray-400 mb-1">{profileForm.email}</p>
              <p className="text-xs text-gray-300">Member since 2024</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-around text-center">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">12</p>
                    <p className="text-xs text-gray-400">Bookings</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">6</p>
                    <p className="text-xs text-gray-400">Reviews</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">4</p>
                    <p className="text-xs text-gray-400">Saved</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 mt-4 overflow-hidden">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-5 py-3 text-sm font-medium transition border-b border-gray-50 last:border-0 ${
                    activeTab === tab ? 'text-indigo-700 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Profile Tab */}
              {activeTab === 'Profile' && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-6">Edit Profile</h3>
                  <form onSubmit={handleProfileSave} className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={profileForm.fullName}
                          onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Transaction History Tab */}
              {activeTab === 'Transaction History' && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-6">Transaction History</h3>
                  <div className="space-y-3">
                    {MOCK_TRANSACTIONS.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-sm text-gray-800">{tx.service}</p>
                          <p className="text-xs text-gray-400">{tx.date} · {tx.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-indigo-600">₱{tx.amount.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tx.status === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQ Tab */}
              {activeTab === 'Help & FAQ' && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-6">Help & FAQ</h3>
                  <div className="space-y-3">
                    {FAQ_ITEMS.map((item, i) => (
                      <FAQItem key={i} item={item} />
                    ))}
                  </div>
                  <div className="mt-8 p-4 bg-indigo-50 rounded-xl text-center">
                    <p className="text-sm text-indigo-700 font-medium">Still need help?</p>
                    <p className="text-xs text-indigo-500 mt-1">Contact us at support@serviceq.ph</p>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'Settings' && (
                <div className="space-y-6">
                  {/* Change Password */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-indigo-600" /> Change Password
                    </h3>
                    <form onSubmit={handlePasswordChange} className="space-y-3">
                      <input
                        type="password"
                        placeholder="Current Password"
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                        className={inputClass}
                      />
                      <input
                        type="password"
                        placeholder="New Password"
                        value={passwordForm.newPass}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                        className={inputClass}
                      />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        className={inputClass}
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition"
                        >
                          Update Password
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Notifications */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-600" /> Notifications
                    </h3>
                    <div className="space-y-4">
                      {[
                        { key: 'bookingUpdates', label: 'Booking Updates', desc: 'Get notified about your booking status changes' },
                        { key: 'promotions', label: 'Promotions & Offers', desc: 'Receive exclusive deals and discounts' },
                        { key: 'reminders', label: 'Booking Reminders', desc: 'Reminders before your scheduled service' },
                        { key: 'newsletter', label: 'Newsletter', desc: 'Weekly ServiceQ tips and highlights' },
                      ].map((n) => (
                        <div key={n.key} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{n.label}</p>
                            <p className="text-xs text-gray-400">{n.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications({ ...notifications, [n.key]: !notifications[n.key] })}
                            className={`relative w-12 h-6 rounded-full transition ${
                              notifications[n.key] ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                notifications[n.key] ? 'translate-x-6' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
