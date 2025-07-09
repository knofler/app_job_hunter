"use client";
import { useState } from "react";
// Fast mock versions for dashboard widgets (no fetch, instant load)
function ResumeHealthCard() {
  const score = 87;
  const subScores = [
	{ label: "ATS", value: 90 },
	{ label: "Skills", value: 85 },
	{ label: "Format", value: 80 },
  ];
  return (
	<div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
	  <div className="text-3xl font-bold text-blue-600">{score}/100</div>
	  <div className="text-sm text-gray-500 mb-4">Resume Health</div>
	  <div className="flex gap-4">
		{subScores.map((sub) => (
		  <div key={sub.label} className="flex flex-col items-center cursor-pointer">
			<div className="text-lg font-semibold">{sub.value}</div>
			<div className="text-xs text-gray-400">{sub.label}</div>
		  </div>
		))}
	  </div>
	</div>
  );
}

const aiActionsByResume: Record<number, { id: number; text: string }[]> = {
  1: [
	{ id: 1, text: "Tailor your resume for backend roles" },
	{ id: 2, text: "Highlight React and Node.js projects" },
	{ id: 3, text: "Showcase cloud deployments" },
	{ id: 4, text: "Add TypeScript and API experience" },
	{ id: 5, text: "Quantify project impact/results" },
	{ id: 6, text: "Include open source contributions" },
  ],
  2: [
	{ id: 1, text: "Add more product metrics" },
	{ id: 2, text: "Showcase leadership in cross-functional teams" },
	{ id: 3, text: "Highlight agile project delivery" },
	{ id: 4, text: "Include roadmap planning examples" },
	{ id: 5, text: "Demonstrate user research insights" },
	{ id: 6, text: "Show product launch outcomes" },
  ],
  3: [
	{ id: 1, text: "Emphasize ML model deployments" },
	{ id: 2, text: "Add recent data visualization work" },
	{ id: 3, text: "Highlight Python and SQL skills" },
	{ id: 4, text: "Showcase business impact of analytics" },
	{ id: 5, text: "Include Kaggle or competition results" },
	{ id: 6, text: "Mention cloud ML platforms used" },
  ],
  4: [
	{ id: 1, text: "Show campaign ROI results" },
	{ id: 2, text: "Highlight digital marketing certifications" },
	{ id: 3, text: "Add SEO/SEM campaign examples" },
	{ id: 4, text: "Include content strategy wins" },
	{ id: 5, text: "Showcase social media growth" },
	{ id: 6, text: "Mention analytics tools used" },
  ],
  5: [
	{ id: 1, text: "Add financial modeling skills" },
	{ id: 2, text: "Showcase cost-saving initiatives" },
	{ id: 3, text: "Highlight forecasting experience" },
	{ id: 4, text: "Include budgeting and planning" },
	{ id: 5, text: "Demonstrate reporting automation" },
	{ id: 6, text: "Mention regulatory compliance" },
  ],
  6: [
	{ id: 1, text: "Showcase UI/UX case studies" },
	{ id: 2, text: "Add Figma/Sketch projects" },
	{ id: 3, text: "Highlight user testing results" },
	{ id: 4, text: "Include accessibility improvements" },
	{ id: 5, text: "Show design system contributions" },
	{ id: 6, text: "Mention mobile-first design" },
  ],
  7: [
	{ id: 1, text: "Highlight CI/CD pipelines" },
	{ id: 2, text: "Add cloud automation experience" },
	{ id: 3, text: "Showcase infrastructure as code" },
	{ id: 4, text: "Include monitoring/alerting tools" },
	{ id: 5, text: "Demonstrate cost optimization" },
	{ id: 6, text: "Mention container orchestration" },
  ],
  8: [
	{ id: 1, text: "Show sales targets achieved" },
	{ id: 2, text: "Add CRM tools expertise" },
	{ id: 3, text: "Highlight B2B client wins" },
	{ id: 4, text: "Include sales funnel improvements" },
	{ id: 5, text: "Showcase negotiation skills" },
	{ id: 6, text: "Mention sales awards" },
  ],
  9: [
	{ id: 1, text: "Highlight talent acquisition wins" },
	{ id: 2, text: "Showcase HRIS implementation" },
	{ id: 3, text: "Add employee engagement programs" },
	{ id: 4, text: "Include onboarding process improvements" },
	{ id: 5, text: "Showcase diversity initiatives" },
	{ id: 6, text: "Mention compliance training" },
  ],
  10: [
	{ id: 1, text: "Showcase content strategy results" },
	{ id: 2, text: "Add SEO/SEM certifications" },
	{ id: 3, text: "Highlight blog/whitepaper reach" },
	{ id: 4, text: "Include content calendar planning" },
	{ id: 5, text: "Showcase cross-channel campaigns" },
	{ id: 6, text: "Mention analytics/reporting tools" },
  ],
};

