import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { User, Plan, Subscription, Payment, SiteSettings } from './types';
import { db } from './services/db';
import Layout from './components/Layout';
import { generateAIResponse } from './services/gemini';

// --- Pages ---

// 1. Landing Page
const Landing = () => (
  <div className="bg-white">
    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
        Supercharge your workflow with <span className="text-indigo-600">AI Pro</span>
      </h1>
      <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
        Access state-of-the-art AI models with our flexible subscription plans.
      </p>
      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-md shadow">
          <a href="#/register" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            Get started
          </a>
        </div>
        <div className="ml-3 inline-flex">
          <a href="#/pricing" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
            View pricing
          </a>
        </div>
      </div>
    </div>
  </div>
);

// 2. Auth Pages
const Login = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.findUserByEmail(email);
    if (user && user.passwordHash === password) {
      onLogin(user);
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
      {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">Login</button>
      </form>
      <div className="mt-4 text-center">
        <a href="#/register" className="text-indigo-600 hover:underline">Need an account? Register</a>
      </div>
    </div>
  );
};

const Register = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (db.findUserByEmail(email)) {
      setError('Email already exists');
      return;
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      email,
      passwordHash: password,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    db.createUser(newUser);
    // Assign free plan
    const freePlan = db.getPlans().find(p => p.price === 0);
    if (freePlan) {
        db.activateSubscription({
            id: crypto.randomUUID(),
            userId: newUser.id,
            planId: freePlan.id,
            startDate: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        });
    }
    onLogin(newUser);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
      {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">Register</button>
      </form>
    </div>
  );
};

