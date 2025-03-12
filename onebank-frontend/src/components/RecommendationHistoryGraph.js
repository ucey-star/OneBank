import React, { useEffect, useState } from "react";
import { fetchRecommendationHistory } from "../api/recommendation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import { IoBarChartOutline } from "react-icons/io5";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  // The entire data point is in payload[0].payload
  const { amount, recommended_card } = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow p-2">
      <p className="text-gray-700 font-semibold mb-1">{label}</p>
      <p className="text-gray-600">Amount: ${amount}</p>
      <p className="text-gray-600">Card used: {recommended_card}</p>
    </div>
  );
}

export default function RecommendationHistoryGraph() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const data = await fetchRecommendationHistory();
        setHistory(data);
      } catch (err) {
        setError("Failed to load recommendation history.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <motion.div
          className="text-gray-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Loading recommendation history...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-500">
        <IoBarChartOutline className="text-6xl mb-4 text-gray-400" />
        <p className="text-lg font-semibold">No recommendations found yet.</p>
        <p className="text-sm text-gray-400">Start making transactions to see history here.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-lg shadow-lg p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="text-2xl font-bold text-gray-800 mb-4">
        Recommendation History
      </h3>
      <p className="text-gray-500 mb-6">
        Visualizing your recommended cards over time.
      </p>

      <div className="overflow-x-auto">
        <div className="min-w-[1000px] h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={history}
              margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
            >
                {console.log("data", history)}
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={1} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={1} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                axisLine={{ stroke: "#D1D5DB" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6B7280" }}
                axisLine={{ stroke: "#D1D5DB" }}
                tickLine={false}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                wrapperStyle={{ outline: "none" }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                dot={{ r: 6, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 8, fill: "#6366F1" }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
