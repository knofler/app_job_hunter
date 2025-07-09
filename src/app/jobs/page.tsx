"use client";
import { useState } from "react";

const mockJobs = [
  {
    id: 6,
    title: "Backend Developer",
    company: "Cloudify",
    location: "Austin, TX",
    status: "Draft",
    resume: "Software Engineer Resume",
    appliedDate: "2025-07-01",
    updatedDate: "2025-07-06",
    description: `Develop scalable backend services and APIs.`,
    details: `Job Title: Backend Developer\nCompany: Cloudify\nLocation: Austin, TX\n\nResponsibilities:\n- Build RESTful APIs\n- Optimize server performance\n- Collaborate with frontend teams\n\nRequirements:\n- Node.js\n- Cloud experience\n\nStatus: Draft\nResume Used: Software Engineer Resume`,
  },
  {
    id: 7,
    title: "UI/UX Designer",
    company: "DesignPro",
    location: "Remote",
    status: "Shortlisted",
    resume: "UX Designer Resume",
    appliedDate: "2025-07-02",
    updatedDate: "2025-07-07",
    description: `Design user interfaces and improve user experience for web apps.`,
    details: `Job Title: UI/UX Designer\nCompany: DesignPro\nLocation: Remote\n\nResponsibilities:\n- Design wireframes\n- Conduct user research\n- Collaborate with developers\n\nRequirements:\n- Figma\n- UX research\n\nStatus: Shortlisted\nResume Used: UX Designer Resume`,
  },
  {
    id: 8,
    title: "Sales Executive",
    company: "SalesForceX",
    location: "Chicago, IL",
    status: "Applied",
    resume: "Sales Resume",
    appliedDate: "2025-07-03",
    updatedDate: "2025-07-07",
    description: `Drive B2B sales and manage client relationships.`,
    details: `Job Title: Sales Executive\nCompany: SalesForceX\nLocation: Chicago, IL\n\nResponsibilities:\n- Manage sales pipeline\n- Close deals\n- Build client relationships\n\nRequirements:\n- CRM experience\n- Excellent communication\n\nStatus: Applied\nResume Used: Sales Resume`,
  },
  {
    id: 9,
    title: "Content Strategist",
    company: "Contentify",
    location: "Remote",
    status: "Draft",
    resume: "Content Writer Resume",
    appliedDate: "2025-07-04",
    updatedDate: "2025-07-07",
    description: `Plan and create content strategies for digital platforms.`,
    details: `Job Title: Content Strategist\nCompany: Contentify\nLocation: Remote\n\nResponsibilities:\n- Develop content plans\n- Oversee content creation\n- Analyze engagement\n\nRequirements:\n- SEO\n- Content marketing\n\nStatus: Draft\nResume Used: Content Writer Resume`,
  },
  {
    id: 10,
    title: "Finance Analyst",
    company: "FinEdge",
    location: "New York, NY",
    status: "Interview Round 1",
    resume: "Finance Resume",
    appliedDate: "2025-07-05",
    updatedDate: "2025-07-07",
    description: `Analyze financial data and support business decisions.`,
    details: `Job Title: Finance Analyst\nCompany: FinEdge\nLocation: New York, NY\n\nResponsibilities:\n- Analyze financial reports\n- Forecast trends\n- Advise management\n\nRequirements:\n- Excel\n- Financial modeling\n\nStatus: Interview Round 1\nResume Used: Finance Resume`,
  },
  {
    id: 1,
    title: "Frontend Engineer",
    company: "Acme Corp",
    location: "Remote",
    status: "Applied",
    resume: "Software Engineer Resume",
    appliedDate: "2025-07-01",
    updatedDate: "2025-07-07",
    description: `Work on modern React apps. Collaborate with product and design teams.`,
    details: `Job Title: Frontend Engineer\nCompany: Acme Corp\nLocation: Remote\n\nResponsibilities:\n- Build and maintain React applications\n- Work with designers and product managers\n- Write clean, maintainable code\n\nRequirements:\n- 3+ years experience with React\n- TypeScript\n- CSS/SCSS\n\nStatus: Applied\nResume Used: Software Engineer Resume`,
  },
  {
    id: 2,
    title: "Product Manager",
    company: "Beta Inc",
    location: "New York",
    status: "Interview Round 1",
    resume: "Product Manager Resume",
    appliedDate: "2025-07-02",
    updatedDate: "2025-07-07",
    description: `Lead product teams and manage the product lifecycle.`,
    details: `Job Title: Product Manager\nCompany: Beta Inc\nLocation: New York\n\nResponsibilities:\n- Lead product teams\n- Manage product lifecycle\n- Define product vision\n\nRequirements:\n- 2+ years experience as PM\n- Agile/Scrum\n\nStatus: Interview Round 1\nResume Used: Product Manager Resume`,
  },
  {
    id: 3,
    title: "Data Scientist",
    company: "DataWorks",
    location: "Remote",
    status: "Shortlisted",
    resume: "Data Scientist Resume",
    appliedDate: "2025-07-03",
    updatedDate: "2025-07-07",
    description: `Analyze data and build ML models.`,
    details: `Job Title: Data Scientist\nCompany: DataWorks\nLocation: Remote\n\nResponsibilities:\n- Analyze data\n- Build ML models\n- Present insights\n\nRequirements:\n- Python\n- Machine Learning\n\nStatus: Shortlisted\nResume Used: Data Scientist Resume`,
  },
  {
    id: 4,
    title: "Marketing Specialist",
    company: "BrandBoost",
    location: "San Francisco",
    status: "Draft",
    resume: "Marketing Resume",
    appliedDate: "2025-07-04",
    updatedDate: "2025-07-07",
    description: `Drive digital marketing campaigns.`,
    details: `Job Title: Marketing Specialist\nCompany: BrandBoost\nLocation: San Francisco\n\nResponsibilities:\n- Drive digital marketing campaigns\n- SEO/SEM\n- Content strategy\n\nRequirements:\n- 2+ years in marketing\n- SEO/SEM\n\nStatus: Draft\nResume Used: Marketing Resume`,
  },
  {
    id: 5,
    title: "HR Manager",
    company: "PeopleFirst",
    location: "Remote",
    status: "Phone Interview",
    resume: "HR Resume",
    appliedDate: "2025-07-05",
    updatedDate: "2025-07-07",
    description: `Manage HR operations and talent acquisition.`,
    details: `Job Title: HR Manager\nCompany: PeopleFirst\nLocation: Remote\n\nResponsibilities:\n- Manage HR operations\n- Talent acquisition\n- Employee engagement\n\nRequirements:\n- 3+ years in HR\n- Talent acquisition\n\nStatus: Phone Interview\nResume Used: HR Resume`,
  },
];

