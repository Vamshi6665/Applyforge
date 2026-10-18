export const GOOD_RESUME = {
  headline: "Data Engineer",
  summary:
    "Data Engineer with 4+ years of experience building cloud ETL/ELT pipelines, distributed PySpark transformations, and dimensional warehouse models on Azure, AWS, and Snowflake. Consolidated 40+ regional sources into analytical datasets covering roughly 5 million reporting records and cut recurring reporting errors by more than 90% through automated reconciliation. Holds an M.S. in Applied Computer Science and DP-203 and AWS Cloud Practitioner certifications.",
  experience: [
    {
      role_id: "lama", company: "LAMA Desserts LLC", title: "Data Associate", location: "Houston, TX", dates: "Jul 2026 – Present",
      bullets: [
        { label: "Inventory Data Platform", text: "Engineers a Supabase PostgreSQL inventory platform with append-only count history, indexed lookups, and row-level security, replacing 7 paper and spreadsheet logs with a single governed source." },
        { label: "Historical Migration", text: "Migrates 8 CSV exports with Python and Pandas, converting wide count columns into dated history rows and parsing free-text thresholds into numeric par levels for reorder logic." },
        { label: "Reorder Analytics", text: "Models reusable SQL views joining transactions, products, vendors, and snapshots, feeding Power BI DAX measures that flag items below par and surface slow-moving stock for purchasing." },
        { label: "Review Automation", text: "Automates weekly and monthly data preparation with repeatable Python and SQL jobs so owner business reviews run on current inventory and sales data." },
      ],
    },
    {
      role_id: "nwmsu", company: "Northwest Missouri State University", title: "Research Assistant", location: "Maryville, MO", dates: "May 2025 – Apr 2026",
      bullets: [
        { label: "Feature Pipelines", text: "Prepared reproducible machine learning datasets with Python, Pandas, and SQL, standardizing preprocessing, feature engineering, and validation steps reused across comparative experiments." },
        { label: "Model Explainability", text: "Designed an explainability framework pairing SHAP attributions with Anchor rule explanations, aligned to NIST AI RMF, so nontechnical collaborators could audit model predictions." },
        { label: "SDK Benchmarking", text: "Benchmarked OpenAI SDK and GitHub Copilot SDK agents on context handling, tool integration, and response quality, contributing results to a co-authored research paper." },
      ],
    },
    {
      role_id: "dxc", company: "DXC Technology", title: "Data Engineer", location: "Hyderabad, India", dates: "Jul 2021 – Dec 2024",
      bullets: [
        { label: "Source Consolidation", text: "Engineered Azure Data Factory and Databricks PySpark pipelines consolidating 40+ regional SQL Server sources into Snowflake analytical datasets covering roughly 5 million reporting records." },
        { label: "Reconciliation Automation", text: "Automated source-to-target validation and reconciliation checks between staging and curated layers, reducing recurring reporting errors by more than 90% across published metrics." },
        { label: "Dimensional Modeling", text: "Modeled fact tables, conformed dimensions, and star schemas with standardized business keys, giving regional teams consistent definitions for cross-region workload and processing-time analysis." },
        { label: "Lakehouse Layering", text: "Architected raw, validated, and curated layers on Amazon S3 with AWS Glue and partitioned Parquet, enabling incremental loads and controlled backfills queried through Amazon Athena." },
        { label: "Production Reliability", text: "Instrumented pipeline runs with Amazon CloudWatch alerts and retries, tracing schema changes and source outages to restore affected reporting deliveries with validated outputs." },
        { label: "Release Workflow", text: "Shipped pipeline changes through Git and Azure DevOps with code reviews and automated checks, keeping transformation logic and configurations traceable across releases." },
        { label: "Requirements Mapping", text: "Translated reporting requirements into source-to-target mappings, transformation specifications, and acceptance criteria that aligned pipeline builds with operational priorities." },
        { label: "Capacity Forecasting", text: "Orchestrated daily utilization feeds from ADLS through Databricks into Snowflake history tables, powering an 80% threshold dashboard that cut storage-related escalations by 25%." },
      ],
    },
  ],
  skills: [
    { category: "Languages", items: ["Python", "SQL", "PySpark", "Spark SQL", "T-SQL"] },
    { category: "Data Processing", items: ["Apache Spark", "Azure Databricks", "Delta Lake", "Apache Parquet"] },
    { category: "Orchestration", items: ["Azure Data Factory", "Apache Airflow", "AWS Glue", "dbt"] },
    { category: "Warehousing", items: ["Snowflake", "SQL Server", "PostgreSQL"] },
    { category: "Cloud", items: ["Amazon S3", "Amazon Athena", "Amazon CloudWatch", "ADLS Gen2"] },
  ],
  certifications: ["Microsoft Certified: Azure Data Engineer Associate (DP-203)", "AWS Certified Cloud Practitioner"],
  review_notes: { stretched_claims: [], suggested_metrics: [] },
};
