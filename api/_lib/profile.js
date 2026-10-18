// Master profile: the only source of facts the generator may use.
// Edit here (or in the app's Profile editor) when something real changes.

export const DEFAULT_PROFILE = {
  name: "Vamshi Krishna Balupari",
  contact: {
    location: "Houston, TX",
    phone: "+1 (660) 493-5399",
    email: "vamshikrishnabalupari@gmail.com",
    linkedin: "https://www.linkedin.com/in/vamshikrishnabalupari/",
    github: "https://github.com/Vamshi6665",
  },
  yearsExperience: "4+",

  // Numbers the resume is allowed to use. Nothing else numeric may appear in bullets.
  // Numbers the resume is allowed to use, tagged with the role they belong to.
  // A number may only appear in bullets of its own role (or a project linked to that role). "general" = anywhere.
  metricsBank: [
    { value: "40+", role: "dxc", meaning: "regional SQL Server sources consolidated into centralized analytical datasets" },
    { value: "5 million", role: "dxc", meaning: "approximate reporting records covered by consolidated datasets" },
    { value: "90%", role: "dxc", meaning: "reduction in recurring reporting errors after automated validation and reconciliation, stated as 'more than 90%'" },
    { value: "25%", role: "dxc", meaning: "reduction in storage-related escalations from capacity forecasting and threshold monitoring" },
    { value: "80%", role: "dxc", meaning: "device utilization threshold that triggered proactive storage upgrades" },
    { value: "7", role: "lama", meaning: "paper and spreadsheet logs replaced by the TIFA inventory system" },
    { value: "8", role: "lama", meaning: "CSV exports migrated into PostgreSQL history tables (TIFA)" },
    { value: "4", role: "nwmsu", meaning: "programming languages parsed by the CodeRepoReader static analyzer (Python, JavaScript, Java, C#)" },
    { value: "3", role: "nwmsu", meaning: "LLMs integrated and compared in CodeRepoReader (GPT-4o, GPT-4o Mini, Llama 3.1 70B)" },
    { value: "2", role: "nwmsu", meaning: "agent SDKs benchmarked (OpenAI SDK, GitHub Copilot SDK); also SHAP and Anchor as 2 complementary explanation methods" },
    { value: "4", role: "applyforge", meaning: "LLM pipeline stages in ApplyForge (role analysis, generation, technical review, outreach)" },
    { value: "20", role: "applyforge", meaning: "labeled job descriptions in ApplyForge's evaluation suite across 4 role families" },
    { value: "4+", role: "general", meaning: "years of professional experience" },
    { value: "4.0", role: "general", meaning: "M.S. GPA" },
  ],

  experience: [
    {
      id: "lama",
      company: "LAMA Desserts LLC",
      location: "Houston, TX",
      title: "Data Associate",
      altTitles: ["Data Analyst", "Data Engineer", "Analytics Engineer", "Software Engineer"],
      dates: "Jul 2026 – Present",
      current: true,
      // How this same real work is presented for each role type. Every angle is backed by the facts below.
      lenses: {
        data_engineer: "Owns the business's data platform end to end: CSV and spreadsheet ingestion with Python/Pandas, PostgreSQL schema and append-only history design, migration of 8 legacy exports, parsing and validation rules that quarantine unparseable values, reusable SQL views, and automated weekly/monthly data preparation.",
        data_analyst_bi: "Analytics owner for the business: translates owner questions into KPIs, builds Power BI models and DAX measures for sales, consumption, product contribution, and reorder thresholds, surfaces slow-moving stock, and runs weekly and monthly business reviews.",
        analytics_engineer: "Models the business's analytical layer: normalized PostgreSQL tables, append-only fact-style count history, conformed product/vendor attributes, reusable SQL views with consistent business identifiers, feeding a Power BI semantic model.",
        data_scientist_ml: "Builds the data foundation for demand analysis: dated, append-only inventory history suitable for consumption trend analysis, cleaned and validated with Python/Pandas, with threshold logic and exception lists that inform replenishment decisions. No ML model is deployed here; do not claim one.",
        ml_llm_engineer: "Delivered a production data application end to end using AI-assisted development, with structured data modeling, validation logic, and deployment on Vercel. No LLM feature runs inside the product; do not claim one.",
        software_engineer: "Built and deployed a production web application: Supabase Auth, PostgreSQL schema with triggers, indexes, and row-level security, supabase-js JavaScript frontend (login, dashboard, migration pages), reorder parsing logic, SheetJS Excel export, hosted on Vercel.",
        business_analyst: "Requirements and process owner: replaced 7 paper and spreadsheet logs, mapped owner requests to reporting requirements and source mappings, defined reorder thresholds and exception handling, delivered dashboards used for purchasing decisions.",
        product_analyst: "Product and metrics owner for an internal inventory tool: defined the metrics, reorder rules, and exception workflow, measured product contribution and consumption, and iterated features from owner feedback.",
      },
      facts: [
        "Built and deployed TIFA, a production inventory analytics web app for a chocolate and gelato business, replacing 7 paper and spreadsheet logs.",
        "Stack: Supabase PostgreSQL, Supabase Auth, supabase-js, vanilla HTML/CSS/JavaScript frontend, hosted on Vercel; Python and Pandas for data preparation.",
        "Schema: inventory_items (category, unit type, par level threshold with audit note, supplier, status enum, updated_at trigger) and append-only inventory_counts history; indexes on category, status, item, date; row-level security on both tables.",
        "Migrated 8 CSV exports: historical count columns converted to dated history rows with recorder initials preserved; free-text thresholds parsed into numeric par levels.",
        "Reorder logic parses flexible count values (e.g., '1 new + 3', percentages) against par levels; unparseable values routed to a manual-review list.",
        "Dashboard: stat cards, reorder schedule, per-item history, Excel export (SheetJS).",
        "Builds Power BI dashboards, data models, and DAX measures for sales performance, inventory consumption, product contribution, and reorder thresholds.",
        "Translates owner requests into reporting requirements, source mappings, and SQL transformations; reusable SQL views joining transactions, products, vendors, and inventory snapshots.",
        "Automates weekly and monthly data preparation for business reviews with Python and SQL.",
      ],
    },
    {
      id: "nwmsu",
      company: "Northwest Missouri State University",
      location: "Maryville, MO",
      title: "Research Assistant",
      altTitles: ["Graduate Research Assistant", "Machine Learning Research Assistant", "AI Research Assistant", "Data Research Assistant"],
      dates: "May 2025 – Apr 2026",
      lenses: {
        data_engineer: "Engineered reproducible data preparation for research experiments: Python, Pandas, and SQL preprocessing, validation, and versioned feature datasets; built a static-analysis extraction pipeline (Python AST plus regex) that turns raw repositories into structured metadata for downstream LLM use.",
        data_analyst_bi: "Analyzed model results and error patterns, translated SHAP and Anchor explanations into findings nontechnical collaborators could act on, and compared benchmark results across SDKs for a research paper.",
        analytics_engineer: "Built validated, reproducible experiment datasets with SQL and Pandas, standardized evaluation outputs for comparison across runs, and documented methodology for a co-authored paper.",
        data_scientist_ml: "Prepared features, trained and evaluated predictive models, ran error analysis, and built an explainability framework with SHAP (global/local attribution) and Anchor (rule-based local explanations) aligned to NIST AI RMF.",
        ml_llm_engineer: "Built CodeRepoReader AI, a repository-aware LLM agent grounding GPT-4o / Llama 3.1 answers in Python AST static analysis; benchmarked OpenAI SDK vs GitHub Copilot SDK on context handling, tool integration, and response quality; co-authored the comparative paper.",
        software_engineer: "Built CodeRepoReader AI as a Flask web app and CLI: repository upload or GitHub URL input, static analyzer for Python/JS/Java/C#, per-session analysis cache, streaming sessions, ported to the OpenAI SDK and deployed on Vercel serverless.",
        business_analyst: "Translated research questions into evaluation criteria, compared SDK and model results, and communicated explainability findings to technical and nontechnical stakeholders.",
        product_analyst: "Defined evaluation criteria for developer-facing AI tools (context handling, tool integration, response quality), compared two SDKs, and turned results into recommendations in a co-authored paper.",
      },
      facts: [
        "Prepared machine learning datasets with Python, Pandas, and SQL: preprocessing, feature engineering, validation for reproducible experiments.",
        "Model evaluation and error analysis comparing predictive results and identifying limitations affecting interpretation.",
        "Built an explainable AI framework with SHAP (global and local feature attribution) and Anchor (rule-based local explanations), aligned to NIST AI RMF governance; made model behavior understandable to technical and nontechnical collaborators.",
        "Built CodeRepoReader AI: repository-aware explanations combining LLMs, agent workflows, and Python AST static analysis (language breakdown, classes/functions, dependencies, entry points, architecture patterns).",
        "Benchmarked OpenAI SDK vs GitHub Copilot SDK on context handling, tool integration, and response quality; co-authored research paper on the comparison.",
        "Also served as Data Associate at the NWMSU CITE Office.",
      ],
    },
    {
      id: "dxc",
      company: "DXC Technology",
      location: "Hyderabad, India",
      title: "Analyst",
      altTitles: ["Data Engineer", "Data Analyst", "Analytics Engineer", "Associate Data Engineer", "BI Analyst"],
      dates: "Jul 2021 – Dec 2024",
      lenses: {
        data_engineer: "Enterprise data engineering: ADF + Databricks PySpark + Snowflake ELT across 40+ sources (~5M records), S3/Glue/Athena lake with raw-validated-curated layers, incremental loads and backfills, CloudWatch monitoring and incident recovery, automated reconciliation (90%+ fewer errors), Git/Azure DevOps releases.",
        data_analyst_bi: "Enterprise BI: Power BI semantic models, DAX, RLS, scheduled refresh for regional stakeholders; KPI definitions standardized across regions; utilization dashboard with 80% threshold driving proactive upgrades (25% fewer escalations); UAT, discrepancy resolution, user training.",
        analytics_engineer: "Warehouse modeling: source-to-target mappings, star schemas with fact tables and conformed dimensions, standardized business keys, reusable SQL/T-SQL views, tested reconciliation, Power BI semantic layer, documentation of transformation logic.",
        data_scientist_ml: "Data and forecasting work: curated historical utilization datasets, forecasting and scenario analysis informing capacity recommendations (25% fewer escalations), large-scale PySpark feature standardization, data quality controls on model inputs.",
        ml_llm_engineer: "Production data foundations behind analytics: PySpark pipelines, curated layers, monitoring and recovery, forecasting datasets, CI/CD with Azure DevOps. No LLM work here; frame as data and platform reliability.",
        software_engineer: "Production engineering on data services: Python and SQL services, Git and Azure DevOps CI with code review and automated checks, monitoring with CloudWatch, alerting, retries and recovery, root-cause analysis of schema and source failures, runbooks.",
        business_analyst: "Requirements to delivery: business requirements converted into source-to-target mappings, transformation specs, and acceptance criteria; UAT and release support; KPI standardization; stakeholder training.",
        product_analyst: "Metrics and reporting product: defined consistent cross-region KPIs, delivered self-service dashboards, drove adoption through UAT and training, and used utilization trends to change operational decisions.",
      },
      note: "Do not name clients on the resume. Engagement framing may be adapted to the target role, but every claim must stay consistent with these facts.",
      facts: [
        "ETL/ELT with Azure Data Factory, Databricks (PySpark), and Snowflake consolidating 40+ regional SQL Server sources into centralized analytical datasets (~5 million reporting records).",
        "Converted reporting requirements into source-to-target mappings, transformation specs, data models, and acceptance criteria.",
        "SQL, T-SQL, reusable views, and PySpark transformations for application volumes, processing times, and workloads.",
        "Profiled source schemas, identifiers, data types; standardized business keys and regional classifications for cross-region comparability.",
        "Designed fact tables, conformed dimensions, and star schemas.",
        "Automated data validation and source-to-target reconciliation: recurring reporting errors reduced by more than 90%.",
        "Power BI semantic models, DAX measures, dashboards; row-level security and scheduled refresh for regional stakeholders.",
        "Supported UAT, reporting releases, calculation discrepancy resolution, user training.",
        "Storage telemetry pipelines: Python, SQL, Amazon S3, AWS Glue; PySpark standardization of device IDs, timestamps, capacity units, utilization calculations.",
        "Raw, validated, and curated layers (medallion-style layering); incremental processing and controlled backfills; partitioned Parquet with Amazon Athena.",
        "Daily CSV utilization files landed via ADF into ADLS, transformed in Databricks, loaded into Snowflake (COPY INTO) per-device history, Power BI dashboard with 80% utilization threshold used for proactive upgrades.",
        "Monitored runs with Amazon CloudWatch; alerting, retries, recovery; traced source availability and schema changes in production incidents.",
        "Forecasting and scenario analysis on historical utilization informed capacity recommendations: 25% reduction in storage-related escalations.",
        "Git and Azure DevOps release workflows with code review and automated checks; documented transformation logic and recovery runbooks.",
        "Optimized SQL queries and shared reporting datasets, simplifying repeated calculations for recurring and ad hoc requests.",
        "Received a Best Employee award.",
      ],
    },
  ],

  projects: [
    {
      id: "tifa",
      role: "lama",
      name: "TIFA Inventory Analytics Platform",
      stack: ["PostgreSQL", "Supabase", "JavaScript", "Python", "Pandas", "Vercel", "SheetJS", "Power BI"],
      facts: [
        "Production system in daily use at LAMA Desserts (see LAMA facts). Can be presented as a project when a full-stack or analytics angle is needed; avoid repeating the same bullet in both places.",
        "Single-owner v1; schema designed to add roles later. Do not claim multi-user or multi-role.",
      ],
    },
    {
      id: "coderepo",
      role: "nwmsu",
      name: "CodeRepoReader AI",
      stack: ["Python", "OpenAI SDK", "GitHub Copilot SDK", "Flask", "AST", "GPT-4o", "Llama 3.1", "Vercel"],
      facts: [
        "Conversational codebase analysis agent: clone or upload a repository, static analysis with Python ast plus regex for JS/Java/C#, grounded Q&A with GPT-4o, GPT-4o Mini, and Llama 3.1 70B via GitHub Models.",
        "CLI variant built on the GitHub Copilot SDK with event-driven streaming sessions.",
        "Per-session analysis cache; Flask REST endpoints for repository upload and Q&A; ported the Flask app to the OpenAI SDK and deployed it on Vercel serverless.",
        "Comparative study of multi-model SDKs, co-authored research paper.",
      ],
    },
    {
      id: "xai",
      role: "nwmsu",
      name: "Explainable ML Pipeline (SHAP and Anchor)",
      stack: ["Python", "scikit-learn", "SHAP", "Anchor", "Pandas", "NIST AI RMF"],
      facts: [
        "Model explainability pipeline combining SHAP attributions with Anchor rule explanations; governance documentation aligned to NIST AI RMF.",
      ],
    },
    {
      id: "instacart",
      role: "personal",
      name: "Instacart Market Basket ETL Pipeline",
      stack: ["PySpark", "Apache Airflow", "Python"],
      // Needs more facts from Vamshi: tables produced, data volume, storage format, checks.
      facts: [
        "Batch ETL over the public Instacart orders dataset: PySpark transformations orchestrated with Apache Airflow DAGs into analysis-ready tables.",
      ],
    },
    {
      id: "applyforge",
      role: "applyforge",
      name: "ApplyForge (AI Resume Copilot)",
      stack: ["React", "Vite", "Node.js", "OpenAI SDK", "Vercel", "JSON Schema", "Node.js test runner"],
      facts: [
        "Self-hosted application that analyzes a job description and generates a restructured one-page resume, recruiter email, and LinkedIn note.",
        "4-stage LLM pipeline (role analysis, generation, technical critic review, outreach) on the OpenAI SDK with JSON Schema structured outputs; React/Vite frontend; Vercel serverless REST endpoints; deployed live.",
        "Deterministic quality gates: lint rules for weak verbs, unsupported numbers, metric ownership by role, non-technical skills, copied text; JD-to-profile term matching that separates matched, bridgeable, and missing tools.",
        "Evaluation harness over 20 labeled job descriptions in 4 role families: automated metrics (role classification, JD tool recall, unsupported claims, variation between JDs) plus an LLM recruiter-judge rubric.",
        "Unit tests with the Node.js test runner covering lint rules, schema validity, and DOCX export; DOCX and PDF export of a one-page resume.",
      ],
    },
    {
      id: "edgecare",
      role: "personal",
      name: "EdgeCare Triage",
      stack: ["Android", "TensorFlow Lite", "OpenCV"],
      // Needs more facts from Vamshi: language (Java or Kotlin), model, what it triages.
      facts: ["Android app performing on-device ML inference with TensorFlow Lite and OpenCV."],
    },
  ],

  // Technologies Vamshi can defend in an interview. Strict mode uses only these.
  skillInventory: {
    Languages: ["SQL", "T-SQL", "Python", "PySpark", "Spark SQL", "DAX", "Power Query M", "JavaScript"],
    Libraries: ["Pandas", "NumPy", "scikit-learn", "SHAP", "Anchor", "OpenAI SDK", "GitHub Copilot SDK", "Flask", "React"],
    "Databases & Warehousing": ["SQL Server", "PostgreSQL", "Snowflake", "Supabase"],
    "Data Integration & Orchestration": ["Azure Data Factory", "AWS Glue", "dbt", "Apache Airflow", "Databricks Workflows"],
    "Data Processing": ["Apache Spark", "Azure Databricks", "Delta Lake", "Apache Parquet"],
    // Medallion = the raw/validated/curated layering at DXC. REST APIs = CodeRepoReader Flask endpoints and ApplyForge serverless endpoints.
    "Business Intelligence": ["Power BI Desktop", "Power BI Service", "Tableau", "Microsoft Excel", "Power Query"],
    "Cloud Services": ["Amazon S3", "Amazon Athena", "AWS Lambda", "Amazon CloudWatch", "AWS IAM", "ADLS Gen2", "Azure Synapse", "Vercel"],
    "AI / ML": ["LLM application development", "Prompt engineering", "Agent workflows", "Model evaluation", "Feature engineering", "TensorFlow Lite", "OpenCV"],
    "Data Modeling & Architecture": ["Dimensional Modeling", "Star Schema", "Medallion Architecture", "Incremental Processing", "Source-to-Target Mapping", "Row-Level Security"],
    "APIs & Web": ["REST APIs", "Flask", "React", "Node.js", "Vercel Serverless Functions", "JSON Schema"],
    "Development Tools": ["Git", "GitHub", "Azure DevOps", "Terraform", "Docker", "Jupyter Notebook", "Node.js", "Vite", "Node.js test runner", "Unit testing"],
  },

  certifications: [
    "Microsoft Certified: Azure Data Engineer Associate (DP-203)",
    "Microsoft Certified: Power BI Data Analyst Associate (PL-300)",
    "Microsoft Certified: Azure Fundamentals (AZ-900)",
    "AWS Certified Cloud Practitioner",
  ],

  education: [
    {
      school: "Northwest Missouri State University",
      degree: "M.S. in Applied Computer Science",
      location: "Maryville, MO",
      dates: "Jan 2025 – May 2026",
      detail: "GPA 4.0",
    },
  ],

  signature: [
    "Best regards,",
    "Vamshi Krishna Balupari",
    "+1 (660) 493-5399 | vamshikrishnabalupari@gmail.com",
    "linkedin.com/in/vamshikrishnabalupari",
  ],
};