// 3. Main Feature Pages
const Dashboard = ({ user }: { user: User }) => {
  const [sub, setSub] = useState<Subscription | undefined>(undefined);
  const [usage, setUsage] = useState(0);
  const [plan, setPlan] = useState<Plan | undefined>(undefined);

  useEffect(() => {
    const s = db.getSubscription(user.id);
    setSub(s);
    setUsage(db.getUsage(user.id));
    if (s) {
      setPlan(db.getPlans().find(p => p.id === s.planId));
    }
  }, [user]);

  if (!plan || !sub) return <div className="p-8">Loading subscription...</div>;

  const daysRemaining = Math.ceil((new Date(sub.expiresAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  const usagePercent = Math.min(100, (usage / plan.dailyRequestLimit) * 100);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-indigo-500">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Current Plan</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{plan.name}</p>
          <p className="mt-2 text-sm text-gray-600">Expires in {daysRemaining} days</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Daily Usage</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{usage} / {plan.dailyRequestLimit}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${usagePercent}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-purple-500">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Total Spent</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ${db.getPayments().filter(p => p.userId === user.id && p.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

const AIChat = ({ user }: { user: User }) => {
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Check limits
    const sub = db.getSubscription(user.id);
    if (!sub || new Date(sub.expiresAt) < new Date()) {
      setError('Subscription expired. Please renew.');
      return;
    }
    const plan = db.getPlans().find(p => p.id === sub.planId);
    const usage = db.getUsage(user.id);

    if (plan && usage >= plan.dailyRequestLimit) {
      setError('Daily limit reached. Upgrade your plan for more.');
      return;
    }

    setError('');
    setLoading(true);
    const currentPrompt = prompt;
    setPrompt('');
    setHistory(prev => [...prev, { role: 'user', text: currentPrompt }]);

    // Log usage
    db.incrementUsage(user.id);

    try {
      const responseText = await generateAIResponse(currentPrompt);
      setHistory(prev => [...prev, { role: 'ai', text: responseText }]);
    } catch (err) {
      setHistory(prev => [...prev, { role: 'ai', text: "Error: Could not fetch response." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col h-[calc(100vh-80px)]">
      <div className="flex-grow bg-white rounded-lg shadow overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold">AI Assistant</h2>
          {error && <span className="text-red-500 text-sm font-bold">{error}</span>}
        </div>
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {history.length === 0 && <div className="text-center text-gray-400 mt-10">Start a conversation...</div>}
          {history.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && <div className="text-gray-500 text-sm italic ml-2">AI is thinking...</div>}
        </div>
        <div className="p-4 border-t bg-gray-50">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              className="flex-grow border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Type your prompt..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Pricing = ({ user }: { user: User | null }) => {
  const plans = db.getPlans();
  const navigate = useNavigate();

  const handleSubscribe = (plan: Plan) => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Create pending payment
    db.createPayment({
      id: crypto.randomUUID(),
      userId: user.id,
      planId: plan.id,
      amount: plan.price,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    navigate('/billing');
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Pricing Plans</h2>
        <p className="mt-4 text-xl text-gray-500">Choose the perfect plan for your needs.</p>
      </div>
      <div className="mt-12 grid gap-8 lg:grid-cols-4 sm:grid-cols-2">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
            <div className="px-6 py-8 bg-white flex-grow">
              <h3 className="text-2xl font-bold text-gray-900 text-center">{plan.name}</h3>
              <p className="mt-4 text-center">
                <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                <span className="text-gray-500">/mo</span>
              </p>
              <ul className="mt-8 space-y-4">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    <span className="ml-3 text-gray-600">{feat}</span>
                  </li>
                ))}
                <li className="flex items-center font-semibold text-indigo-600">
                   <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   <span className="ml-3">{plan.dailyRequestLimit} requests/day</span>
                </li>
              </ul>
            </div>
            <div className="px-6 py-8 bg-gray-50">
              <button onClick={() => handleSubscribe(plan)} className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded text-center">
                {plan.price === 0 ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Billing = ({ user }: { user: User }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const plans = db.getPlans();

  useEffect(() => {
    const all = db.getPayments();
    setPayments(all.filter(p => p.userId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Billing & Payments</h1>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {payments.length === 0 ? <li className="p-4 text-center text-gray-500">No payment history found.</li> : null}
          {payments.map(payment => {
            const plan = plans.find(p => p.id === payment.planId);
            return (
              <li key={payment.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="text-sm font-medium text-indigo-600 truncate">{plan?.name || 'Unknown Plan'} Subscription</div>
                  <div className="text-sm text-gray-500">Created on {new Date(payment.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 mr-4">
                    ${payment.amount}
                  </span>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {payment.status.toUpperCase()}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-8 text-center text-gray-500 text-sm">
        Note: Payments are processed manually by Admin in this demo.
      </div>
    </div>
  );
};

// 4. Admin Panel
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'plans' | 'settings'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<any>({});
  const [settings, setSettings] = useState(db.getSettings());
  // Force update
  const [, setTick] = useState(0);

  useEffect(() => {
    setUsers(db.getUsers());
    setPayments(db.getPayments());
    // Calc stats
    const usage = db.getAllUsageStats();
    const totalReq = usage.reduce((acc, curr) => acc + curr.count, 0);
    setStats({ totalReq });
  }, [activeTab, settings]); // Reload when tab changes

  const handleApprove = (id: string) => {
    db.updatePaymentStatus(id, 'paid');
    setPayments(db.getPayments()); // reload
  };

  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveSettings(settings);
    alert('Settings Saved');
    window.location.reload(); 
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-red-600">Admin Panel</h1>
      
      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-xs uppercase">Total Users</div>
          <div className="text-2xl font-bold">{users.length}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-xs uppercase">Total Requests (Today)</div>
          <div className="text-2xl font-bold">{stats.totalReq || 0}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-xs uppercase">Pending Payments</div>
          <div className="text-2xl font-bold text-yellow-600">{payments.filter(p => p.status === 'pending').length}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
            <div className="text-gray-500 text-xs uppercase">Revenue</div>
            <div className="text-2xl font-bold text-green-600">${payments.filter(p => p.status === 'paid').reduce((a, b) => a + b.amount, 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden min-h-[400px]">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {['users', 'payments', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage (Today)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{u.username}</div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{db.getUsage(u.id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.userId.substring(0,8)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${p.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          p.status === 'paid' ? 'bg-green-100 text-green-800' :
                          p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {p.status === 'pending' && (
                          <button onClick={() => handleApprove(p.id)} className="text-indigo-600 hover:text-indigo-900">Approve</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleSettingsSave} className="max-w-md">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Site Name</label>
                    <input className="mt-1 block w-full border border-gray-300 rounded p-2" value={settings.siteName} onChange={e => setSettings({...settings, siteName: e.target.value})} />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <input className="mt-1 block w-full border border-gray-300 rounded p-2" value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} />
                </div>
                <div className="mb-4 flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded" checked={settings.maintenanceMode} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} />
                    <label className="ml-2 block text-sm text-gray-900">Maintenance Mode</label>
                </div>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Save Settings</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// --- App Container ---
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const settings = db.getSettings();

  useEffect(() => {
    // Check session simulation
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('currentUser', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Layout user={user} settings={settings} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing user={user} />} />
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
          
          <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/ai" element={user ? <AIChat user={user} /> : <Navigate to="/login" />} />
          <Route path="/billing" element={user ? <Billing user={user} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && user.role === 'admin' ? <AdminPanel /> : <Navigate to="/dashboard" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;