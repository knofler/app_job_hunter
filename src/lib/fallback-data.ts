export type FallbackResume = {
  id: string;
  slug: string;
  name: string;
  type: "Technical" | "Business" | "Creative";
  summary: string;
  preview: string;
  skills: string[];
  lastUpdated: string;
};

export const fallbackResumes: FallbackResume[] = [
  {
    id: "fallback-resume-1",
    slug: "software-engineer-resume",
    name: "Software Engineer Resume",
    type: "Technical",
    summary: "5+ years experience in full-stack development, React, Node.js, and cloud platforms.",
    preview: `Jane Candidate\nSoftware Engineer\n\nProfessional Summary:\nResults-driven software engineer with 5+ years of experience building scalable web applications. Adept at React, Node.js, and AWS. Passionate about clean code and agile teams.\n\nSkills:\n- React.js\n- Node.js\n- AWS\n- TypeScript\n- REST APIs\n- Agile/Scrum\n\nExperience:\nAcme Corp (2019-2024): Senior Frontend Engineer\nBeta Inc (2017-2019): Full Stack Developer\n\nEducation:\nB.Sc. in Computer Science, Tech University\n`,
    skills: ["React.js", "Node.js", "AWS", "TypeScript", "REST APIs", "Agile/Scrum"],
    lastUpdated: "2025-07-01",
  },
  {
    id: "fallback-resume-2",
    slug: "product-manager-resume",
    name: "Product Manager Resume",
    type: "Business",
    summary: "Experienced in product lifecycle, agile, and cross-functional teams.",
    preview: `Jane Candidate\nProduct Manager\n\nProfessional Summary:\nStrategic product manager with a track record of launching successful SaaS products. Skilled in agile methodologies and cross-functional leadership.\n\nSkills:\n- Product Strategy\n- Agile/Scrum\n- Roadmapping\n- Stakeholder Management\n- User Research\n\nExperience:\nBeta Inc (2020-2024): Product Manager\nAcme Corp (2017-2020): Associate PM\n\nEducation:\nMBA, Business School\n`,
    skills: ["Product Strategy", "Agile/Scrum", "Roadmapping", "Stakeholder Management", "User Research"],
    lastUpdated: "2025-06-28",
  },
  {
    id: "fallback-resume-3",
    slug: "data-scientist-resume",
    name: "Data Scientist Resume",
    type: "Technical",
    summary: "Expert in Python, ML, and data visualization.",
    preview: `Jane Candidate\nData Scientist\n\nProfessional Summary:\nData scientist with deep expertise in machine learning, Python, and data visualization. Proven ability to turn data into actionable insights.\n\nSkills:\n- Python\n- Machine Learning\n- Data Visualization\n- SQL\n- Pandas\n\nExperience:\nDataWorks (2021-2024): Data Scientist\nAnalyticsPro (2018-2021): Data Analyst\n\nEducation:\nM.Sc. in Data Science, Analytics University\n`,
    skills: ["Python", "Machine Learning", "Data Visualization", "SQL", "Pandas"],
    lastUpdated: "2025-07-05",
  },
  {
    id: "fallback-resume-4",
    slug: "marketing-resume",
    name: "Marketing Resume",
    type: "Creative",
    summary: "Digital marketing specialist with SEO/SEM expertise.",
    preview: `Jane Candidate\nMarketing Specialist\n\nProfessional Summary:\nCreative digital marketer with a focus on SEO, SEM, and content strategy. Experienced in driving brand growth and engagement.\n\nSkills:\n- SEO\n- SEM\n- Content Strategy\n- Google Analytics\n- Social Media Marketing\n\nExperience:\nBrandBoost (2020-2024): Marketing Specialist\nAdWorks (2017-2020): Marketing Coordinator\n\nEducation:\nB.A. in Marketing, State College\n`,
    skills: ["SEO", "SEM", "Content Strategy", "Google Analytics", "Social Media Marketing"],
    lastUpdated: "2025-06-30",
  },
  {
    id: "fallback-resume-5",
    slug: "finance-resume",
    name: "Finance Resume",
    type: "Business",
    summary: "Financial analyst with strong modeling skills.",
    preview: `Jane Candidate\nFinancial Analyst\n\nProfessional Summary:\nAnalytical finance professional with expertise in financial modeling, forecasting, and reporting.\n\nSkills:\n- Financial Modeling\n- Forecasting\n- Excel\n- Reporting\n- Budgeting\n\nExperience:\nFinCorp (2019-2024): Financial Analyst\nMoneyMatters (2016-2019): Junior Analyst\n\nEducation:\nB.Com. in Finance, City University\n`,
    skills: ["Financial Modeling", "Forecasting", "Excel", "Reporting", "Budgeting"],
    lastUpdated: "2025-07-03",
  },
  {
    id: "fallback-resume-6",
    slug: "ux-designer-resume",
    name: "UX Designer Resume",
    type: "Creative",
    summary: "UX/UI designer with a focus on accessibility.",
    preview: `Jane Candidate\nUX Designer\n\nProfessional Summary:\nUser-focused UX/UI designer with a passion for accessibility and clean interfaces.\n\nSkills:\n- UX Design\n- UI Design\n- Accessibility\n- Figma\n- Prototyping\n\nExperience:\nDesignLab (2021-2024): UX Designer\nWebWorks (2018-2021): Junior Designer\n\nEducation:\nB.Des. in Design, Art Institute\n`,
    skills: ["UX Design", "UI Design", "Accessibility", "Figma", "Prototyping"],
    lastUpdated: "2025-07-02",
  },
  {
    id: "fallback-resume-7",
    slug: "devops-resume",
    name: "DevOps Resume",
    type: "Technical",
    summary: "DevOps engineer with CI/CD and cloud automation.",
    preview: `Jane Candidate\nDevOps Engineer\n\nProfessional Summary:\nDevOps engineer skilled in CI/CD, cloud automation, and infrastructure as code.\n\nSkills:\n- CI/CD\n- Cloud Automation\n- Docker\n- Kubernetes\n- Terraform\n\nExperience:\nCloudOps (2020-2024): DevOps Engineer\nInfraTech (2017-2020): Systems Engineer\n\nEducation:\nB.Sc. in Information Systems, Tech University\n`,
    skills: ["CI/CD", "Cloud Automation", "Docker", "Kubernetes", "Terraform"],
    lastUpdated: "2025-06-29",
  },
  {
    id: "fallback-resume-8",
    slug: "sales-resume",
    name: "Sales Resume",
    type: "Business",
    summary: "Top-performing sales executive in SaaS.",
    preview: `Jane Candidate\nSales Executive\n\nProfessional Summary:\nResults-oriented sales executive with a record of exceeding targets in SaaS sales.\n\nSkills:\n- SaaS Sales\n- CRM\n- Negotiation\n- Lead Generation\n- Account Management\n\nExperience:\nSalesForce (2019-2024): Sales Executive\nBizGrow (2016-2019): Sales Associate\n\nEducation:\nB.A. in Business, State College\n`,
    skills: ["SaaS Sales", "CRM", "Negotiation", "Lead Generation", "Account Management"],
    lastUpdated: "2025-07-04",
  },
  {
    id: "fallback-resume-9",
    slug: "hr-resume",
    name: "HR Resume",
    type: "Business",
    summary: "HR manager with talent acquisition expertise.",
    preview: `Jane Candidate\nHR Manager\n\nProfessional Summary:\nHR manager with a focus on talent acquisition, employee engagement, and compliance.\n\nSkills:\n- Talent Acquisition\n- Employee Engagement\n- Compliance\n- HRIS\n- Onboarding\n\nExperience:\nPeopleFirst (2020-2024): HR Manager\nTalentWorks (2017-2020): HR Specialist\n\nEducation:\nB.A. in Human Resources, City University\n`,
    skills: ["Talent Acquisition", "Employee Engagement", "Compliance", "HRIS", "Onboarding"],
    lastUpdated: "2025-06-27",
  },
  {
    id: "fallback-resume-10",
    slug: "content-writer-resume",
    name: "Content Writer Resume",
    type: "Creative",
    summary: "Content writer with published work in tech.",
    preview: `Jane Candidate\nContent Writer\n\nProfessional Summary:\nContent writer with a portfolio of published work in technology and business.\n\nSkills:\n- Content Writing\n- Editing\n- Blogging\n- SEO\n- Research\n\nExperience:\nWriteNow (2021-2024): Content Writer\nBlogPro (2018-2021): Junior Writer\n\nEducation:\nB.A. in English, State College\n`,
    skills: ["Content Writing", "Editing", "Blogging", "SEO", "Research"],
    lastUpdated: "2025-07-06",
  },
];