const statusColors: Record<string, string> = {
  "Applied": "bg-blue-100 text-blue-800 border-blue-200",
  "Draft": "bg-gray-100 text-gray-700 border-gray-300",
  "Shortlisted": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Interview Round 1": "bg-green-100 text-green-800 border-green-200",
  "Phone Interview": "bg-purple-100 text-purple-800 border-purple-200",
};

export default function JobsPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedJob = mockJobs.find(j => j.id === selectedId) || mockJobs[0];

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 flex flex-col md:flex-row gap-8">
      {/* Left: Job List */}
      <div className="w-full md:w-1/2">
        <h1 className="text-2xl font-bold mb-6">Your Jobs</h1>
        <ul className="flex flex-col gap-2">
          {mockJobs.map(job => (
            <li
              key={job.id}
              className={`bg-white rounded-lg px-4 py-3 flex flex-col items-start shadow transition-all duration-200 cursor-pointer ${selectedId === job.id ? "ring-2 ring-blue-400" : ""}`}
              style={{ minHeight: 48 }}
              onClick={() => setSelectedId(job.id)}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="font-semibold flex-1 text-gray-900">{job.title}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColors[job.status] || "bg-gray-100 text-gray-700 border-gray-300"}`}>{job.status}</span>
              </div>
              <div className="text-sm text-gray-700 mb-1 mt-1">{job.company} • {job.location}</div>
              <div className="text-xs text-gray-500">Resume: <span className="font-semibold text-blue-700">{job.resume}</span></div>
              <div className="text-xs text-gray-400 mt-1">
                {job.status && job.status.toLowerCase().includes("interview") && job.updatedDate ? (
                  <span>Interview: <span className="font-semibold">{job.updatedDate}</span></span>
                ) : job.appliedDate ? (
                  <span>Applied: <span className="font-semibold">{job.appliedDate}</span></span>
                ) : job.updatedDate ? (
                  <span>Updated: <span className="font-semibold">{job.updatedDate}</span></span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Right: Job Preview */}
      <div className="w-full md:w-1/2">
        <div className="bg-white border-2 border-blue-200 rounded-lg p-6 shadow-sm min-h-[300px]">
          <div className="mb-2 font-semibold text-blue-900 text-lg">{selectedJob.title}</div>
          <div className="mb-2 text-gray-700">{selectedJob.company} • {selectedJob.location}</div>
          <div className="mb-2 font-semibold text-blue-900">Job Description</div>
          <div className="mb-3 text-gray-800">{selectedJob.description}</div>
          <div className="mb-2 font-semibold text-blue-900">Details</div>
          <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-700 whitespace-pre-line overflow-x-auto">{selectedJob.details}</pre>
        </div>
      </div>
    </div>
  );
}
