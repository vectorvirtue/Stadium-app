import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import styles from "./SalesByCategory.module.css";

// Fallback placeholder data — replace with backend response
const PLACEHOLDER = [
  { name: "Regular", sold: 1400, capacity: 3100, soldColor: "#026FB6", bgColor: "#D6EAF8" },
  { name: "Premium", sold: 686,  capacity: 2000, soldColor: "#FD7E14", bgColor: "#FEF3DC" },
  { name: "VIP",     sold: 6,    capacity: 212,  soldColor: "#DEDA19", bgColor: "#F3F9DC" },
];

// Derive remaining from capacity - sold
function prepareData(raw) {
  return raw.map((d) => ({
    ...d,
    remaining: Math.max(0, d.capacity - d.sold),
  }));
}

// Round up to the next clean interval and generate 5 ticks
function getAxisConfig(data) {
  const maxVal = Math.max(...data.map((d) => d.capacity));
  // Pick a clean interval: round max up to nearest multiple of 1500 or auto-scale
  const rawInterval = maxVal / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
  const interval = Math.ceil(rawInterval / magnitude) * magnitude;
  const domainMax = interval * 4;
  const ticks = [0, interval, interval * 2, interval * 3, domainMax];
  return { domainMax, ticks };
}

// Label pill with downward arrow tip rendered above the sold bar
function TopLabel({ x, y, width, value, index, data }) {
  if (!value) return null;
  const color = data[index]?.soldColor ?? "#026FB6";
  const cx = x + width / 2;
  const pillW = 48;
  const pillH = 20;
  const pillX = cx - pillW / 2;
  const pillY = y - pillH - 8;
  const tipSize = 5;

  return (
    <g>
      {/* Pill background */}
      <rect x={pillX} y={pillY} width={pillW} height={pillH} rx={5} fill={color} />
      {/* Downward arrow tip */}
      <polygon
        points={`${cx - tipSize},${pillY + pillH} ${cx + tipSize},${pillY + pillH} ${cx},${pillY + pillH + tipSize}`}
        fill={color}
      />
      {/* Value text */}
      <text
        x={cx}
        y={pillY + pillH / 2 + 4}
        fill="#fff"
        textAnchor="middle"
        fontSize={10}
        fontFamily="Manrope, sans-serif"
        fontWeight={600}
      >
        {Number(value).toLocaleString()}
      </text>
    </g>
  );
}

function CustomLegend({ data }) {
  return (
    <div className={styles.legend}>
      {data.map((d) => (
        <div key={d.name} className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: d.soldColor }} />
          <span className={styles.legendLabel}>{d.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function SalesByCategory({ data = PLACEHOLDER, matches, selectedMatchId, onSelectMatch }) {
  const chartData = prepareData(data);
  const { domainMax, ticks } = getAxisConfig(data);
  const canPickMatch = Array.isArray(matches) && matches.length > 0 && typeof onSelectMatch === "function";

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.title}>Sales by Ticket Category</span>
        {canPickMatch ? (
          <span className={styles.subtitleWrap}>
            <select
              className={styles.subtitleSelect}
              value={selectedMatchId || ""}
              onChange={(e) => onSelectMatch(e.target.value)}
              aria-label="Choose which match's sales to show"
            >
              {matches.map((m) => <option key={m.id} value={m.id}>{m.title} · {new Date(m.kickoff_at).getFullYear()}</option>)}
            </select>
            <span className={styles.subtitleArrow} aria-hidden="true">▾</span>
          </span>
        ) : (
          <span className={styles.subtitle}>vs Warri Wolves 2025 ▾</span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 36, right: 24, left: 0, bottom: 8 }}
          barCategoryGap="20%"
          barSize={80}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontFamily: "Manrope, sans-serif", fontSize: 11, fill: "#888" }}
          />
          <YAxis
            domain={[0, domainMax]}
            ticks={ticks}
            axisLine={false}
            tickLine={false}
            tick={{ fontFamily: "Manrope, sans-serif", fontSize: 11, fill: "#888" }}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "transparent" }}
            contentStyle={{
              borderRadius: 8,
              fontFamily: "Manrope, sans-serif",
              fontSize: 12,
              border: "1px solid #e5e7eb",
            }}
            formatter={(value, name) => [Number(value).toLocaleString(), name === "sold" ? "Sold" : "Remaining"]}
          />

          {/* 
            Stack order: sold (bottom) → remaining (top as faded cap)
            This makes the bar fill from bottom upward,
            with the light colour showing unfilled capacity at the top
          */}
          <Bar dataKey="sold" stackId="a" radius={[0, 0, 4, 4]}>
            {chartData.map((d, i) => (
              <Cell key={d.name} fill={d.soldColor} />
            ))}
            <LabelList
              dataKey="sold"
              content={(props) => (
                <TopLabel {...props} data={chartData} />
              )}
            />
          </Bar>

          <Bar dataKey="remaining" stackId="a" radius={[4, 4, 0, 0]}>
            {chartData.map((d) => (
              <Cell key={d.name} fill={d.bgColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <CustomLegend data={data} />
    </div>
  );
}
