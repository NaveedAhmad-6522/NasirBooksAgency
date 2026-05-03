

import { useState } from "react";

export default function ReportsGate({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    const success = onUnlock(password);
    if (!success) {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617] relative overflow-hidden">
  
      {/* Glow background */}
      <div className="absolute w-[600px] h-[600px] bg-blue-600/20 blur-3xl rounded-full top-[-200px] left-[-200px]" />
      <div className="absolute w-[500px] h-[500px] bg-purple-600/20 blur-3xl rounded-full bottom-[-200px] right-[-200px]" />
  
      {/* Card */}
      <div className="relative z-10 w-[380px] p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl text-center">
  
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl shadow-lg">
            🔒
          </div>
        </div>
  
        {/* Title */}
        <h2 className="text-xl font-semibold text-white">
          Reports Access
        </h2>
  
        <p className="text-sm text-gray-400 mt-1 mb-6">
          This section is restricted. Enter password to continue.
        </p>
  
        {/* Input */}
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
  
        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm mt-2">
            Incorrect password
          </p>
        )}
  
        {/* Button */}
        <button
          onClick={handleSubmit}
          className="w-full mt-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:opacity-90 transition"
        >
          Unlock Reports
        </button>
  
        <p className="text-xs text-gray-500 mt-4">
          Authorized access only
        </p>
  
      </div>
    </div>
  ); 
}