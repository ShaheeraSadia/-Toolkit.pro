import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { BarChart3, RefreshCw, BarChart } from "lucide-react";
import { ActiveTab } from "../types";

export interface ToolUsageData {
  tool: ActiveTab;
  label: string;
  count: number;
  color: string;
}

interface UsageInsightsWidgetProps {
  usageData: ToolUsageData[];
  onReset: () => void;
  theme: "light" | "dark";
  onTabChange: (tab: ActiveTab) => void;
}

export default function UsageInsightsWidget({
  usageData,
  onReset,
  theme,
  onTabChange
}: UsageInsightsWidgetProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredBar, setHoveredBar] = useState<ToolUsageData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 320, height: 200 });

  // Handle resizing of the container using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Subtract padding
      const chartWidth = Math.max(width - 24, 250);
      setDimensions({
        width: chartWidth,
        height: 190
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || usageData.length === 0) return;

    // Clear previous SVG content to avoid overlap
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;
    const margin = { top: 10, right: 10, bottom: 35, left: 35 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X scale
    const x = d3
      .scaleBand()
      .domain(usageData.map((d) => d.label))
      .range([0, chartWidth])
      .padding(0.35);

    // Y scale
    const maxVal = d3.max(usageData, (d) => d.count) || 10;
    const y = d3
      .scaleLinear()
      .domain([0, maxVal + 1]) // Add some space above the tallest bar
      .range([chartHeight, 0]);

    // Grid lines
    g.append("g")
      .attr("class", "grid-lines")
      .style("stroke", theme === "dark" ? "rgba(51, 65, 85, 0.3)" : "rgba(226, 232, 240, 0.5)")
      .style("stroke-dasharray", "3,3")
      .call(
        d3.axisLeft(y)
          .tickSize(-chartWidth)
          .tickFormat(() => "")
      )
      .call((g) => g.select(".domain").remove()); // Remove border line

    // X Axis
    const xAxis = d3.axisBottom(x);
    const xAxisGroup = g
      .append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(xAxis);

    // Style X Axis ticks and labels
    xAxisGroup.select(".domain")
      .style("stroke", theme === "dark" ? "rgba(71, 85, 105, 0.4)" : "rgba(203, 213, 225, 0.6)");

    xAxisGroup.selectAll("line")
      .style("stroke", theme === "dark" ? "rgba(71, 85, 105, 0.4)" : "rgba(203, 213, 225, 0.6)");

    xAxisGroup.selectAll("text")
      .style("fill", theme === "dark" ? "#94a3b8" : "#64748b")
      .style("font-size", "9px")
      .style("font-family", "system-ui, sans-serif")
      .attr("dy", "8px");

    // Y Axis
    const yAxis = d3.axisLeft(y).ticks(5).tickFormat(d3.format("d"));
    const yAxisGroup = g.append("g").call(yAxis);

    yAxisGroup.select(".domain")
      .style("stroke", theme === "dark" ? "rgba(71, 85, 105, 0.4)" : "rgba(203, 213, 225, 0.6)");

    yAxisGroup.selectAll("line")
      .style("stroke", theme === "dark" ? "rgba(71, 85, 105, 0.4)" : "rgba(203, 213, 225, 0.6)");

    yAxisGroup.selectAll("text")
      .style("fill", theme === "dark" ? "#94a3b8" : "#64748b")
      .style("font-size", "9px")
      .style("font-family", "ui-monospace, monospace");

    // Render original styled bars
    const bars = g
      .selectAll(".bar")
      .data(usageData)
      .enter()
      .append("g")
      .attr("class", "bar-group");

    // Add bars with gradients/colors
    bars
      .append("rect")
      .attr("class", "bar-rect")
      .attr("x", (d) => x(d.label) || 0)
      .attr("width", x.bandwidth())
      .attr("y", chartHeight) // Start transition from basement
      .attr("height", 0)
      .attr("rx", 5) // Rounded corners
      .attr("ry", 5)
      .style("fill", (d) => d.color)
      .style("opacity", 0.82)
      .attr("cursor", "pointer")
      .on("mouseover", (event, d) => {
        setHoveredBar(d);
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .style("opacity", 1)
          .style("transform", "scaleY(1.025)")
          .style("transform-origin", `${(x(d.label) || 0) + x.bandwidth() / 2}px ${chartHeight}px`);
      })
      .on("mouseleave", (event, d) => {
        setHoveredBar(null);
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .style("opacity", 0.82)
          .style("transform", "scaleY(1)")
          .style("transform-origin", `${(x(d.label) || 0) + x.bandwidth() / 2}px ${chartHeight}px`);
      })
      .on("click", (event, d) => {
        onTabChange(d.tool);
        const el = document.getElementById(`tab-select-${d.tool}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      })
      .transition()
      .delay((_, i) => i * 40)
      .duration(600)
      .ease(d3.easeCubicOut)
      .attr("y", (d) => y(d.count))
      .attr("height", (d) => chartHeight - y(d.count));

    // Dynamic numeric text overlays on top of the bars
    bars
      .append("text")
      .attr("x", (d) => (x(d.label) || 0) + x.bandwidth() / 2)
      .attr("y", chartHeight)
      .attr("text-anchor", "middle")
      .style("fill", theme === "dark" ? "#e2e8f0" : "#334155")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("font-family", "ui-monospace, monospace")
      .style("opacity", 0)
      .text((d) => d.count)
      .transition()
      .delay((_, i) => i * 40 + 200)
      .duration(600)
      .ease(d3.easeCubicOut)
      .attr("y", (d) => y(d.count) - 5)
      .style("opacity", (d) => (d.count > 0 ? 1 : 0));

  }, [usageData, dimensions, theme]);

  return (
    <div 
      className={`rounded-2xl border p-4 sm:p-5 h-full transition-all duration-200 flex flex-col justify-between ${
        theme === "dark"
          ? "bg-slate-900/60 border-slate-800/80 shadow-md shadow-slate-950/20"
          : "bg-white border-slate-200/50 shadow-xs"
      }`}
      id="dashboard-usage-insights-widget"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/45 text-emerald-605 dark:text-emerald-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Workspace Usage Insights
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              D3 visualization of your most frequent tool operations
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-100 dark:hover:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
          title="Reset analytics log"
        >
          <RefreshCw className="w-3 h-3 text-slate-450" />
          <span className="hidden sm:inline">Reset Map</span>
        </button>
      </div>

      {/* Bar Chart Canvas Zone */}
      <div 
        ref={containerRef} 
        className="w-full flex-1 flex flex-col items-center justify-center relative min-h-[190px] pt-1"
        id="d3-usage-chart-container"
      >
        <svg 
          ref={svgRef} 
          width={dimensions.width} 
          height={dimensions.height}
          className="overflow-visible"
        />

        {/* Dynamic Hover Tooltip display HUD */}
        {hoveredBar && (
          <div 
            className="absolute bottom-1 bg-slate-950 dark:bg-slate-900 border border-slate-850 text-white rounded-lg px-2.5 py-1.5 text-[10px] shadow-lg flex items-center gap-2 pointer-events-none animate-in fade-in duration-100"
            style={{
              left: "50%",
              transform: "translateX(-50%)"
            }}
          >
            <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: hoveredBar.color }} />
            <span className="font-bold">{hoveredBar.label}:</span>
            <span className="font-mono text-emerald-400 font-extrabold">{hoveredBar.count} sessions</span>
          </div>
        )}
      </div>

      {/* Visual legends breakdown */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 pt-3 mt-2 border-t border-slate-100/40 dark:border-slate-800/20">
        {usageData.map((d) => (
          <button
            key={d.tool}
            onClick={() => {
              onTabChange(d.tool);
              const el = document.getElementById(`tab-select-${d.tool}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950/45 transition-colors text-center cursor-pointer"
          >
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 capitalize truncate max-w-[50px]">
                {d.label}
              </span>
            </div>
            <span className="text-[9px] font-mono font-extrabold text-slate-450 mt-0.5">
              {d.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
