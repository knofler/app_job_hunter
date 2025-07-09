"use client";
import { useState } from "react";

const mockResumes = [
  {
	id: 1,
	name: "Software Engineer Resume",
	type: "Technical",
	summary: "5+ years experience in full-stack development, React, Node.js, and cloud platforms.",
	preview: `John Doe\nSoftware Engineer\n\nProfessional Summary:\nResults-driven software engineer with 5+ years of experience building scalable web applications. Adept at React, Node.js, and AWS. Passionate about clean code and agile teams.\n\nSkills:\n- React.js\n- Node.js\n- AWS\n- TypeScript\n- REST APIs\n- Agile/Scrum\n\nExperience:\nAcme Corp (2019-2024): Senior Frontend Engineer\nBeta Inc (2017-2019): Full Stack Developer\n\nEducation:\nB.Sc. in Computer Science, Tech University\n`,
	skills: ["React.js", "Node.js", "AWS", "TypeScript", "REST APIs", "Agile/Scrum"],
	lastUpdated: "2025-07-01",
  },
  {
	id: 2,
	name: "Product Manager Resume",
	type: "Business",
	summary: "Experienced in product lifecycle, agile, and cross-functional teams.",
	preview: `Jane Smith\nProduct Manager\n\nProfessional Summary:\nStrategic product manager with a track record of launching successful SaaS products. Skilled in agile methodologies and cross-functional leadership.\n\nSkills:\n- Product Strategy\n- Agile/Scrum\n- Roadmapping\n- Stakeholder Management\n- User Research\n\nExperience:\nBeta Inc (2020-2024): Product Manager\nAcme Corp (2017-2020): Associate PM\n\nEducation:\nMBA, Business School\n`,
	skills: ["Product Strategy", "Agile/Scrum", "Roadmapping", "Stakeholder Management", "User Research"],
	lastUpdated: "2025-06-28",
  },
  {
	id: 3,
	name: "Data Scientist Resume",
	type: "Technical",
	summary: "Expert in Python, ML, and data visualization.",
	preview: `Alex Kim\nData Scientist\n\nProfessional Summary:\nData scientist with deep expertise in machine learning, Python, and data visualization. Proven ability to turn data into actionable insights.\n\nSkills:\n- Python\n- Machine Learning\n- Data Visualization\n- SQL\n- Pandas\n\nExperience:\nDataWorks (2021-2024): Data Scientist\nAnalyticsPro (2018-2021): Data Analyst\n\nEducation:\nM.Sc. in Data Science, Analytics University\n`,
	skills: ["Python", "Machine Learning", "Data Visualization", "SQL", "Pandas"],
	lastUpdated: "2025-07-05",
  },
  {
	id: 4,
	name: "Marketing Resume",
	type: "Creative",
	summary: "Digital marketing specialist with SEO/SEM expertise.",
	preview: `Sam Lee\nMarketing Specialist\n\nProfessional Summary:\nCreative digital marketer with a focus on SEO, SEM, and content strategy. Experienced in driving brand growth and engagement.\n\nSkills:\n- SEO\n- SEM\n- Content Strategy\n- Google Analytics\n- Social Media Marketing\n\nExperience:\nBrandBoost (2020-2024): Marketing Specialist\nAdWorks (2017-2020): Marketing Coordinator\n\nEducation:\nB.A. in Marketing, State College\n`,
	skills: ["SEO", "SEM", "Content Strategy", "Google Analytics", "Social Media Marketing"],
	lastUpdated: "2025-06-30",
  },
  {
	id: 5,
	name: "Finance Resume",
	type: "Business",
	summary: "Financial analyst with strong modeling skills.",
	preview: `Chris Patel\nFinancial Analyst\n\nProfessional Summary:\nAnalytical finance professional with expertise in financial modeling, forecasting, and reporting.\n\nSkills:\n- Financial Modeling\n- Forecasting\n- Excel\n- Reporting\n- Budgeting\n\nExperience:\nFinCorp (2019-2024): Financial Analyst\nMoneyMatters (2016-2019): Junior Analyst\n\nEducation:\nB.Com. in Finance, City University\n`,
	skills: ["Financial Modeling", "Forecasting", "Excel", "Reporting", "Budgeting"],
	lastUpdated: "2025-07-03",
  },
  {
	id: 6,
	name: "UX Designer Resume",
	type: "Creative",
	summary: "UX/UI designer with a focus on accessibility.",
	preview: `Morgan Yu\nUX Designer\n\nProfessional Summary:\nUser-focused UX/UI designer with a passion for accessibility and clean interfaces.\n\nSkills:\n- UX Design\n- UI Design\n- Accessibility\n- Figma\n- Prototyping\n\nExperience:\nDesignLab (2021-2024): UX Designer\nWebWorks (2018-2021): Junior Designer\n\nEducation:\nB.Des. in Design, Art Institute\n`,
	skills: ["UX Design", "UI Design", "Accessibility", "Figma", "Prototyping"],
	lastUpdated: "2025-07-02",
  },
  {
	id: 7,
	name: "DevOps Resume",
	type: "Technical",
	summary: "DevOps engineer with CI/CD and cloud automation.",
	preview: `Jordan Park\nDevOps Engineer\n\nProfessional Summary:\nDevOps engineer skilled in CI/CD, cloud automation, and infrastructure as code.\n\nSkills:\n- CI/CD\n- Cloud Automation\n- Docker\n- Kubernetes\n- Terraform\n\nExperience:\nCloudOps (2020-2024): DevOps Engineer\nInfraTech (2017-2020): Systems Engineer\n\nEducation:\nB.Sc. in Information Systems, Tech University\n`,
	skills: ["CI/CD", "Cloud Automation", "Docker", "Kubernetes", "Terraform"],
	lastUpdated: "2025-06-29",
  },
	{
		id: 8,
		name: "Sales Resume",
		type: "Business",
		summary: "Top-performing sales executive in SaaS.",
		preview: `Taylor Brooks\nSales Executive\n\nProfessional Summary:\nResults-oriented sales executive with a record of exceeding targets in SaaS sales.\n\nSkills:\n- SaaS Sales\n- CRM\n- Negotiation\n- Lead Generation\n- Account Management\n\nExperience:\nSalesForce (2019-2024): Sales Executive\nBizGrow (2016-2019): Sales Associate\n\nEducation:\nB.A. in Business, State College\n`,
		skills: ["SaaS Sales", "CRM", "Negotiation", "Lead Generation", "Account Management"],
		lastUpdated: "2025-07-04",
	},
	{
		id: 9,
		name: "HR Resume",
		type: "Business",
		summary: "HR manager with talent acquisition expertise.",
		preview: `Casey Lin\nHR Manager\n\nProfessional Summary:\nHR manager with a focus on talent acquisition, employee engagement, and compliance.\n\nSkills:\n- Talent Acquisition\n- Employee Engagement\n- Compliance\n- HRIS\n- Onboarding\n\nExperience:\nPeopleFirst (2020-2024): HR Manager\nTalentWorks (2017-2020): HR Specialist\n\nEducation:\nB.A. in Human Resources, City University\n`,
		skills: ["Talent Acquisition", "Employee Engagement", "Compliance", "HRIS", "Onboarding"],
		lastUpdated: "2025-06-27",
	},
	{
		id: 10,
		name: "Content Writer Resume",
		type: "Creative",
		summary: "Content writer with published work in tech.",
		preview: `Jamie Fox\nContent Writer\n\nProfessional Summary:\nContent writer with a portfolio of published work in technology and business.\n\nSkills:\n- Content Writing\n- Editing\n- Blogging\n- SEO\n- Research\n\nExperience:\nWriteNow (2021-2024): Content Writer\nBlogPro (2018-2021): Junior Writer\n\nEducation:\nB.A. in English, State College\n`,
		skills: ["Content Writing", "Editing", "Blogging", "SEO", "Research"],
		lastUpdated: "2025-07-06",
	},
];

