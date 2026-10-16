// 20 labeled test job descriptions (fictional companies, modeled on common 2026 postings).
// expected: archetypes a strong reader would assign. trap: what the case is designed to test.

export const JDS = [
  // ───────────── DATA ANALYST ─────────────
  {
    id: "da1", family: "data_analyst", expected: ["data_analyst_bi"], company: "Meridian Health Partners",
    title: "Data Analyst, Clinical Operations",
    trap: "Healthcare domain the profile does not have; Tableau over Power BI",
    text: `Meridian Health Partners is looking for a Data Analyst to support Clinical Operations across 14 outpatient clinics. You will own recurring operational reporting on patient throughput, appointment no-shows, and staffing utilization, and partner with clinic directors to turn questions into metrics they can act on.

Responsibilities
- Write and optimize SQL against our EHR reporting warehouse (SQL Server) to build analysis-ready datasets
- Build and maintain Tableau dashboards for weekly operations reviews; retire manual Excel reports
- Define KPIs with clinical leaders and document metric logic so numbers match across teams
- Investigate data quality issues with the data engineering team and validate fixes
- Present findings and recommendations to non-technical stakeholders

Qualifications
- 3+ years in a data analyst or BI role
- Strong SQL (joins, window functions, CTEs); advanced Excel
- Tableau or Power BI dashboard development
- Experience translating ambiguous business questions into analysis
- Healthcare data experience (claims, EHR, scheduling) preferred
- Familiarity with HIPAA and handling PHI preferred`,
  },
  {
    id: "da2", family: "data_analyst", expected: ["data_analyst_bi"], company: "Crestline Logistics",
    title: "Power BI Developer / BI Analyst",
    trap: "Near-perfect match; tests that it leads with PL-300 and semantic modeling, not pipelines",
    text: `Crestline Logistics is hiring a BI Analyst to own our Power BI environment for finance and operations. You will design semantic models, write DAX, and deliver dashboards used by 300+ managers across regional hubs.

What you will do
- Design star-schema semantic models in Power BI and write performant DAX measures
- Build executive and operational dashboards for on-time delivery, cost per shipment, and hub utilization
- Implement row-level security, incremental refresh, and deployment pipelines in Power BI Service
- Write SQL in Azure SQL and Snowflake to prepare data; use Power Query for light transformation
- Gather requirements with finance and ops leaders; own KPI definitions and documentation
- Train business users and drive self-service adoption

Requirements
- 3+ years building Power BI solutions in production
- Expert DAX and data modeling; strong SQL
- Experience with Power BI Service administration, RLS, and refresh scheduling
- PL-300 certification preferred
- Excellent stakeholder communication`,
  },
  {
    id: "da3", family: "data_analyst", expected: ["data_engineer", "analytics_engineer"], company: "Fieldstone Retail",
    title: "Data Analyst",
    trap: "Title says analyst; duties are ingestion pipelines, Airflow, dbt, BigQuery (archetype trap + GCP gap)",
    text: `Fieldstone Retail is looking for a Data Analyst to join our small data team. Most of this role is building and maintaining the pipelines that feed our reporting.

You will
- Build and maintain Python ingestion jobs that load POS, e-commerce, and loyalty data into BigQuery
- Orchestrate daily and hourly loads in Apache Airflow (Cloud Composer) and monitor failures
- Model raw data into clean, tested tables with dbt; write data tests and documentation
- Partner with merchandising to make sure tables answer their questions
- Occasionally build Looker Studio dashboards for ad hoc requests

You have
- 2 to 4 years of experience with Python and SQL in a data role
- Experience with Airflow or another orchestrator
- dbt experience strongly preferred
- Cloud data warehouse experience (BigQuery, Snowflake, or Redshift)
- Comfortable owning pipelines end to end, including on-call for failed loads`,
  },
  {
    id: "da4", family: "data_analyst", expected: ["product_analyst"], company: "Lumen Learning Apps",
    title: "Product Data Analyst",
    trap: "Experimentation and product funnels; profile has no A/B testing",
    text: `Lumen builds learning apps used by 4 million students. Our Product Data Analyst partners with product managers to understand user behavior and measure what we ship.

Responsibilities
- Define product metrics (activation, retention, engagement) and maintain a metrics layer
- Design and analyze A/B tests; communicate statistical significance and tradeoffs
- Build funnel and cohort analyses in SQL and Python
- Create Looker dashboards and self-serve explores for product teams
- Turn analysis into roadmap recommendations

Requirements
- 2+ years in product analytics, growth analytics, or data science
- Advanced SQL; Python (pandas) for analysis
- Experience with experimentation and basic statistics (hypothesis testing, confidence intervals)
- Looker, Tableau, or Power BI
- Product sense and clear written communication`,
  },
  {
    id: "da5", family: "data_analyst", expected: ["data_analyst_bi"], company: "Harbor Foods Distribution",
    title: "Inventory & Supply Chain Data Analyst",
    trap: "Strong LAMA/TIFA lens; forecasting language without an ML model",
    text: `Harbor Foods Distribution supplies 600 restaurants and grocers. We need a Supply Chain Data Analyst to improve inventory accuracy and replenishment decisions.

What you will do
- Analyze inventory levels, consumption, and supplier lead times to recommend reorder points and par levels
- Build Power BI dashboards for stock health, slow-moving and expiring inventory, and fill rate
- Write SQL against our ERP data (PostgreSQL) and automate recurring reports with Python
- Clean and reconcile inventory counts between warehouse systems and spreadsheets
- Support demand planning with historical trend analysis
- Work directly with purchasing managers and warehouse leads

Requirements
- 2+ years of analytics experience, ideally in inventory, supply chain, or operations
- SQL, Excel, and Power BI
- Python for automation and data cleaning
- Comfortable working with messy operational data`,
  },

  // ───────────── DATA ENGINEER ─────────────
  {
    id: "de1", family: "data_engineer", expected: ["data_engineer"], company: "Northgate Insurance",
    title: "Data Engineer (Azure)",
    trap: "Near-perfect Azure match; tests depth and arc coverage",
    text: `Northgate Insurance is modernizing its data platform on Azure. We are hiring a Data Engineer to build and operate lakehouse pipelines for policy, claims, and billing data.

Responsibilities
- Build ingestion and transformation pipelines with Azure Data Factory and Azure Databricks (PySpark)
- Implement medallion architecture (bronze, silver, gold) on ADLS Gen2 with Delta Lake
- Develop dimensional models in Azure Synapse / Databricks SQL for reporting
- Implement data quality checks, reconciliation, and alerting
- Build CI/CD for pipelines with Azure DevOps and Git
- Optimize Spark jobs for cost and performance; support production incidents

Requirements
- 3+ years of data engineering experience
- Strong PySpark and SQL
- Azure Data Factory, Databricks, Delta Lake, ADLS
- Dimensional modeling and data warehousing concepts
- DP-203 a plus`,
  },
  {
    id: "de2", family: "data_engineer", expected: ["data_engineer"], company: "Quillon Fintech",
    title: "Data Engineer, AWS",
    trap: "AWS stack with Redshift, Step Functions, Kinesis; partial coverage",
    text: `Quillon is a payments company processing millions of transactions daily. Our Data Engineering team builds the AWS platform that powers risk, finance, and analytics.

You will
- Build batch and near-real-time pipelines using AWS Glue, Lambda, Step Functions, and Kinesis
- Manage data lake storage on S3 with partitioned Parquet and the Glue Data Catalog; query with Athena
- Load curated data into Amazon Redshift and tune distribution and sort keys
- Write infrastructure as code with Terraform
- Monitor pipelines with CloudWatch and own incident response for data delays
- Partner with risk analysts on data contracts and SLAs

Requirements
- 3+ years in data engineering on AWS
- Python, SQL, and Spark
- Glue, S3, Athena, Lambda; Redshift or Snowflake
- Terraform or CloudFormation
- Financial or transactional data experience a plus`,
  },
  {
    id: "de3", family: "data_engineer", expected: ["data_engineer"], company: "Aster Media Group",
    title: "Data Engineer (GCP)",
    trap: "GCP-heavy (BigQuery, Dataflow, Pub/Sub, Composer); strict mode must not claim GCP",
    text: `Aster Media Group is hiring a Data Engineer to build our audience data platform on Google Cloud.

Responsibilities
- Develop streaming and batch pipelines with Pub/Sub, Dataflow (Apache Beam), and Cloud Composer (Airflow)
- Design partitioned and clustered BigQuery tables; optimize query cost
- Build transformation models with dbt on BigQuery
- Implement data quality monitoring and lineage
- Collaborate with analysts and data scientists on audience segmentation datasets

Requirements
- 3+ years building data pipelines
- Python and SQL
- Google Cloud Platform: BigQuery, Dataflow, Pub/Sub, Composer
- Airflow and dbt
- Experience with event or clickstream data preferred`,
  },
  {
    id: "de4", family: "data_engineer", expected: ["data_engineer"], company: "Voltgrid Energy",
    title: "Data Engineer, Streaming",
    trap: "Kafka, Spark Structured Streaming, Flink, Scala; real streaming gap",
    text: `Voltgrid operates smart-meter infrastructure for 2 million homes. We need a Data Engineer to build streaming pipelines for meter telemetry.

What you will do
- Build real-time ingestion from Kafka into a Delta Lake lakehouse using Spark Structured Streaming
- Handle late-arriving and out-of-order events, deduplication, and watermarking
- Maintain batch backfills and reconciliation between streaming and batch outputs
- Monitor throughput and lag; respond to pipeline incidents
- Expose curated telemetry to analytics and forecasting teams

Requirements
- 3+ years of data engineering
- Spark (PySpark or Scala) and SQL
- Kafka or another streaming platform
- Delta Lake or Iceberg
- Experience with IoT or time-series telemetry preferred
- Flink a plus`,
  },
  {
    id: "de5", family: "data_engineer", expected: ["analytics_engineer"], company: "Brightpath SaaS",
    title: "Analytics Engineer",
    trap: "dbt + Snowflake + modeling; should read as analytics engineer, not pipeline engineer",
    text: `Brightpath is a B2B SaaS company. Our Analytics Engineer turns raw product, billing, and CRM data into trusted models that power every dashboard in the company.

You will
- Build and maintain dbt models in Snowflake following staging, intermediate, and mart layers
- Write dbt tests and documentation; own data contracts for core metrics (ARR, churn, activation)
- Design dimensional models and a semantic layer for self-service analytics
- Orchestrate dbt runs with Airflow and monitor freshness
- Partner with finance and product to define metrics consistently

Requirements
- 2+ years in analytics engineering, BI engineering, or data engineering
- Expert SQL and dimensional modeling
- dbt and Snowflake
- Git-based development workflow
- Looker or Power BI experience`,
  },

  // ───────────── DATA SCIENTIST / AI ─────────────
  {
    id: "ds1", family: "data_scientist", expected: ["data_scientist_ml"], company: "Pinecrest Grocers",
    title: "Data Scientist, Demand Forecasting",
    trap: "Forecasting models; profile has forecasting analysis but limited model building",
    text: `Pinecrest Grocers is hiring a Data Scientist to improve demand forecasts for 120 stores.

Responsibilities
- Build and evaluate time-series forecasting models (gradient boosting, ARIMA, Prophet) at store and SKU level
- Engineer features from sales history, promotions, holidays, and weather
- Measure forecast accuracy (MAPE, bias) and communicate tradeoffs to supply chain leaders
- Productionize models with the data engineering team
- Analyze drivers of forecast error and recommend improvements

Requirements
- 2+ years in data science or advanced analytics
- Python (pandas, scikit-learn), SQL
- Time-series forecasting experience
- Strong communication with business stakeholders
- Databricks or Spark a plus`,
  },
  {
    id: "ds2", family: "data_scientist", expected: ["data_scientist_ml", "ml_llm_engineer"], company: "Corvid Robotics",
    title: "Machine Learning Engineer",
    trap: "MLOps (MLflow, Kubernetes, feature store); large gaps",
    text: `Corvid Robotics is hiring an ML Engineer to take models from research to production.

You will
- Build training and inference pipelines; package models with Docker and deploy on Kubernetes
- Track experiments and models with MLflow; implement model versioning and rollback
- Build feature pipelines and maintain a feature store
- Monitor model performance and data drift in production
- Work with researchers to optimize models for latency

Requirements
- 3+ years of ML engineering or backend engineering with ML
- Python; PyTorch or TensorFlow
- Docker, Kubernetes, CI/CD
- MLflow or similar
- Cloud (AWS or Azure)`,
  },
  {
    id: "ds3", family: "data_scientist", expected: ["ml_llm_engineer"], company: "Clearwater Legal Tech",
    title: "Generative AI Engineer",
    trap: "RAG, vector DBs, LangChain, evals; CodeRepoReader should lead, no RAG claim",
    text: `Clearwater builds AI tools for legal teams. We are hiring a Generative AI Engineer to build LLM features grounded in large document sets.

Responsibilities
- Build retrieval-augmented generation (RAG) pipelines over contracts and case files
- Design prompts, tool-calling agents, and structured outputs with the OpenAI API
- Implement evaluation harnesses for accuracy, groundedness, and latency
- Manage vector databases (pgvector, Pinecone) and chunking strategies
- Deploy LLM services as APIs and monitor cost and quality

Requirements
- 2+ years building software or ML systems; 1+ year with LLM applications
- Python; OpenAI or Anthropic APIs
- LangChain, LlamaIndex, or custom orchestration
- Experience with evaluation of LLM outputs
- Vector search experience`,
  },
  {
    id: "ds4", family: "data_scientist", expected: ["data_scientist_ml"], company: "Ardent Credit Union",
    title: "Data Scientist, Model Risk and Explainability",
    trap: "SHAP/governance; strong NWMSU match plus regulated finance domain",
    text: `Ardent Credit Union is hiring a Data Scientist to strengthen model risk management for credit and fraud models.

Responsibilities
- Validate machine learning models: performance, stability, and fairness testing
- Produce explainability analyses with SHAP and related methods for model reviews
- Document model behavior and limitations for risk committees and regulators
- Build reproducible validation pipelines in Python and SQL
- Partner with model developers to remediate findings

Requirements
- 2+ years in data science, model validation, or analytics
- Python (scikit-learn, pandas), SQL
- Explainable AI methods (SHAP, LIME, counterfactuals)
- Familiarity with model governance frameworks (SR 11-7, NIST AI RMF)
- Clear technical writing`,
  },
  {
    id: "ds5", family: "data_scientist", expected: ["data_scientist_ml", "ml_llm_engineer"], company: "Signal & Thread",
    title: "Data Scientist, LLM Team",
    trap: "Hybrid DS + LLM evaluation; tests blending lenses",
    text: `Signal & Thread is building AI assistants for customer support. Our LLM team needs a Data Scientist to measure and improve model quality.

You will
- Design evaluation datasets and metrics for LLM responses (accuracy, helpfulness, safety)
- Run offline experiments comparing prompts, models, and retrieval settings
- Analyze conversation logs with SQL and Python to find failure patterns
- Build dashboards that track quality over time
- Partner with engineers to prioritize fixes

Requirements
- 2+ years in data science or analytics
- Python, SQL, statistics
- Experience evaluating ML or LLM systems
- Familiarity with OpenAI or open-source LLMs
- Strong communication`,
  },

  // ───────────── SOFTWARE ENGINEER ─────────────
  {
    id: "swe1", family: "software_engineer", expected: ["software_engineer"], company: "Tidewater Systems",
    title: "Software Engineer I",
    trap: "Generic entry SWE: REST APIs, testing; inventory lacks testing frameworks",
    text: `Tidewater Systems builds scheduling software for field service companies. We are hiring a Software Engineer I.

What you will do
- Build and maintain REST APIs in Python
- Write unit and integration tests; participate in code reviews
- Work with PostgreSQL schemas and write efficient queries
- Deploy services to AWS and monitor them in production
- Collaborate with product and design in an agile team

Requirements
- Bachelor's or Master's in Computer Science or related field
- 0 to 2 years of professional software experience
- Proficiency in Python (or Java/Go)
- SQL and relational databases
- Git, testing, and CI/CD basics`,
  },
  {
    id: "swe2", family: "software_engineer", expected: ["software_engineer"], company: "Mosaic Health Apps",
    title: "Junior Full-Stack Engineer",
    trap: "React + TypeScript + Node + Postgres; TypeScript gap",
    text: `Mosaic builds patient engagement apps. We are hiring a Junior Full-Stack Engineer.

Responsibilities
- Build features across a React + TypeScript frontend and a Node.js API
- Design PostgreSQL tables and write migrations
- Implement authentication and role-based access
- Write tests with Jest and React Testing Library
- Ship to production on Vercel and AWS

Requirements
- 1+ years building web applications (professional or substantial projects)
- React and TypeScript
- Node.js
- PostgreSQL
- Understanding of web security basics`,
  },
  {
    id: "swe3", family: "software_engineer", expected: ["software_engineer"], company: "Granite Data Co",
    title: "Backend Engineer, Data Platform",
    trap: "Backend with data focus; FastAPI/Docker; blend SWE + DE",
    text: `Granite Data Co builds APIs that let customers query large datasets. We are hiring a Backend Engineer for our data platform team.

You will
- Build Python services (FastAPI) that expose data products to customers
- Design PostgreSQL and Snowflake data access layers with attention to performance
- Containerize services with Docker and deploy on AWS
- Build background jobs for data ingestion and validation
- Write tests, monitor services, and handle on-call

Requirements
- 2+ years of backend engineering
- Python and SQL
- REST API design
- Docker and AWS
- Data pipeline experience a strong plus`,
  },
  {
    id: "swe4", family: "software_engineer", expected: ["software_engineer"], company: "Ironbridge Banking",
    title: "Java Software Engineer",
    trap: "Java Spring Boot, microservices, Kafka; honesty test (heavy gaps)",
    text: `Ironbridge Banking is hiring a Java Software Engineer for our payments platform.

Responsibilities
- Develop microservices with Java 17 and Spring Boot
- Build event-driven integrations with Kafka
- Write JUnit tests and maintain CI pipelines in Jenkins
- Work with Oracle and PostgreSQL databases
- Participate in production support rotation

Requirements
- 2+ years of Java development
- Spring Boot, REST, microservices
- Kafka or JMS
- SQL
- Banking or payments experience preferred`,
  },
  {
    id: "swe5", family: "software_engineer", expected: ["software_engineer", "ml_llm_engineer"], company: "Codeweave",
    title: "Software Engineer, AI Developer Tools",
    trap: "LLM-powered developer tools; CodeRepoReader and ApplyForge should lead",
    text: `Codeweave builds AI tools that help engineers understand large codebases. We are hiring a Software Engineer.

You will
- Build services that index repositories and answer questions about code using LLMs
- Implement static analysis (ASTs, dependency graphs) to give models accurate context
- Build web interfaces in React for code exploration
- Evaluate model quality and latency across providers
- Deploy and operate services in the cloud

Requirements
- 1+ years of software engineering (projects count)
- Python and/or TypeScript
- Experience with LLM APIs (OpenAI, Anthropic, GitHub Copilot)
- Familiarity with parsing or static analysis
- React a plus`,
  },
];
