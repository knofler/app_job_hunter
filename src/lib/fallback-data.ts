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

export type RecruiterWorkflowStep = {
  title: string;
  description: string;
  bullets?: string[];
};

export type RecruiterWorkflowCoreSkill = {
  name: string;
  reason: string;
};

export type RecruiterWorkflowSkillAlignment = {
  skill: string;
  status: "Yes" | "Partial" | "No";
  evidence: string;
};

export type RecruiterWorkflowImprovement = {
  label: string;
  status: "Completed" | "In progress" | "Queued";
  completedAt?: string;
  impact?: string;
};

export type RecruiterWorkflowCandidate = {
  id: string;
  name: string;
  currentRole: string;
  matchScore: number;
  biasFreeScore: number;
  experienceYears: number;
  summary: string;
  highlights: string[];
  skillAlignment: RecruiterWorkflowSkillAlignment[];
  priority: "Hot" | "Warm" | "Pipeline";
  status: string;
  mustMatchFlags: string[];
  recruiterNotes: string;
  improvementJourney: RecruiterWorkflowImprovement[];
  recommendation: string;
  riskNotes: string[];
  availability: string;
  compensation: string;
};

export type RecruiterWorkflowInsight = {
  label: string;
  value: string;
  helper?: string;
};

export type RecruiterWorkflowQuestion = {
  question: string;
  rationale: string;
};

export type RecruiterWorkflowMock = {
  jobTitle: string;
  jobCode: string;
  jobLevel: string;
  jobSummary: string;
  jobDescription: string;
  salaryBand: string;
  workflowSteps: RecruiterWorkflowStep[];
  coreSkills: RecruiterWorkflowCoreSkill[];
  candidates: RecruiterWorkflowCandidate[];
  engagementInsights: RecruiterWorkflowInsight[];
  fairnessInsights: RecruiterWorkflowInsight[];
  interviewPreparation: RecruiterWorkflowQuestion[];
  disclaimers: string[];
};

