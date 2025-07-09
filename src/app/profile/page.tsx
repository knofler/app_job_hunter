export default function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <span className="font-semibold">Name:</span> Ambitious Alex
        </div>
        <div className="mb-4">
          <span className="font-semibold">Email:</span> alex@example.com
        </div>
        <div className="mb-4">
          <span className="font-semibold">Current Resume:</span>
          <div className="bg-gray-100 rounded p-3 mt-2">
            <div className="font-semibold">Software Engineer Resume</div>
            <div className="text-xs text-gray-500 mb-2">Type: Technical</div>
            <div className="text-sm text-gray-700">Summary: 5+ years experience in full-stack development, React, Node.js, and cloud platforms. Proven track record of delivering scalable web applications.</div>
          </div>
        </div>
        <div>
          <span className="font-semibold">Resume Preview:</span>
          <pre className="bg-gray-50 rounded p-3 text-xs mt-2 overflow-x-auto">
{`John Doe
Software Engineer

Summary:
Experienced software engineer with a passion for building scalable web applications. Skilled in React, Node.js, and AWS.

Experience:
- Acme Corp (2019-2024): Senior Frontend Engineer
- Beta Inc (2017-2019): Full Stack Developer

Education:
- B.Sc. in Computer Science, Tech University
`}
          </pre>
        </div>
      </div>
    </div>
  );
}
