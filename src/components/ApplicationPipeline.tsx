export default function ApplicationPipeline() {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="text-base font-semibold mb-4">Application Pipeline</div>
      <div className="flex gap-4 overflow-x-auto">
        <div className="flex-1 min-w-[120px]">
          <div className="font-bold mb-2">Saved Jobs</div>
          <div className="bg-gray-100 rounded p-2 min-h-[60px]">2 jobs</div>
        </div>
        <div className="flex-1 min-w-[120px]">
          <div className="font-bold mb-2">Applied</div>
          <div className="bg-gray-100 rounded p-2 min-h-[60px]">1 job</div>
        </div>
        <div className="flex-1 min-w-[120px]">
          <div className="font-bold mb-2">Interviewing</div>
          <div className="bg-gray-100 rounded p-2 min-h-[60px]">0 jobs</div>
        </div>
        <div className="flex-1 min-w-[120px]">
          <div className="font-bold mb-2">Offer</div>
          <div className="bg-gray-100 rounded p-2 min-h-[60px]">0 jobs</div>
        </div>
      </div>
    </div>
  );
}
