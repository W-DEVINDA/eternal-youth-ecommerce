import React, { useEffect, useState } from "react";
import "./Analytics.css";
import { backend_url, currency } from "../../App";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import * as tf from "@tensorflow/tfjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
);

const TABS = ["Recommendations", "Sales Trends", "Inventory"];

const Analytics = () => {
  const [activeTab, setActiveTab] = useState("Recommendations");
  const [topSelling, setTopSelling] = useState([]);
  const [weeklySales, setWeeklySales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ts, ws, inv] = await Promise.all([
        fetch(`${backend_url}/admin/analytics/topselling`).then(r => r.json()),
        fetch(`${backend_url}/admin/analytics/weeklysales`).then(r => r.json()),
        fetch(`${backend_url}/admin/analytics/inventory`).then(r => r.json()),
      ]);
      setTopSelling(ts);
      setWeeklySales(ws);
      setInventory(inv);
      if (ws.length > 0) await runForecast(ws);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // TensorFlow.js — simple linear regression to forecast next 3 days
  const runForecast = async (data) => {
    try {
      const revenues = data.map(d => d.revenue);
      const xs = tf.tensor1d(revenues.map((_, i) => i));
      const ys = tf.tensor1d(revenues);

      // Normalize
      const xMin = xs.min();
      const xMax = xs.max();
      const yMin = ys.min();
      const yMax = ys.max();
      const xNorm = xs.sub(xMin).div(xMax.sub(xMin).add(1e-7));
      const yNorm = ys.sub(yMin).div(yMax.sub(yMin).add(1e-7));

      // Simple linear model
      const w = tf.variable(tf.scalar(Math.random()));
      const b = tf.variable(tf.scalar(Math.random()));
      const predict = (x) => x.mul(w).add(b);
      const loss = (pred, actual) => pred.sub(actual).square().mean();
      const optimizer = tf.train.sgd(0.1);

      for (let i = 0; i < 200; i++) {
        optimizer.minimize(() => loss(predict(xNorm), yNorm));
      }

      // Forecast next 3 days
      const nextDays = [];
      for (let i = 0; i < 3; i++) {
        const xVal = (revenues.length + i - xMin.dataSync()[0]) /
          (xMax.dataSync()[0] - xMin.dataSync()[0] + 1e-7);
        const pred = predict(tf.scalar(xVal));
        const denorm = pred.dataSync()[0] *
          (yMax.dataSync()[0] - yMin.dataSync()[0]) + yMin.dataSync()[0];
        nextDays.push(Math.max(0, Math.round(denorm)));
      }

      setForecast(nextDays);

      // Cleanup
      [xs, ys, xMin, xMax, yMin, yMax, xNorm, yNorm, w, b].forEach(t => t.dispose());
    } catch (e) {
      console.error("TF forecast error:", e);
    }
  };

  // Demand level helper
  const getDemandLevel = (totalSold, max) => {
    const ratio = totalSold / (max || 1);
    if (ratio > 0.6) return { label: "High", color: "#22c55e" };
    if (ratio > 0.2) return { label: "Medium", color: "#f59e0b" };
    return { label: "Low", color: "#ff4141" };
  };

  const maxSold = inventory.length > 0 ? inventory[0].totalSold : 1;

  // Chart data
  const labels = weeklySales.map(d => d.date);
  const forecastLabels = ["Day +1", "Day +2", "Day +3"];

  const revenueData = {
    labels: [...labels, ...forecastLabels],
    datasets: [
      {
        label: "Actual Revenue (LKR)",
        data: [...weeklySales.map(d => d.revenue), null, null, null],
        borderColor: "#ff4141",
        backgroundColor: "rgba(255,65,65,0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 5,
      },
      {
        label: "Forecast Revenue (LKR)",
        data: [...weeklySales.map(() => null), ...forecast],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.1)",
        fill: true,
        tension: 0.4,
        borderDash: [6, 3],
        pointRadius: 5,
      },
    ],
  };

  const ordersData = {
    labels,
    datasets: [{
      label: "Orders",
      data: weeklySales.map(d => d.orders),
      backgroundColor: "rgba(255,65,65,0.7)",
      borderRadius: 6,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: "top" } },
    scales: { y: { beginAtZero: true } },
  };
