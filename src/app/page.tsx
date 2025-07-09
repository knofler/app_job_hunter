

"use client";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-md flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Upload Your Resume</h1>
        <form className="flex flex-col gap-4 w-full" onSubmit={e => e.preventDefault()}>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="border rounded px-3 py-2"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            disabled
          >
            Upload (API coming soon)
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-4">PDF and DOCX files only. Dashboard is available at <code className='bg-gray-100 px-1 rounded'>/dashboard</code>.</p>
      </div>
    </div>
  );
}