export const fallbackRecruiterWorkflow: RecruiterWorkflowMock = {
  jobTitle: "Senior Technical Project Manager – Data Transformation",
  jobCode: "REQ-4581",
  jobLevel: "Enterprise | 12 month programme",
  jobSummary:
    "Lead a $90M insurance transformation programme migrating legacy claims platforms onto Guidewire, modernising data pipelines, and establishing cloud-first governance.",
  jobDescription: `Project Overview:\n- NSW insurance partner modernising a multi-line claims portfolio onto Guidewire cloud.\n- Legacy data sets span 30 years of transactions across Ellipse, FlexMAM, and custom SQL stores.\n- Programme requires rapid remediation of technical debt (20%) while maintaining business continuity.\n\nKey Responsibilities:\n1. Direct enterprise-scale data migration workstreams, partnering with vendors and internal squads.\n2. Define end-to-end ETL/ELT strategy, QA checkpoints, and hypercare support across claims and media archives.\n3. Collaborate with architecture on cloud data warehousing (Snowflake/Azure Synapse) and analytics enablement.\n4. Mature delivery governance, risk controls, and reporting cadences for exec stakeholders.\n\nSuccess Metrics:\n- Zero critical defects at cutover; < 0.5% data variance post-migration.\n- 30% reduction in manual reconciliation effort within 60 days.\n- Transition playbook and knowledge transfer executed within first quarter.`,
  salaryBand: "Permanent: $200k + super | Contract: $1,300 + super per day",
  workflowSteps: [
    {
      title: "Collect hiring context",
      description: "Recruiter uploads the job description and selects the candidate resumes for analysis.",
      bullets: ["Supports pasted text and file attachments", "Captures salary, availability, and interview notes"],
    },
    {
      title: "Identify core skills",
      description: "AI distils the job description into the three must-have competencies with rationale to align downstream scoring.",
    },
    {
      title: "Score candidates",
      description:
        "Each resume is analysed for a match score, bias-mitigation score, an executive summary, and evidence-backed skill alignment.",
      bullets: ["Scores are 1-100 and fully auditable", "References map to resume snippets"],
    },
    {
      title: "Generate recruiter pack",
      description: "Produces ranked shortlist, risk commentary, financial comparison, and interview prompts in markdown-ready format.",
    },
  ],
  coreSkills: [
    {
      name: "Enterprise Data Migration Leadership",
      reason:
        "Programme demands owners who have orchestrated multi-year migrations with complex cutover and reconciliation strategies.",
    },
    {
      name: "Insurance Platform & Guidewire Expertise",
      reason:
        "Guidewire is explicitly called out; candidates must translate insurance domain logic into the new platform with minimal ramp-up.",
    },
    {
      name: "Cloud-Native Data & Governance",
      reason:
        "Success metrics require leveraging cloud warehouses and modern governance, beyond legacy on-prem ETL tooling.",
    },
  ],
  candidates: [
    {
      id: "candidate-david-wong",
      name: "David Wong",
      currentRole: "Senior Technical Delivery Lead · ABC",
      matchScore: 92,
      biasFreeScore: 95,
      experienceYears: 20,
      summary:
        "Programme rescue specialist who has led 15+ data transformations across media, utilities, and insurance with hybrid agile governance.",
      highlights: [
        "Recovered a red-status Ellipse → Maximo migration covering 30 years of asset data with four vendor streams.",
        "Directed ABC's FlexMAM ingestion of 450k media assets, introducing active-active DR and analytics guardrails.",
        "Executed Allianz to icare Guidewire consolidation covering 200k+ claims and 4M digital artifacts under aggressive deadlines.",
  ],
      priority: "Hot",
      status: "Ready for panel interview",
      mustMatchFlags: [
        "Guidewire programme governance",
        "Enterprise data migration leadership",
      ],
      recruiterNotes:
        "Contract-first path to stabilise the transformation backlog; align vendor deep dive to confirm Guidewire ownership depth.",
      improvementJourney: [
        {
          label: "Guidewire programme retrospective uploaded",
          status: "Completed",
          completedAt: "2025-06-28",
          impact: "+3 match",
        },
        {
          label: "Bias-aware resume anonymised",
          status: "Completed",
          completedAt: "2025-06-27",
          impact: "+3 fairness",
        },
        {
          label: "Exec panel prep notes shared",
          status: "In progress",
          impact: "Panel briefing scheduled",
        },
      ],
      skillAlignment: [
        {
          skill: "Enterprise Data Migration Leadership",
          status: "Yes",
          evidence: "Managed 20-person squad delivering multi-wave cutover and post-load reconciliation for ABC's FlexMAM rollout.",
        },
        {
          skill: "Insurance Platform & Guidewire Expertise",
          status: "Partial",
          evidence: "Owned Allianz → icare migration, partnering with Guidewire vendor teams though direct configuration was vendor-led.",
        },
        {
          skill: "Cloud-Native Data & Governance",
          status: "Yes",
          evidence: "Deployed AWS AppStream, Power BI governance, and active-active DR patterns across ABC and icare programmes.",
        },
      ],
      recommendation:
        "Priority interview. Present contract offer at $1,300 + super with 12-month view. Provide Guidewire solution deep dive during panel to validate partial exposure.",
      riskNotes: [
        "Bias score uplift (+3) indicates name anonymisation reduced heuristic discounting.",
        "Guidewire configuration detail relies on vendor partnership—mitigate via targeted case study question.",
      ],
      availability: "2 weeks' notice",
      compensation: "$1,300 + super (daily contract)",
    },
    {
      id: "candidate-priya-sharma",
      name: "Priya Sharma",
      currentRole: "Programme Manager · Elevate Insurance Tech",
      matchScore: 88,
      biasFreeScore: 91,
      experienceYears: 14,
      summary:
        "Led back-to-back cloud migrations for APAC insurers, specialising in Snowflake enablement and risk-managed cutovers.",
      highlights: [
        "Ran multi-country Guidewire PolicyCenter deployment with native Snowflake analytics layer and IFRS17 reporting.",
        "Designed ELT pipelines using Matillion + dbt, trimming reconciliation effort by 35% for a reinsurer portfolio.",
        "Built bias-aware project dashboards to surface diversity metrics in recruitment and resourcing decisions.",
      ],
      priority: "Warm",
      status: "Permanent succession pathway (6-week notice)",
      mustMatchFlags: [
        "Guidewire PolicyCenter leadership",
        "Cloud analytics enablement",
      ],
      recruiterNotes:
        "Aligns to permanent headcount strategy; schedule CFO alignment once notice-period mitigation plan is confirmed.",
      improvementJourney: [
        {
          label: "Snowflake enablement playbook uploaded",
          status: "Completed",
          completedAt: "2025-06-30",
          impact: "+2 match",
        },
        {
          label: "Company research briefing shared",
          status: "Completed",
          completedAt: "2025-07-01",
          impact: "Shows role commitment",
        },
        {
          label: "Notice-period negotiation",
          status: "In progress",
          impact: "Waiting for manager response",
        },
      ],
      skillAlignment: [
        {
          skill: "Enterprise Data Migration Leadership",
          status: "Yes",
          evidence: "Delivered dual-track legacy retirement across three APAC markets with Matillion-based orchestration.",
        },
        {
          skill: "Insurance Platform & Guidewire Expertise",
          status: "Yes",
          evidence: "Owns Guidewire PolicyCenter rollouts including integrations with claims and billing streams.",
        },
        {
          skill: "Cloud-Native Data & Governance",
          status: "Yes",
          evidence: "Instituted Snowflake data contracts and FinOps guardrails aligned to CFO reporting cadence.",
        },
      ],
      recommendation:
        "Great fit for permanent succession. Offer $210k + super with sign-on for 6-week notice. Use as secondary shortlist if contract budget limited.",
      riskNotes: [
        "Longer notice period (6 weeks).",
        "Preference for hybrid work 3 days on-site—align with stakeholder expectations.",
      ],
      availability: "6 weeks (serving notice)",
      compensation: "$210k + super (permanent)",
    },
    {
      id: "candidate-noah-taylor",
      name: "Noah Taylor",
      currentRole: "Data Migration Lead · CloudSphere",
      matchScore: 81,
      biasFreeScore: 84,
      experienceYears: 11,
      summary:
        "Technical delivery manager with strong Azure Synapse and Power Platform background, proven in government modernisations.",
      highlights: [
        "Executed state health data lake migration with zero downtime, leveraging Azure Synapse and Power BI governance.",
        "Introduced bias mitigation playbooks and tooling for recruitment in prior engagement, improving diversity metrics by 12%.",
        "Certified Matillion architect with experience bridging on-prem Oracle to Snowflake pipelines.",
      ],
      priority: "Pipeline",
      status: "Pipeline support (needs Guidewire exposure)",
      mustMatchFlags: [
        "Cloud governance",
        "Migration leadership",
      ],
      recruiterNotes:
        "Position as deputy for future public sector pods; pair with Guidewire SMEs to close platform gap.",
      improvementJourney: [
        {
          label: "Azure governance case study uploaded",
          status: "Completed",
          completedAt: "2025-06-26",
          impact: "+1 match",
        },
        {
          label: "Guidewire knowledge shadowing",
          status: "In progress",
          impact: "Shadow session booked with vendor SMEs",
        },
        {
          label: "Bias-mitigation refresher",
          status: "Queued",
          impact: "Will lift fairness confidence",
        },
      ],
      skillAlignment: [
        {
          skill: "Enterprise Data Migration Leadership",
          status: "Partial",
          evidence: "Owns technical tracks but limited exposure to programme-level budgeting and vendor commercials.",
        },
        {
          skill: "Insurance Platform & Guidewire Expertise",
          status: "No",
          evidence: "Experience centred on government services; no direct insurance platform delivery recorded.",
        },
        {
          skill: "Cloud-Native Data & Governance",
          status: "Yes",
          evidence: "Implemented Azure/Snowflake governance frameworks with detailed lineage and FinOps guardrails.",
        },
      ],
      recommendation:
        "Pipeline candidate for deputy role. Suitable as delivery lieutenant or for future public sector pods after insurance SMEs are secured.",
      riskNotes: [
        "No direct Guidewire exposure—would require shadowing period.",
        "Bias-free score sits lower due to skill coverage but no red flags identified.",
      ],
      availability: "Immediate",
      compensation: "$950 per day (contract)",
    },
  ],
  engagementInsights: [
    {
      label: "Recommended engagement",
      value: "12-month contract – David Wong",
      helper: "Delivers immediate expertise for red projects; avoids long-term headcount while meeting $90M programme milestones.",
    },
    {
      label: "Secondary pathway",
      value: "Permanent hire – Priya Sharma",
      helper: "Stronger for succession planning if budget shifts to FTE; requires longer onboarding due to notice period.",
    },
    {
      label: "Key risks to manage",
      value: "Guidewire solution depth & knowledge transfer",
      helper: "Schedule architecture deep dive within first 30 days and pair with existing vendor SMEs.",
    },
  ],
  fairnessInsights: [
    {
      label: "Bias-free uplift",
      value: "+3 points for Candidate Wong",
      helper: "Name anonymisation increased fairness score from 92 → 95, indicating prior heuristic discounting.",
    },
    {
      label: "Panel guidance",
      value: "Include data platform + business stakeholders",
      helper: "Ensures balanced evaluation across technical depth, insurance domain, and change leadership.",
    },
    {
      label: "Diversity check",
      value: "Shortlist spans genders and backgrounds",
      helper: "Maintain anonymised resume view for first-round scoring; disclose identifiers post-panel selection.",
    },
  ],
  interviewPreparation: [
    {
      question: "Describe a specific challenge you faced in your last transformation programme and the emotions you experienced while resolving it.",
      rationale: "Tests emotional intelligence and depth of ownership beyond resume bullet points.",
    },
    {
      question: "If we called your previous programme sponsor today, what would they say was your biggest contribution and where you still need support?",
      rationale: "Forces self-awareness and verifiable outcomes; flushes out rehearsed narratives.",
    },
    {
      question: "Walk us through a time you failed on a cutover or migration milestone. What happened and what changed as a result?",
      rationale: "Surface resilience and willingness to own setbacks instead of only successes.",
    },
    {
      question: "Explain Guidewire data model concepts to a non-technical operations manager.",
      rationale: "Ensures they can translate complex topics for business stakeholders.",
    },
    {
      question: "What was the culture like on your last programme and how did you influence it? Give tangible examples.",
      rationale: "Validates interpersonal awareness and specific behavioural examples.",
    },
    {
      question: "Describe your typical project cadence week. Include the meetings you lead and unexpected situations that surfaced.",
      rationale: "Demonstrates practical rhythm and ability to handle unplanned work.",
    },
    {
      question: "What is the most memorable migration you delivered and why did it stay with you?",
      rationale: "Authenticity check—memorable projects usually carry emotional detail.",
    },
    {
      question: "Tell us about a conflict with a vendor or colleague that changed your approach to delivery.",
      rationale: "Looks for humility and evidence of growth in collaboration.",
    },
    {
      question: "Which skill on your CV are you still mastering today? Outline the plan you have in place.",
      rationale: "Encourages honesty about development areas instead of perfection narratives.",
    },
    {
      question: "If you could redesign any process from your last programme, what would it be and why?",
      rationale: "Tests critical thinking and ability to improve delivery frameworks.",
    },
  ],
  disclaimers: [
    "Prototype output – do not use without human review.",
    "Scores are generated from resume text only; structured interviews still required.",
    "Bias mitigation score reflects anonymised analysis and should be paired with inclusive hiring practices.",
  ],
};