const generatePDF = async () => {
    setGeneratingPDF(true);
    try {
      const res = await fetch(`${backend_url}/admin/analytics/monthlyreport`);
      const data = await res.json();

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Helper functions
      const addTitle = (text, size = 16, color = [255, 65, 65]) => {
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.setFont("helvetica", "bold");
        doc.text(text, pageWidth / 2, y, { align: "center" });
        y += 8;
      };

      const addText = (text, size = 10, color = [60, 60, 60]) => {
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.setFont("helvetica", "normal");
        doc.text(text, 14, y);
        y += 6;
      };

      const addSection = (title) => {
        y += 4;
        doc.setFillColor(255, 65, 65);
        doc.rect(14, y, pageWidth - 28, 8, "F");
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text(title, 18, y + 5.5);
        y += 14;
      };

      const checkPage = (needed = 30) => {
        if (y + needed > 270) { doc.addPage(); y = 20; }
      };

      // ── Cover ──
      doc.setFillColor(255, 65, 65);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("ETERNAL YOUTH", pageWidth / 2, 18, { align: "center" });
      doc.setFontSize(13);
      doc.text(`Monthly Analytics Report — ${data.month}`, pageWidth / 2, 30, { align: "center" });
      y = 55;

      // ── Summary ──
      addSection("SUMMARY");
      const summaryData = [
        ["Total Revenue", `LKR ${data.totalRevenue.toLocaleString()}`],
        ["Total Orders", `${data.totalOrders}`],
        ["Average Order Value", `LKR ${data.avgOrderValue.toLocaleString()}`],
      ];
      autoTable(doc, {
        startY: y,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [255, 65, 65], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 10 },
        columnStyles: { 1: { fontStyle: "bold" } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 14;

      // ── Top Selling ──
      checkPage(60);
      addSection("TOP SELLING PRODUCTS");
      autoTable(doc, {
        startY: y,
        head: [["#", "Product", "Units Sold", "Orders", "Revenue (LKR)"]],
        body: data.topSelling.map((p, i) => [
          `#${i + 1}`,
          p.name,
          p.totalQuantity,
          p.orderCount,
          p.totalRevenue.toLocaleString(),
        ]),
        theme: "striped",
        headStyles: { fillColor: [255, 65, 65], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 14;

      // ── Daily Breakdown ──
      checkPage(60);
      addSection("DAILY SALES BREAKDOWN");

      // Mini bar chart using canvas
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      const days = data.dailyBreakdown.filter(d => d.revenue > 0 || d.orders > 0);
      const maxRev = Math.max(...days.map(d => d.revenue), 1);
      const barWidth = Math.floor(760 / (days.length || 1));

      ctx.fillStyle = "#f9f9f9";
      ctx.fillRect(0, 0, 800, 200);

      days.forEach((d, i) => {
        const barH = Math.round((d.revenue / maxRev) * 150);
        ctx.fillStyle = "#ff4141";
        ctx.fillRect(20 + i * barWidth, 170 - barH, barWidth - 4, barH);
        ctx.fillStyle = "#555";
        ctx.font = "10px sans-serif";
        ctx.fillText(d.day, 22 + i * barWidth, 185);
      });

      ctx.fillStyle = "#333";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("Daily Revenue (LKR)", 14, 14);

      const chartImg = canvas.toDataURL("image/png");
      checkPage(60);
      doc.addImage(chartImg, "PNG", 14, y, pageWidth - 28, 50);
      y += 58;

      // Daily table
      checkPage(40);
      autoTable(doc, {
        startY: y,
        head: [["Day", "Revenue (LKR)", "Orders"]],
        body: data.dailyBreakdown.map(d => [
          d.day,
          d.revenue.toLocaleString(),
          d.orders,
        ]),
        theme: "striped",
        headStyles: { fillColor: [255, 65, 65], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 14;

      // ── Inventory ──
      checkPage(60);
      addSection("INVENTORY DEMAND ANALYSIS");
      const maxSoldVal = data.inventory[0]?.totalSold || 1;
      autoTable(doc, {
        startY: y,
        head: [["Product", "Category", "Type", "Units Sold", "Demand"]],
        body: data.inventory.map(p => {
          const ratio = p.totalSold / maxSoldVal;
          const demand = ratio > 0.6 ? "High" : ratio > 0.2 ? "Medium" : "Low";
          return [p.name, p.category, p.type, p.totalSold, demand];
        }),
        theme: "striped",
        headStyles: { fillColor: [255, 65, 65], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 8 },
        columnStyles: {
          4: {
            fontStyle: "bold",
          }
        },
        didDrawCell: (hookData) => {
          if (hookData.column.index === 4 && hookData.section === "body") {
            const val = hookData.cell.raw;
            if (val === "High") hookData.cell.styles.textColor = [34, 197, 94];
            else if (val === "Medium") hookData.cell.styles.textColor = [245, 158, 11];
            else hookData.cell.styles.textColor = [255, 65, 65];
          }
        },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 14;

      // ── Footer on each page ──
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text(
          `Eternal Youth | ${data.month} Report | Page ${i} of ${totalPages}`,
          pageWidth / 2,
          290,
          { align: "center" }
        );
      }

      doc.save(`EternalYouth_Report_${data.month.replace(" ", "_")}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
      alert("Failed to generate report. Please try again.");
    }
    setGeneratingPDF(false);
  };
  if (loading) return <div className="analytics-loading">Loading analytics...</div>;

  return (
    <div className="analytics">
    <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <button
          className="analytics-download-btn"
          onClick={generatePDF}
          disabled={generatingPDF}
        >
          {generatingPDF ? "Generating..." : "⬇ Download Monthly Report"}
        </button>
      </div>

      {/* Tabs */}
      <div className="analytics-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`analytics-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Recommendations Tab ── */}
      {activeTab === "Recommendations" && (
        <div className="analytics-section">
          <h2>Top Selling Products</h2>
          <p className="analytics-subtitle">Based on total units sold across all orders</p>
          {topSelling.length === 0 ? (
            <p className="analytics-empty">No order data yet.</p>
          ) : (
            <>
              {/* Top 3 cards */}
              <div className="analytics-top3">
                {topSelling.slice(0, 3).map((p, i) => (
                  <div key={i} className={`analytics-top-card rank-${i + 1}`}>
                    <div className="analytics-rank">#{i + 1}</div>
                    <p className="analytics-top-name">{p.name}</p>
                    <p className="analytics-top-stat">{p.totalQuantity} units sold</p>
                    <p className="analytics-top-stat">{currency}{p.totalRevenue.toLocaleString()} revenue</p>
                    <p className="analytics-top-orders">{p.orderCount} orders</p>
                  </div>
                ))}
              </div>

              {/* Full list */}
              <div className="analytics-table">
                <div className="analytics-table-header">
                  <span>Rank</span>
                  <span>Product</span>
                  <span>Units Sold</span>
                  <span>Orders</span>
                  <span>Revenue</span>
                </div>
                {topSelling.map((p, i) => (
                  <div key={i} className="analytics-table-row">
                    <span className="analytics-table-rank">#{i + 1}</span>
                    <span>{p.name}</span>
                    <span>{p.totalQuantity}</span>
                    <span>{p.orderCount}</span>
                    <span>{currency}{p.totalRevenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Sales Trends Tab ── */}
      {activeTab === "Sales Trends" && (
        <div className="analytics-section">
          <h2>Weekly Sales Trends</h2>
          <p className="analytics-subtitle">Last 7 days + 3 day AI forecast</p>

          {/* Summary cards */}
          <div className="analytics-summary">
            <div className="analytics-summary-card">
              <p className="analytics-summary-label">Total Revenue (7 days)</p>
              <p className="analytics-summary-value">
                {currency}{weeklySales.reduce((s, d) => s + d.revenue, 0).toLocaleString()}
              </p>
            </div>
            <div className="analytics-summary-card">
              <p className="analytics-summary-label">Total Orders (7 days)</p>
              <p className="analytics-summary-value">
                {weeklySales.reduce((s, d) => s + d.orders, 0)}
              </p>
            </div>
            <div className="analytics-summary-card">
              <p className="analytics-summary-label">Avg Daily Revenue</p>
              <p className="analytics-summary-value">
                {currency}{Math.round(weeklySales.reduce((s, d) => s + d.revenue, 0) / 7).toLocaleString()}
              </p>
            </div>
            {forecast.length > 0 && (
              <div className="analytics-summary-card forecast">
                <p className="analytics-summary-label">AI Forecast (next day)</p>
                <p className="analytics-summary-value">{currency}{forecast[0].toLocaleString()}</p>
              </div>
            )}
          </div>

          <div className="analytics-chart">
            <h3>Revenue Trend + Forecast</h3>
            <Line data={revenueData} options={chartOptions} />
          </div>
          <div className="analytics-chart">
            <h3>Daily Orders</h3>
            <Bar data={ordersData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* ── Inventory Tab ── */}
      {activeTab === "Inventory" && (
        <div className="analytics-section">
          <h2>Inventory Restocking Suggestions</h2>
          <p className="analytics-subtitle">Products ranked by sales velocity — restock High demand items first</p>

          <div className="analytics-legend">
            <span><span className="analytics-dot" style={{ background: "#22c55e" }}></span>High demand — restock urgently</span>
            <span><span className="analytics-dot" style={{ background: "#f59e0b" }}></span>Medium demand — monitor stock</span>
            <span><span className="analytics-dot" style={{ background: "#ff4141" }}></span>Low demand — no action needed</span>
          </div>

          <div className="analytics-table">
            <div className="analytics-table-header">
              <span>Product</span>
              <span>Category</span>
              <span>Type</span>
              <span>Units Sold</span>
              <span>Demand</span>
              <span>Action</span>
            </div>
            {inventory.map((p, i) => {
              const demand = getDemandLevel(p.totalSold, maxSold);
              return (
                <div key={i} className="analytics-table-row">
                  <span>{p.name}</span>
                  <span style={{ textTransform: "capitalize" }}>{p.category}</span>
                  <span>{p.type}</span>
                  <span>{p.totalSold}</span>
                  <span>
                    <span className="analytics-demand-badge" style={{ background: demand.color }}>
                      {demand.label}
                    </span>
                  </span>
                  <span className="analytics-action" style={{ color: demand.color }}>
                    {demand.label === "High" ? "🔴 Restock now" :
                     demand.label === "Medium" ? "🟡 Monitor" : "🟢 Sufficient"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;