function SuggestedActions({ selectedResume }: { selectedResume: number | null }) {
  const actions = selectedResume && aiActionsByResume[selectedResume]
	? aiActionsByResume[selectedResume]
	: [
		{ id: 1, text: "Update your resume with latest skills" },
		{ id: 2, text: "Apply to 2 new jobs this week" },
		{ id: 3, text: "Review interview questions for Data Scientist" },
	  ];
  return (
	<div className="bg-white rounded-xl shadow p-6">
	  <div className="text-base font-semibold mb-2">Top AI-Suggested Actions</div>
	  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
		{actions.map((action) => (
		  <li key={action.id}>{action.text}</li>
		))}
	  </ul>
	</div>
  );
}

function ApplicationPipeline({ selectedResume }: { selectedResume: number | null }) {
  // Count jobs by status for the selected resume
  const filteredJobs = selectedResume
	? mockJobs.filter((job) => job.resume === selectedResume)
	: mockJobs;
  const statusCount = {
	Saved: filteredJobs.filter((j) => j.status === "Draft").length,
	Applied: filteredJobs.filter((j) => j.status === "Applied").length,
	Interviewing: filteredJobs.filter((j) => j.status.includes("Interview")).length,
	Offer: filteredJobs.filter((j) => j.status === "Offer").length,
  };
  return (
	<div className="bg-white rounded-xl shadow p-6">
	  <div className="text-base font-semibold mb-4">Application Pipeline</div>
	  <div className="flex gap-4 overflow-x-auto">
		<div className="flex-1 min-w-[120px]">
		  <div className="font-bold mb-2">Saved Jobs</div>
		  <div className="bg-gray-100 rounded p-2 min-h-[60px]">{statusCount.Saved} jobs</div>
		</div>
		<div className="flex-1 min-w-[120px]">
		  <div className="font-bold mb-2">Applied</div>
		  <div className="bg-gray-100 rounded p-2 min-h-[60px]">{statusCount.Applied} jobs</div>
		</div>
		<div className="flex-1 min-w-[120px]">
		  <div className="font-bold mb-2">Interviewing</div>
		  <div className="bg-gray-100 rounded p-2 min-h-[60px]">{statusCount.Interviewing} jobs</div>
		</div>
		<div className="flex-1 min-w-[120px]">
		  <div className="font-bold mb-2">Offer</div>
		  <div className="bg-gray-100 rounded p-2 min-h-[60px]">{statusCount.Offer} jobs</div>
		</div>
	  </div>
	</div>
  );
}

const mockResumes = [
  { id: 1, name: "Software Engineer Resume", lastUpdated: "2025-07-01", summary: "5+ years experience in full-stack development, React, Node.js, and cloud platforms.", skills: ["React.js", "Node.js", "AWS"] },
  { id: 2, name: "Product Manager Resume", lastUpdated: "2025-06-28", summary: "Experienced in product lifecycle, agile, and cross-functional teams.", skills: ["Product Strategy", "Agile/Scrum", "Roadmapping"] },
  { id: 3, name: "Data Scientist Resume", lastUpdated: "2025-07-05", summary: "Expert in Python, ML, and data visualization.", skills: ["Python", "Machine Learning", "Data Visualization"] },
  { id: 4, name: "Marketing Resume", lastUpdated: "2025-06-30", summary: "Digital marketing specialist with SEO/SEM expertise.", skills: ["SEO", "SEM", "Content Strategy"] },
  { id: 5, name: "Finance Resume", lastUpdated: "2025-07-03", summary: "Financial analyst with strong modeling skills.", skills: ["Financial Modeling", "Forecasting", "Excel"] },
  { id: 6, name: "UX Designer Resume", lastUpdated: "2025-07-02", summary: "UX/UI designer with a focus on accessibility.", skills: ["UX Design", "UI Design", "Accessibility"] },
  { id: 7, name: "DevOps Resume", lastUpdated: "2025-06-29", summary: "DevOps engineer with CI/CD and cloud automation.", skills: ["CI/CD", "Cloud Automation", "Docker"] },
  { id: 8, name: "Sales Resume", lastUpdated: "2025-07-04", summary: "Top-performing sales executive in SaaS.", skills: ["SaaS Sales", "CRM", "Negotiation"] },
  { id: 9, name: "HR Resume", lastUpdated: "2025-06-27", summary: "HR manager with talent acquisition expertise.", skills: ["Talent Acquisition", "Employee Engagement", "Compliance"] },
  { id: 10, name: "Content Writer Resume", lastUpdated: "2025-07-06", summary: "Content writer with published work in tech.", skills: ["Content Writing", "Editing", "Blogging"] },
];

const mockJobs = [
  { id: 1, title: "Frontend Engineer", status: "Applied", resume: 1 },
  { id: 2, title: "Product Manager", status: "Interview Round 1", resume: 2 },
  { id: 3, title: "Data Scientist", status: "Shortlisted", resume: 3 },
  { id: 4, title: "Marketing Specialist", status: "Draft", resume: 4 },
  { id: 5, title: "HR Manager", status: "Phone Interview", resume: 9 },
  { id: 6, title: "Backend Developer", status: "Draft", resume: 1 },
  { id: 7, title: "UI/UX Designer", status: "Shortlisted", resume: 6 },
  { id: 8, title: "Sales Executive", status: "Applied", resume: 8 },
  { id: 9, title: "Content Strategist", status: "Draft", resume: 10 },
  { id: 10, title: "Finance Analyst", status: "Interview Round 1", resume: 5 },
];