export type RecruiterDashboardMetric = {
  label: string;
  value: string;
  helper?: string;
  trend?: string;
};

export type RecruiterDashboardFilters = {
  skills: string[];
  locations: string[];
  experience: string;
  remoteFriendly: boolean;
  mustMatch: string[];
};

export type RecruiterDashboardCandidate = {
  id: string;
  name: string;
  currentRole: string;
  location: string;
  matchScore: number;
  biasFreeScore: number;
  priority: "High" | "Medium" | "Low";
  status: string;
  mustMatchFlags: string[];
  keySkills: string[];
  recruiterPriority: string;
  improvementJourney: RecruiterWorkflowImprovement[];
  lastActivity: string;
};

export type RecruiterDashboardJob = {
  jobId: string;
  title: string;
  location: string;
  contractType: string;
  priority: string;
  publishedAt: string;
  hiringManager: string;
  status: string;
  filters: RecruiterDashboardFilters;
  metrics: {
    totalApplicants: number;
    recommended: number;
    interviews: number;
    offers: number;
    improvementCount: number;
  };
  nextSteps: string[];
  recommendedCandidates: RecruiterDashboardCandidate[];
  notes?: string;
};

export type RecruiterDashboardData = {
  summaryMetrics: RecruiterDashboardMetric[];
  jobs: RecruiterDashboardJob[];
  applicantDatabase: RecruiterDashboardCandidate[];
};