export const fallbackResumeHealth = {
  score: 87,
  sub_scores: [
    { label: "ATS", value: 90 },
    { label: "Skills", value: 85 },
    { label: "Format", value: 80 },
  ],
};

export const fallbackSuggestedActions = [
  { id: "fallback-action-1", text: "Tailor your resume for backend roles", priority: "High", category: "Resume" },
  { id: "fallback-action-2", text: "Highlight React and Node.js projects", priority: "Medium", category: "Portfolio" },
  { id: "fallback-action-3", text: "Showcase cloud deployments", priority: "High", category: "Skills" },
  { id: "fallback-action-4", text: "Add TypeScript and API experience", priority: "Medium", category: "Skills" },
  { id: "fallback-action-5", text: "Quantify project impact/results", priority: "Low", category: "Resume" },
  { id: "fallback-action-6", text: "Include open source contributions", priority: "Low", category: "Brand" },
];

export const fallbackPipelineCounts: Record<string, number> = {
  Draft: 2,
  Saved: 1,
  Applied: 2,
  Shortlisted: 1,
  "Interview Round 1": 1,
  "Phone Interview": 1,
  Offer: 0,
};

export const fallbackTopMatches = [
  {
    id: "fallback-job-1",
    title: "Frontend Engineer",
    company: "Acme Corp",
    location: "Remote",
    match_score: 92,
  },
  {
    id: "fallback-job-2",
    title: "Product Manager",
    company: "Beta Inc",
    location: "San Francisco, CA",
    match_score: 88,
  },
  {
    id: "fallback-job-3",
    title: "Data Scientist",
    company: "DataWorks",
    location: "New York, NY",
    match_score: 85,
  },
  {
    id: "fallback-job-4",
    title: "Marketing Specialist",
    company: "BrandBoost",
    location: "Austin, TX",
    match_score: 81,
  },
  {
    id: "fallback-job-5",
    title: "UX Designer",
    company: "DesignLab",
    location: "Seattle, WA",
    match_score: 80,
  },
];

