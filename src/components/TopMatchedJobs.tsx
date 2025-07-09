export default function TopMatchedJobs() {
  return (
    <div className="bg-white rounded-xl shadow p-6 mt-4">
      <div className="text-base font-semibold mb-2">Top Matched Jobs</div>
      <ul className="space-y-2">
        <li className="flex justify-between items-center p-2 bg-gray-50 rounded">
          <div>
            <div className="font-medium">Frontend Engineer</div>
            <div className="text-xs text-gray-500">Acme Corp • Remote</div>
          </div>
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">92% Match</span>
        </li>
        <li className="flex justify-between items-center p-2 bg-gray-50 rounded">
          <div>
            <div className="font-medium">Backend Developer</div>
            <div className="text-xs text-gray-500">Beta Inc • New York</div>
          </div>
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">88% Match</span>
        </li>
      </ul>
    </div>
  );
}