export const fallbackRecruiterDashboard: RecruiterDashboardData = {
  summaryMetrics: [
    {
      label: "Active job profiles",
      value: "4",
      helper: "Monitored this week",
    },
    {
      label: "Avg match score delta",
      value: "+6 pts",
      helper: "Driven by applicant upskilling",
    },
    {
      label: "Priority outreach queue",
      value: "12 candidates",
      helper: "Flagged for recruiter follow-up",
    },
    {
      label: "Assessments completed",
      value: "68%",
      helper: "Voluntary tests across live roles",
    },
  ],
  jobs: [
    {
      jobId: "REQ-4581",
      title: "Senior Technical Project Manager – Data Transformation",
      location: "Sydney, NSW · Hybrid",
      contractType: "12-month programme",
      priority: "Hot fill",
      publishedAt: "2025-06-15",
      hiringManager: "Karen Li",
      status: "Shortlist ready",
      filters: {
        skills: ["Guidewire", "Data migration leadership", "Cloud governance"],
        locations: ["Sydney, NSW", "Remote"],
        experience: "12+ years enterprise delivery",
        remoteFriendly: true,
        mustMatch: ["Guidewire governance", "Cloud data strategy"],
      },
      metrics: {
        totalApplicants: 18,
        recommended: 3,
        interviews: 2,
        offers: 0,
        improvementCount: 5,
      },
      nextSteps: [
        "Share recruiter pack with Karen Li and programme sponsor",
        "Book vendor-led Guidewire solution deep dive",
      ],
      recommendedCandidates: [
        {
          id: "candidate-david-wong",
          name: "David Wong",
          currentRole: "Senior Technical Delivery Lead · ABC",
          location: "Sydney, NSW",
          matchScore: 92,
          biasFreeScore: 95,
          priority: "High",
          status: "Panel prep · ready for contract offer",
          mustMatchFlags: [
            "Guidewire programme governance",
            "Enterprise data migration leadership",
          ],
          keySkills: ["Guidewire integration", "Data migration", "Risk & controls"],
          recruiterPriority: "Immediate contract hire",
          improvementJourney: [
            {
              label: "Guidewire programme retrospective uploaded",
              status: "Completed",
              completedAt: "2025-06-28",
              impact: "+3 match",
            },
            {
              label: "Bias-aware resume anonymised",
              status: "Completed",
              completedAt: "2025-06-27",
              impact: "+3 fairness",
            },
            {
              label: "Exec panel prep notes shared",
              status: "In progress",
              impact: "Panel briefing scheduled",
            },
          ],
          lastActivity: "Updated 2 days ago",
        },
        {
          id: "candidate-priya-sharma",
          name: "Priya Sharma",
          currentRole: "Programme Manager · Elevate Insurance Tech",
          location: "Melbourne, VIC",
          matchScore: 88,
          biasFreeScore: 91,
          priority: "High",
          status: "Permanent succession · notice period running",
          mustMatchFlags: [
            "Guidewire PolicyCenter leadership",
            "Cloud analytics enablement",
          ],
          keySkills: ["Snowflake", "Guidewire", "Risk reporting"],
          recruiterPriority: "Line up as permanent hire",
          improvementJourney: [
            {
              label: "Snowflake enablement playbook uploaded",
              status: "Completed",
              completedAt: "2025-06-30",
              impact: "+2 match",
            },
            {
              label: "Company research briefing shared",
              status: "Completed",
              completedAt: "2025-07-01",
              impact: "Shows role commitment",
            },
            {
              label: "Notice-period negotiation",
              status: "In progress",
              impact: "Waiting for manager response",
            },
          ],
          lastActivity: "Updated 1 day ago",
        },
        {
          id: "candidate-noah-taylor",
          name: "Noah Taylor",
          currentRole: "Data Migration Lead · CloudSphere",
          location: "Brisbane, QLD",
          matchScore: 81,
          biasFreeScore: 84,
          priority: "Medium",
          status: "Pipeline support · needs Guidewire exposure",
          mustMatchFlags: ["Cloud governance"],
          keySkills: ["Azure Synapse", "Power BI", "Bias mitigation"],
          recruiterPriority: "Shadow for future pods",
          improvementJourney: [
            {
              label: "Azure governance case study uploaded",
              status: "Completed",
              completedAt: "2025-06-26",
              impact: "+1 match",
            },
            {
              label: "Guidewire knowledge shadowing",
              status: "In progress",
              impact: "Shadow session booked with vendor SMEs",
            },
            {
              label: "Bias-mitigation refresher",
              status: "Queued",
              impact: "Will lift fairness confidence",
            },
          ],
          lastActivity: "Updated 3 days ago",
        },
      ],
      notes: "Applicants improving their ranking trigger auto-alerts in this tile.",
    },
    {
      jobId: "REQ-4720",
      title: "Data Governance Lead – Retail Banking",
      location: "Melbourne, VIC · 3 days on-site",
      contractType: "Permanent",
      priority: "Active search",
      publishedAt: "2025-07-03",
      hiringManager: "Diego Martinez",
      status: "Shortlist building",
      filters: {
        skills: ["Data governance", "Regulatory compliance", "SQL"],
        locations: ["Melbourne, VIC", "Sydney, NSW"],
        experience: "8+ years in financial services",
        remoteFriendly: false,
        mustMatch: ["APRA reporting", "Stakeholder comms"],
      },
      metrics: {
        totalApplicants: 27,
        recommended: 4,
        interviews: 1,
        offers: 0,
        improvementCount: 9,
      },
      nextSteps: [
        "Review voluntary compliance assessments",
        "Confirm availability for panel on 4 Aug",
      ],
      recommendedCandidates: [
        {
          id: "candidate-sasha-iqbal",
          name: "Sasha Iqbal",
          currentRole: "Data Governance Manager · Southern Bank",
          location: "Melbourne, VIC",
          matchScore: 89,
          biasFreeScore: 93,
          priority: "High",
          status: "Panel ready · completed regulatory assessment",
          mustMatchFlags: ["APRA reporting"],
          keySkills: ["APRA CPG 235", "Data lineage", "Stakeholder comms"],
          recruiterPriority: "Advance to panel week of 4 Aug",
          improvementJourney: [
            {
              label: "APRA case study assessment",
              status: "Completed",
              completedAt: "2025-07-08",
              impact: "+4 match",
            },
            {
              label: "Company research briefing shared",
              status: "Completed",
              completedAt: "2025-07-07",
              impact: "+2 commitment",
            },
          ],
          lastActivity: "Updated today",
        },
        {
          id: "candidate-lucas-fern",
          name: "Lucas Fern",
          currentRole: "Senior Data Steward · ClearBank",
          location: "Sydney, NSW",
          matchScore: 84,
          biasFreeScore: 88,
          priority: "Medium",
          status: "Awaiting voluntary assessment",
          mustMatchFlags: ["APRA reporting"],
          keySkills: ["Data catalogues", "SQL", "Stakeholder comms"],
          recruiterPriority: "Nudge to complete compliance assessment",
          improvementJourney: [
            {
              label: "Bias-aware resume pass",
              status: "Completed",
              completedAt: "2025-07-04",
              impact: "+2 fairness",
            },
            {
              label: "Compliance readiness assessment",
              status: "Queued",
              impact: "Expected boost to match score",
            },
          ],
          lastActivity: "Updated 1 day ago",
        },
        {
          id: "candidate-adria-chen",
          name: "Adria Chen",
          currentRole: "Risk & Data Lead · Metro Credit Union",
          location: "Melbourne, VIC",
          matchScore: 79,
          biasFreeScore: 90,
          priority: "Medium",
          status: "Improving ranking via coursework",
          mustMatchFlags: ["Stakeholder comms"],
          keySkills: ["Data quality", "SQL", "Risk management"],
          recruiterPriority: "Monitor upskilling progress",
          improvementJourney: [
            {
              label: "RegTech micro-credential",
              status: "In progress",
              impact: "Course completes 20 Jul",
            },
            {
              label: "Panel interview rehearsal",
              status: "Queued",
              impact: "Book once coursework complete",
            },
          ],
          lastActivity: "Updated 2 days ago",
        },
        {
          id: "candidate-tamara-diaz",
          name: "Tamara Diaz",
          currentRole: "Analytics Governance Lead · Horizon Mutual",
          location: "Brisbane, QLD",
          matchScore: 77,
          biasFreeScore: 85,
          priority: "Low",
          status: "Draft shortlist · awaiting references",
          mustMatchFlags: ["APRA reporting"],
          keySkills: ["Data lineage", "Tableau", "Stakeholder comms"],
          recruiterPriority: "Collect references before panel",
          improvementJourney: [
            {
              label: "Reference check kickoff",
              status: "In progress",
              impact: "Results expected this week",
            },
          ],
          lastActivity: "Updated 3 days ago",
        },
      ],
    },
  ],
  applicantDatabase: [
    {
      id: "candidate-david-wong",
      name: "David Wong",
      currentRole: "Senior Technical Delivery Lead · ABC",
      location: "Sydney, NSW",
      matchScore: 92,
      biasFreeScore: 95,
      priority: "High",
      status: "Panel prep · ready for contract offer",
      mustMatchFlags: ["Guidewire programme governance"],
      keySkills: ["Guidewire integration", "Data migration", "Risk & controls"],
      recruiterPriority: "Immediate contract hire",
      improvementJourney: [
        {
          label: "Guidewire programme retrospective uploaded",
          status: "Completed",
          completedAt: "2025-06-28",
          impact: "+3 match",
        },
        {
          label: "Bias-aware resume anonymised",
          status: "Completed",
          completedAt: "2025-06-27",
          impact: "+3 fairness",
        },
      ],
      lastActivity: "Updated 2 days ago",
    },
    {
      id: "candidate-priya-sharma",
      name: "Priya Sharma",
      currentRole: "Programme Manager · Elevate Insurance Tech",
      location: "Melbourne, VIC",
      matchScore: 88,
      biasFreeScore: 91,
      priority: "High",
      status: "Permanent succession · notice period running",
      mustMatchFlags: ["Guidewire PolicyCenter leadership"],
      keySkills: ["Snowflake", "Guidewire", "Risk reporting"],
      recruiterPriority: "Line up as permanent hire",
      improvementJourney: [
        {
          label: "Snowflake enablement playbook uploaded",
          status: "Completed",
          completedAt: "2025-06-30",
          impact: "+2 match",
        },
        {
          label: "Company research briefing shared",
          status: "Completed",
          completedAt: "2025-07-01",
          impact: "Shows role commitment",
        },
      ],
      lastActivity: "Updated 1 day ago",
    },
    {
      id: "candidate-sasha-iqbal",
      name: "Sasha Iqbal",
      currentRole: "Data Governance Manager · Southern Bank",
      location: "Melbourne, VIC",
      matchScore: 89,
      biasFreeScore: 93,
      priority: "High",
      status: "Panel ready · completed regulatory assessment",
      mustMatchFlags: ["APRA reporting"],
      keySkills: ["APRA CPG 235", "Data lineage", "Stakeholder comms"],
      recruiterPriority: "Advance to panel week of 4 Aug",
      improvementJourney: [
        {
          label: "APRA case study assessment",
          status: "Completed",
          completedAt: "2025-07-08",
          impact: "+4 match",
        },
      ],
      lastActivity: "Updated today",
    },
    {
      id: "candidate-lucas-fern",
      name: "Lucas Fern",
      currentRole: "Senior Data Steward · ClearBank",
      location: "Sydney, NSW",
      matchScore: 84,
      biasFreeScore: 88,
      priority: "Medium",
      status: "Awaiting voluntary assessment",
      mustMatchFlags: ["APRA reporting"],
      keySkills: ["Data catalogues", "SQL", "Stakeholder comms"],
      recruiterPriority: "Nudge to complete compliance assessment",
      improvementJourney: [
        {
          label: "Bias-aware resume pass",
          status: "Completed",
          completedAt: "2025-07-04",
          impact: "+2 fairness",
        },
        {
          label: "Compliance readiness assessment",
          status: "Queued",
          impact: "Expected boost to match score",
        },
      ],
      lastActivity: "Updated 1 day ago",
    },
    {
      id: "candidate-adria-chen",
      name: "Adria Chen",
      currentRole: "Risk & Data Lead · Metro Credit Union",
      location: "Melbourne, VIC",
      matchScore: 79,
      biasFreeScore: 90,
      priority: "Medium",
      status: "Improving ranking via coursework",
      mustMatchFlags: ["Stakeholder comms"],
      keySkills: ["Data quality", "SQL", "Risk management"],
      recruiterPriority: "Monitor upskilling progress",
      improvementJourney: [
        {
          label: "RegTech micro-credential",
          status: "In progress",
          impact: "Course completes 20 Jul",
        },
      ],
      lastActivity: "Updated 2 days ago",
    },
  ],
};