export type FallbackJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  match_score: number;
  salary_range?: string;
  employment_type?: string;
  posted_at: string;
  status?: string;
  resume_slug?: string;
};

export const fallbackJobs: FallbackJob[] = [
  {
    id: "fallback-job-1",
    title: "Frontend Engineer",
    company: "Acme Corp",
    location: "Remote",
    match_score: 92,
    salary_range: "$120k - $150k",
    employment_type: "Full-time",
    posted_at: "2025-07-01T00:00:00Z",
    status: "Applied",
    resume_slug: "software-engineer-resume",
  },
  {
    id: "fallback-job-2",
    title: "Product Manager",
    company: "Beta Inc",
    location: "San Francisco, CA",
    match_score: 88,
    salary_range: "$140k - $180k",
    employment_type: "Full-time",
    posted_at: "2025-07-03T00:00:00Z",
    status: "Interview Round 1",
    resume_slug: "product-manager-resume",
  },
  {
    id: "fallback-job-3",
    title: "Data Scientist",
    company: "DataWorks",
    location: "New York, NY",
    match_score: 85,
    salary_range: "$130k - $170k",
    employment_type: "Hybrid",
    posted_at: "2025-07-02T00:00:00Z",
    status: "Shortlisted",
    resume_slug: "data-scientist-resume",
  },
  {
    id: "fallback-job-4",
    title: "Marketing Specialist",
    company: "BrandBoost",
    location: "Austin, TX",
    match_score: 81,
    salary_range: "$80k - $105k",
    employment_type: "Full-time",
    posted_at: "2025-07-05T00:00:00Z",
    status: "Draft",
    resume_slug: "marketing-resume",
  },
  {
    id: "fallback-job-5",
    title: "HR Manager",
    company: "PeopleFirst",
    location: "Chicago, IL",
    match_score: 79,
    salary_range: "$95k - $120k",
    employment_type: "Hybrid",
    posted_at: "2025-06-30T00:00:00Z",
    status: "Phone Interview",
    resume_slug: "hr-resume",
  },
  {
    id: "fallback-job-6",
    title: "Sales Executive",
    company: "SalesForce",
    location: "Remote",
    match_score: 77,
    salary_range: "$110k - $160k",
    employment_type: "Full-time",
    posted_at: "2025-07-04T00:00:00Z",
    status: "Applied",
    resume_slug: "sales-resume",
  },
  {
    id: "fallback-job-7",
    title: "Finance Analyst",
    company: "FinCorp",
    location: "Boston, MA",
    match_score: 75,
    salary_range: "$100k - $130k",
    employment_type: "On-site",
    posted_at: "2025-06-28T00:00:00Z",
    status: "Interview Round 1",
    resume_slug: "finance-resume",
  },
];

