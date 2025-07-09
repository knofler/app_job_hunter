"use client";

export default function JobSearchFilters() {
  return (
    <aside className="bg-white rounded-xl shadow p-6 mb-4">
      <div className="font-semibold mb-2">Filters</div>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked />
          Hide Viewed & Applied Jobs
        </label>
        <input className="border rounded px-2 py-1" placeholder="Search by keyword..." />
        <select className="border rounded px-2 py-1">
          <option>Sort by Match Score</option>
          <option>Sort by Date Posted</option>
          <option>Sort by Salary</option>
        </select>
      </div>
    </aside>
  );
}