const sections = ["Technical", "Business", "Creative"];

function EditIcon({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
	return (
		<button
			onClick={onClick}
			className="ml-2 text-gray-500 hover:text-blue-600"
			title="Edit resume name"
			aria-label="Edit resume name"
		>
			<svg
				width="16"
				height="16"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke="currentColor"
					strokeWidth="2"
					d="M16.475 5.408l2.117-2.116a1.5 1.5 0 1 1 2.122 2.122l-2.116 2.117m-2.123-2.123l-9.193 9.193a2 2 0 0 0-.497.85l-1.06 3.18a.5.5 0 0 0 .632.632l3.18-1.06a2 2 0 0 0 .85-.497l9.193-9.193m-2.123-2.123 2.123 2.123"
				/>
			</svg>
		</button>
	);
}

export default function ResumePage() {
	const [resumes, setResumes] = useState(mockResumes);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editName, setEditName] = useState("");
	const [selectedId, setSelectedId] = useState<number | null>(null);

	function startEdit(id: number, name: string) {
		setEditingId(id);
		setEditName(name);
	}
	function saveEdit(id: number) {
		setResumes(
			resumes.map(r => (r.id === id ? { ...r, name: editName } : r)),
		);
		setEditingId(null);
		setEditName("");
	}
	function selectResume(id: number) {
		setSelectedId(id);
	}

	const selectedResume = resumes.find(r => r.id === selectedId) || resumes[0];

	return (
		<div className="max-w-5xl mx-auto py-10 px-4 flex flex-col md:flex-row gap-8">
			{/* Left: Resume List */}
			<div className="w-full md:w-1/2">
				<h1 className="text-2xl font-bold mb-6">Your Resumes</h1>
				{sections.map(section => (
					<div key={section} className="mb-6">
						<h2 className="text-lg font-semibold mb-3 text-blue-800">
							{section} Resumes
						</h2>
						<ul className="flex flex-col gap-2">
							{resumes
								.filter(r => r.type === section)
								.map(resume => (
									<li
										key={resume.id}
										className={`bg-white border border-blue-100 rounded-lg px-4 py-3 flex flex-col items-start shadow transition-all duration-200 cursor-pointer ${
											selectedId === resume.id ? "ring-2 ring-blue-400" : ""
										}`}
										style={{ minHeight: 48 }}
										onClick={() => selectResume(resume.id)}
									>
										<div className="flex items-center gap-2 w-full">
											{editingId === resume.id ? (
												<>
													<input
														className="border rounded px-2 py-1 text-sm flex-1"
														value={editName}
														onChange={e =>
															setEditName(e.target.value)
														}
														onClick={e => e.stopPropagation()}
													/>
													<button
														className="text-blue-600 text-xs ml-2"
														onClick={e => {
															e.stopPropagation();
															saveEdit(resume.id);
														}}
													>
														Save
													</button>
												</>
											) : (
												<>
													<span className="font-semibold flex-1 text-gray-900">
														{resume.name}
													</span>
													<EditIcon
														onClick={e => {
															e.stopPropagation();
															startEdit(resume.id, resume.name);
														}}
													/>
												</>
											)}
										</div>
										<div className="text-sm text-gray-700 mb-1 mt-1">
											{resume.summary}
										</div>
										<div className="text-xs text-gray-500 mt-1">
											Last updated: <span className="font-semibold text-blue-700">{resume.lastUpdated}</span>
										</div>
									</li>
								))}
						</ul>
					</div>
				))}
			</div>
			{/* Right: Resume Preview */}
			<div className="w-full md:w-1/2">
				<div className="bg-white border-2 border-blue-200 rounded-lg p-6 shadow-sm min-h-[300px]">
					<div className="mb-2 font-semibold text-blue-900 text-lg">
						{selectedResume.name}
					</div>
					<div className="mb-2 text-gray-700">
						{selectedResume.summary}
					</div>
					<div className="mb-2 font-semibold text-blue-900">
						Professional Summary
					</div>
					<div className="mb-3 text-gray-800">
						{selectedResume.preview
							.split("Professional Summary:")
							[1]
							?.split("Skills:")[0]
							?.trim() || ""}
					</div>
					<div className="mb-2 font-semibold text-blue-900">Skills</div>
					<div className="flex flex-wrap gap-2 mb-3">
						{selectedResume.skills.map(skill => (
							<span
								key={skill}
								className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium border border-blue-200"
							>
								{skill}
							</span>
						))}
					</div>
					<div className="mb-2 font-semibold text-blue-900">Full Resume</div>
					<pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-700 whitespace-pre-line overflow-x-auto">
						{selectedResume.preview}
					</pre>
				</div>
			</div>
		</div>
	);
}
