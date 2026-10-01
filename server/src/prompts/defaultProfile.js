// The default profile ships with the app so it works out of the box.
// Anyone can replace it in the UI (Profile panel); the edited profile is sent
// with each request and takes priority over this one.

export const DEFAULT_PROFILE = {
  name: 'Vamshi Krishna Balupari',
  firstName: 'Vamshi',
  headline: 'Data and AI professional',
  years: '4+',
  location: 'Houston, TX',
  email: 'vamshikrishnabalupari@gmail.com',
  linkedin: 'linkedin.com/in/vamshikrishnabalupari',
  education: "Master's in Applied Computer Science, Northwest Missouri State University (GPA 4.0)",
  educationShort: 'MS in Computer Science',
  certifications: ['PL-300', 'DP-203', 'AZ-900', 'AWS Cloud Practitioner'],
  certsShort: 'PL-300, DP-203, and AWS certifications',
  skills: [
    'SQL', 'Python', 'PySpark', 'Spark', 'Kafka', 'Power BI', 'DAX', 'Power Query', 'Excel',
    'Snowflake', 'Azure', 'Azure Data Factory', 'Databricks', 'ADLS', 'Synapse', 'AWS',
    'Scikit-learn', 'SHAP', 'Anchor', 'Machine Learning', 'Explainable AI', 'ETL', 'ELT',
    'Data Pipelines', 'Data Quality', 'Data Modeling', 'Dashboards', 'Data Visualization',
    'Automation', 'PostgreSQL', 'Supabase', 'JavaScript', 'Node.js', 'React', 'REST APIs',
    'Git', 'Statistics', 'A/B Testing', 'Stakeholder Communication', 'SharePoint', 'LLM', 'Generative AI',
  ],
  metrics: [
    'Built pipelines processing 5M+ daily records',
    'Consolidated 40+ regional databases',
    'Reduced pipeline errors by 90%+',
    'Cut incident escalations by 25%',
    'Delivered Power BI dashboards for 200+ stakeholders',
  ],
  experience: [
    {
      role: 'Data Analyst Intern',
      org: 'Tifa',
      dates: 'Jul 2026 to Present',
      summary: 'Built and deployed a production inventory analytics system (Supabase PostgreSQL, JavaScript, Vercel) replacing 7 paper and spreadsheet logs, with reorder alerts and history tracking.',
    },
    {
      role: 'Research Assistant and Data Associate',
      org: 'Northwest Missouri State University',
      dates: 'May 2025 to Apr 2026',
      summary: 'Explainable AI research with SHAP and Anchor; benchmarked multi-model SDKs for CodeRepoReader, a conversational codebase analysis agent.',
    },
    {
      role: 'Data Engineer / Analyst',
      org: 'DXC Technology (clients: VFS Global, AT&T, SAP)',
      dates: 'Jun 2021 to Dec 2024',
      summary: 'Enterprise pipelines (ADF, Databricks/PySpark, Snowflake) feeding Power BI; storage utilization monitoring with an 80% threshold dashboard; Best Employee award.',
    },
  ],
  goldEmail: `Hi Jeff,
My name is Vamshi Krishna Balupari, and I am a Data and AI professional with 4+ years of experience working with Python, SQL, Power BI, Azure, Databricks, Snowflake, data pipelines, automation, system integrations, and enterprise data solutions. I recently completed my Master's in Applied Computer Science from Northwest Missouri State University and hold PL-300, DP-203, and AWS certifications.
I am writing to express my interest in the Data Engineer Contractor opportunity at NVIDIA. The role strongly aligns with my experience in building and supporting data pipelines, large-scale datasets, dashboards, data-quality workflows, automation, and AI-focused solutions. I am particularly interested in the opportunity to work on GenAI datasets and human annotation workflows while contributing across both data engineering and software engineering.
I have attached my resume for your review. I would appreciate the opportunity to discuss how my technical background, experience solving complex data problems, and ability to build and own data systems end-to-end could contribute to your team at NVIDIA.
Thank you for your time and consideration. I look forward to hearing from you.
Best regards,
Vamshi`,
  goldLinkedin:
    "Hi [Name], I'm Vamshi, a Data and AI professional with 4+ years of experience in data and AI field. I recently completed my MS in Computer Science and hold PL-300, DP-203, and AWS certifications. I'm exploring relevant opportunities and would be glad to connect and discuss.",
  resumeText: '',
};