export const fallbackApplications = [
  {
    id: "fallback-application-1",
    status: "Applied",
    resume_slug: "software-engineer-resume",
    match_score: 92,
    applied_at: "2025-07-01T00:00:00Z",
    updated_at: "2025-07-07T00:00:00Z",
    job: {
      id: "fallback-job-1",
      title: "Frontend Engineer",
      company: "Acme Corp",
      location: "Remote",
    },
  },
  {
    id: "fallback-application-2",
    status: "Interview Round 1",
    resume_slug: "product-manager-resume",
    match_score: 88,
    applied_at: "2025-06-28T00:00:00Z",
    updated_at: "2025-07-06T00:00:00Z",
    job: {
      id: "fallback-job-2",
      title: "Product Manager",
      company: "Beta Inc",
      location: "San Francisco, CA",
    },
  },
  {
    id: "fallback-application-3",
    status: "Shortlisted",
    resume_slug: "data-scientist-resume",
    match_score: 85,
    applied_at: "2025-07-03T00:00:00Z",
    updated_at: "2025-07-07T00:00:00Z",
    job: {
      id: "fallback-job-3",
      title: "Data Scientist",
      company: "DataWorks",
      location: "New York, NY",
    },
  },
  {
    id: "fallback-application-4",
    status: "Draft",
    resume_slug: "marketing-resume",
    match_score: 81,
    applied_at: "2025-07-04T00:00:00Z",
    updated_at: "2025-07-04T00:00:00Z",
    job: {
      id: "fallback-job-4",
      title: "Marketing Specialist",
      company: "BrandBoost",
      location: "Austin, TX",
    },
  },
  {
    id: "fallback-application-5",
    status: "Phone Interview",
    resume_slug: "hr-resume",
    match_score: 79,
    applied_at: "2025-06-25T00:00:00Z",
    updated_at: "2025-07-05T00:00:00Z",
    job: {
      id: "fallback-job-5",
      title: "HR Manager",
      company: "PeopleFirst",
      location: "Chicago, IL",
    },
  },
];

