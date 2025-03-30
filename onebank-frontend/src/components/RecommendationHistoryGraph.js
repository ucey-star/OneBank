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

  const { amount, recommended_card } = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow p-2">
      <p className="text-gray-700 font-semibold mb-1">{label}</p>
      <p className="text-gray-600">Amount: ${amount}</p>
      <p className="text-gray-600">Card used: {recommended_card}</p>
    </div>
  );
}

function parseLocalDate(dateStr) {
  // dateStr is "YYYY-MM-DD"
  const [year, month, day] = dateStr.split("-");
  // Note: month is zero-based in JS Date
  return new Date(year, month - 1, day);
}

export default function RecommendationHistoryGraph() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const itemsPerPage = 10;

  async function loadHistory() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchRecommendationHistory(startDate, endDate);
      setHistory(data.reverse()); // Show latest entries first
      setCurrentPage(1);
    } catch (err) {
      setError("Failed to load recommendation history.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.ceil(history.length / itemsPerPage);
  const currentData = history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const uniqueMonths = Array.from(
    new Set(
      currentData.map((entry) =>
        new Date(entry.date).toLocaleString("en-US", { month: "long" })
      )
    )
  );

  return (
    <motion.div
      className="bg-white rounded-lg shadow-lg p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <IoBarChartOutline size={24} />
        Recommendation History
      </h3>
      <p className="text-gray-500 mb-6">
        Visualizing your recommended cards over time.
      </p>

      {/* Date Filter Section */}
      <div className="mb-6 bg-gray-50 p-4 rounded-md shadow-sm flex flex-wrap items-end gap-4">
        {/* Start Date */}
        <div className="flex flex-col">
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor="startDate"
          >
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm 
                       focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700" htmlFor="endDate">
            End Date
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm 
                       focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {/* Filter Button */}
        <button
          onClick={loadHistory}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 
                     border border-transparent rounded-md font-medium 
                     text-white hover:bg-indigo-700 focus:outline-none 
                     focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 
                     transition"
        >
          Apply Filter
        </button>
      </div>

      {error && (
        <p className="text-red-600 font-semibold mt-2 mb-4">{error}</p>
      )}
      {loading && <p className="text-gray-600">Loading data...</p>}

      {!loading && !error && currentData.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={currentData}
              margin={{ top: 20, right: 40, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tickFormatter={(dateStr) => {
                  const dateObj = parseLocalDate(dateStr);
                  return dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
                tick={{ fontSize: 12, fill: "#F59E0B" }}
                axisLine={{ stroke: "#D1D5DB" }}
                tickLine={false}
                label={{
                  value: "Date (Latest → Oldest)",
                  position: "insideBottom",
                  offset: -30,
                  fontSize: 12,
                  fill: "#6B7280",
                }}
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
                stroke="#6366F1"
                strokeWidth={3}
                dot={{ r: 6, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 8, fill: "#6366F1" }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 text-sm text-gray-600">
            Period Covered: {uniqueMonths.join(", ")}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Note: The history is shown in descending order (latest first).
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
