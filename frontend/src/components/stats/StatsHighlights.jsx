import React, { useMemo } from "react";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import StatsSummaryCard from "./StatsSummaryCard";

const DEFAULT_ICONS = [
  EmojiEventsRoundedIcon,
  EventAvailableRoundedIcon,
  InsightsRoundedIcon,
  WarningAmberRoundedIcon,
];

const LABEL_ICON_MAP = {
  rozetler: EmojiEventsRoundedIcon,
  "son aktivite": EventAvailableRoundedIcon,
  "en güçlü kategori": InsightsRoundedIcon,
  "zorlandığın kategori": WarningAmberRoundedIcon,
  xp: LeaderboardRoundedIcon,
};

const ACCENT_CYCLE = ["primary", "success", "warning", "danger"];

const StatsHighlights = ({ items = [] }) => {
  const enhancedItems = useMemo(
    () =>
      items.map((item, index) => {
        const normalizedLabel =
          typeof item.label === "string" ? item.label.trim().toLowerCase() : "";

        const IconComponent =
          item.icon ||
          LABEL_ICON_MAP[normalizedLabel] ||
          DEFAULT_ICONS[index % DEFAULT_ICONS.length] ||
          LeaderboardRoundedIcon;

        return {
          ...item,
          accent: item.accent || ACCENT_CYCLE[index % ACCENT_CYCLE.length],
          icon: <IconComponent fontSize="medium" />,
        };
      }),
    [items]
  );

  if (!enhancedItems.length) return null;

  return (
    <section className="stats-section">
      <div className="section-heading-row">
        <h2 className="section-heading">Öne Çıkanlar</h2>
        <span className="text-secondary stats-section__hint">
          Son aktivitene göre öneriler
        </span>
      </div>
      <div className="stats-highlights-grid">
        {enhancedItems.map((item) => (
          <StatsSummaryCard
            key={item.label}
            label={item.label}
            value={item.value}
            helper={item.helper}
            icon={item.icon}
            accent={item.accent}
          />
        ))}
      </div>
    </section>
  );
};

export default StatsHighlights;
