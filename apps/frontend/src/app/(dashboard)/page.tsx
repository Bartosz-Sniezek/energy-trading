"use client";

import { PriceFeedDashboard } from "./feed-dashboard";

export default function Dashboard() {
  return <PriceFeedDashboard instruments={["NG", "CL", "BZ", "RB", "HO"]} />;
}