export default function Dashboard() {

  const [selectedResume, setSelectedResume] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);

  return (
	<div className="max-w-7xl mx-auto py-10 px-4 flex flex-col gap-8">
	  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
		<div className="col-span-1 flex flex-col gap-6">
		  <ResumeHealthCard />
		  <SuggestedActions selectedResume={selectedResume} />
		</div>
		<div className="col-span-2 flex flex-col gap-6">
		  <ApplicationPipeline selectedResume={selectedResume} />
		  <div className="flex flex-col md:flex-row gap-8">
			{/* Left: Resume List */}
			<div className="w-full md:w-1/2">
			  <h1 className="text-2xl font-bold mb-6">Your Resumes</h1>
			  <ul className="flex flex-col gap-2">
				{mockResumes.map((resume) => (
				  <li
					key={resume.id}
					className={`bg-white border border-blue-100 rounded-lg px-4 py-3 flex flex-col shadow transition-all duration-200 cursor-pointer ${
					  selectedResume === resume.id ? "ring-2 ring-blue-400" : ""
					}`}
					style={{ minHeight: 48 }}
					onClick={() => setSelectedResume(resume.id)}
				  >
					<span className="font-semibold text-gray-900">{resume.name}</span>
					<span className="text-xs text-gray-500 mt-1">Last updated: <span className="font-semibold text-blue-700">{resume.lastUpdated}</span></span>
					<span className="text-xs text-gray-700 mt-1">{resume.summary}</span>
					<div className="flex flex-wrap gap-2 mt-1">
					  {resume.skills.slice(0, 3).map(skill => (
						<span key={skill} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium border border-blue-200">{skill}</span>
					  ))}
					</div>
				  </li>
				))}
			  </ul>
			</div>
			{/* Right: Jobs List - Branch Connector Pattern */}
			<div className="w-full md:w-1/2">
			  <h1 className="text-2xl font-bold mb-6">Matched Jobs</h1>
			  <div className="relative pl-8">
				{/* Vertical line */}
				<div className="absolute left-2 top-0 bottom-0 w-1 bg-blue-100 rounded-full" style={{ zIndex: 0 }}></div>
				<ul className="flex flex-col gap-6">
				  {mockJobs
					.filter((job) => !selectedResume || job.resume === selectedResume)
					.map((job, idx, arr) => (
					  <li key={job.id} className="relative flex items-center group" style={{ zIndex: 1 }}>
						{/* Connector dot */}
						<div className="absolute -left-4 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow" style={{ zIndex: 2 }}></div>
						<div className="flex-1 bg-white rounded-lg px-4 py-3 shadow border border-blue-100">
						  <div className="flex items-center gap-2">
							<span className="font-semibold text-gray-900">{job.title}</span>
							<span className="px-2 py-0.5 rounded text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200">{job.status}</span>
						  </div>
						  <div className="text-xs text-gray-500 mt-1">Resume: <span className="font-semibold text-blue-700">{mockResumes.find(r => r.id === job.resume)?.name || 'N/A'}</span></div>
						  <div className="text-xs text-gray-400 mt-1">
							{/* Inline mock data for job dates */}
							{(() => {
							  // Inline job date logic for dashboard
							  // These should match the mockJobs in jobs/page.tsx
							  const jobDates: Record<number, {appliedDate?: string, updatedDate?: string}> = {
								1: { appliedDate: "2025-07-01", updatedDate: "2025-07-07" },
								2: { appliedDate: "2025-07-02", updatedDate: "2025-07-07" },
								3: { appliedDate: "2025-07-03", updatedDate: "2025-07-07" },
								4: { appliedDate: "2025-07-04", updatedDate: "2025-07-07" },
								5: { appliedDate: "2025-07-05", updatedDate: "2025-07-07" },
								6: { appliedDate: "2025-07-01", updatedDate: "2025-07-06" },
								7: { appliedDate: "2025-07-02", updatedDate: "2025-07-07" },
								8: { appliedDate: "2025-07-03", updatedDate: "2025-07-07" },
								9: { appliedDate: "2025-07-04", updatedDate: "2025-07-07" },
								10: { appliedDate: "2025-07-05", updatedDate: "2025-07-07" },
							  };
							  const jobData = jobDates[job.id] || {};
							  if (job.status && job.status.toLowerCase().includes("interview") && jobData.updatedDate) {
								return <span>Interview: <span className="font-semibold">{jobData.updatedDate}</span></span>;
							  } else if (jobData.appliedDate) {
								return <span>Applied: <span className="font-semibold">{jobData.appliedDate}</span></span>;
							  } else if (jobData.updatedDate) {
								return <span>Updated: <span className="font-semibold">{jobData.updatedDate}</span></span>;
							  } else {
								return null;
							  }
							})()}
						  </div>
						</div>
					  </li>
					))}
				</ul>
			  </div>
			</div>
		  </div>
		</div>
	  </div>
	</div>
  );
}
