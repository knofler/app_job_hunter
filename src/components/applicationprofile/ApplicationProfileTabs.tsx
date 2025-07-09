import { useState } from "react";
import OverviewTab from "./OverviewTab";
import MyFitAnalysisTab from "./MyFitAnalysisTab";
import ApplicationJourneyTab from "./ApplicationJourneyTab";

const tabs = ["Overview", "My Fit Analysis", "Application Journey"];

export default function ApplicationProfileTabs() {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex gap-4 mb-4 border-b">
        {tabs.map((tab, idx) => (
          <button
            key={tab}
            className={`pb-2 px-2 font-semibold border-b-2 transition-colors ${activeTab === idx ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
            onClick={() => setActiveTab(idx)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div>
        {activeTab === 0 && <OverviewTab />}
        {activeTab === 1 && <MyFitAnalysisTab />}
        {activeTab === 2 && <ApplicationJourneyTab />}
      </div>
    </div>
  );
}