export type FallbackCandidate = {
  candidate_id: string;
  name: string;
  primary_role: string;
  candidate_type: string;
  preferred_locations: string[];
  experience_years: number;
  updated_at: string;
};

export const fallbackCandidates: FallbackCandidate[] = [
  {
    candidate_id: "candidate_1",
    name: "Jane Candidate",
    primary_role: "Full-stack Developer",
    candidate_type: "Full-Stack Engineer",
    preferred_locations: ["Sydney, NSW", "Remote"],
    experience_years: 6,
    updated_at: "2025-07-06T00:00:00Z",
  },
  {
    candidate_id: "candidate_2",
    name: "Alex Harper",
    primary_role: "Data Scientist",
    candidate_type: "Data Scientist",
    preferred_locations: ["Melbourne, VIC", "Remote"],
    experience_years: 5,
    updated_at: "2025-07-05T00:00:00Z",
  },
  {
    candidate_id: "candidate_3",
    name: "Morgan Ellis",
    primary_role: "Senior Product Manager",
    candidate_type: "Product Manager",
    preferred_locations: ["Brisbane, QLD", "Sydney, NSW"],
    experience_years: 7,
    updated_at: "2025-07-04T00:00:00Z",
  },
  {
    candidate_id: "candidate_4",
    name: "Taylor Monroe",
    primary_role: "Lead UX Designer",
    candidate_type: "UX Designer",
    preferred_locations: ["Perth, WA", "Remote"],
    experience_years: 8,
    updated_at: "2025-07-03T00:00:00Z",
  },
  {
    candidate_id: "candidate_5",
    name: "Jordan Reid",
    primary_role: "Growth Marketing Manager",
    candidate_type: "Marketing Strategist",
    preferred_locations: ["Adelaide, SA", "Melbourne, VIC"],
    experience_years: 6,
    updated_at: "2025-07-02T00:00:00Z",
  },
];

export type FallbackRecruiter = {
  recruiter_id: string;
  name: string;
  company: string;
  specialties: string[];
  regions: string[];
  email: string;
  updated_at: string;
};

export const fallbackRecruiters: FallbackRecruiter[] = [
  {
    recruiter_id: "recruiter_1",
    name: "Harper Brooks",
    company: "TalentBridge",
    specialties: ["Full-Stack Engineering", "DevOps & Cloud"],
    regions: ["Sydney, NSW", "Melbourne, VIC"],
    email: "harper.brooks@talentbridge.com",
    updated_at: "2025-07-05T00:00:00Z",
  },
  {
    recruiter_id: "recruiter_2",
    name: "Elliot Hayes",
    company: "Elevate Partners",
    specialties: ["Data & AI", "Machine Learning"],
    regions: ["Brisbane, QLD", "Remote"],
    email: "elliot.hayes@elevatepartners.com",
    updated_at: "2025-07-04T00:00:00Z",
  },
  {
    recruiter_id: "recruiter_3",
    name: "Rowan Kennedy",
    company: "Northstar Search",
    specialties: ["Product Management", "UX & Research"],
    regions: ["Perth, WA", "Adelaide, SA"],
    email: "rowan.kennedy@northstarsearch.com",
    updated_at: "2025-07-03T00:00:00Z",
  },
  {
    recruiter_id: "recruiter_4",
    name: "Skye Parker",
    company: "BlueSky Talent",
    specialties: ["Marketing & Growth", "Sales Leadership"],
    regions: ["Canberra, ACT", "Sydney, NSW"],
    email: "skye.parker@blueskytalent.com",
    updated_at: "2025-07-02T00:00:00Z",
  },
  {
    recruiter_id: "recruiter_5",
    name: "Finley Sawyer",
    company: "Momentum Recruiting",
    specialties: ["People & Talent", "Finance & Operations"],
    regions: ["Gold Coast, QLD", "Brisbane, QLD"],
    email: "finley.sawyer@momentumrecruiting.com",
    updated_at: "2025-07-01T00:00:00Z",
  },
];
