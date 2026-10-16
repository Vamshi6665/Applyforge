// Technology and method vocabulary for model-free JD ↔ profile ↔ resume correlation.
// group = substitutability class used to decide whether a gap is bridgeable.

const T = (name, group, ...aliases) => ({ name, group, re: new RegExp(`(^|[^A-Za-z0-9])(${[name, ...aliases].map((a) => a.replace(/[.+*?^${}()|[\]\\]/g, "\\$&")).join("|")})(?:e?s)?(?![A-Za-z0-9])`, "i") });

export const TERMS = [
  T("Python", "lang"), T("SQL", "lang", "T-SQL", "Spark SQL"), T("Java", "lang_jvm", "Java 17"), T("Scala", "lang_jvm"),
  T("TypeScript", "lang_web"), T("JavaScript", "lang_web"), T("Go", "lang_sys", "Golang"), T("R", "lang_stats"), T("DAX", "bi_lang"),
  T("Power Query", "bi_lang", "Power Query M"), T("Excel", "spreadsheet", "Microsoft Excel"),
  T("Snowflake", "warehouse"), T("BigQuery", "warehouse"), T("Redshift", "warehouse", "Amazon Redshift"), T("Azure Synapse", "warehouse", "Synapse"),
  T("Databricks", "processing", "Azure Databricks", "Databricks SQL"), T("Spark", "processing", "Apache Spark", "PySpark"),
  T("Dataflow", "processing", "Apache Beam", "Beam"), T("Flink", "streaming"), T("AWS Glue", "processing", "Glue"),
  T("Kafka", "streaming"), T("Kinesis", "streaming"), T("Pub/Sub", "streaming", "PubSub"), T("Spark Structured Streaming", "streaming", "Structured Streaming"),
  T("Airflow", "orchestration", "Apache Airflow", "Cloud Composer", "Composer"), T("Azure Data Factory", "orchestration", "ADF", "Data Factory"),
  T("Step Functions", "orchestration"), T("Databricks Workflows", "orchestration"),
  T("dbt", "transform"), T("Delta Lake", "table_format", "Delta"), T("Iceberg", "table_format"), T("Parquet", "table_format", "Apache Parquet"),
  T("Amazon S3", "object_store", "S3"), T("ADLS Gen2", "object_store", "ADLS"), T("Athena", "query_engine", "Amazon Athena"),
  T("AWS Lambda", "serverless", "Lambda"), T("CloudWatch", "monitoring", "Amazon CloudWatch"),
  T("AWS", "cloud", "Amazon Web Services"), T("Azure", "cloud", "Microsoft Azure"), T("GCP", "cloud", "Google Cloud", "Google Cloud Platform"),
  T("Terraform", "iac"), T("CloudFormation", "iac"), T("Docker", "container"), T("Kubernetes", "orchestrator_k8s", "K8s"),
  T("Power BI", "bi", "Power BI Service", "Power BI Desktop"), T("Tableau", "bi"), T("Looker", "bi"), T("Looker Studio", "bi"),
  T("PostgreSQL", "rdbms", "Postgres"), T("SQL Server", "rdbms"), T("Oracle", "rdbms"), T("MySQL", "rdbms"), T("Azure SQL", "rdbms"),
  T("scikit-learn", "ml_lib", "sklearn"), T("PyTorch", "dl_lib"), T("TensorFlow", "dl_lib", "TensorFlow Lite"), T("Prophet", "forecast"), T("ARIMA", "forecast"),
  T("XGBoost", "ml_lib", "gradient boosting"), T("pandas", "py_data", "Pandas"), T("NumPy", "py_data"),
  T("MLflow", "mlops"), T("feature store", "mlops"),
  T("SHAP", "xai"), T("LIME", "xai"), T("Anchor", "xai"), T("counterfactuals", "xai"), T("NIST AI RMF", "governance"), T("SR 11-7", "governance"),
  T("OpenAI", "llm_api", "OpenAI API", "OpenAI SDK"), T("Anthropic", "llm_api"), T("GitHub Copilot", "llm_api", "GitHub Copilot SDK"),
  T("LangChain", "llm_framework"), T("LlamaIndex", "llm_framework"), T("RAG", "retrieval", "retrieval-augmented generation"),
  T("vector database", "retrieval", "vector databases", "vector search", "pgvector", "Pinecone"),
  T("React", "web_fe"), T("Node.js", "web_be_js", "Node"), T("FastAPI", "web_be_py"), T("Flask", "web_be_py"), T("Spring Boot", "web_be_jvm"),
  T("REST", "api", "REST APIs", "REST API"), T("microservices", "api"),
  T("Jest", "testing"), T("JUnit", "testing"), T("pytest", "testing"), T("unit tests", "testing", "unit and integration tests", "integration tests"),
  T("Git", "vcs", "GitHub"), T("Azure DevOps", "ci"), T("Jenkins", "ci"), T("CI/CD", "ci"),
  T("A/B testing", "experimentation", "A/B tests", "experimentation"), T("statistics", "stats", "hypothesis testing"),
  T("time-series forecasting", "forecast", "time series forecasting", "time-series", "forecasting"),
  T("dimensional modeling", "modeling", "star schema", "dimensional models", "star-schema"), T("medallion architecture", "modeling", "medallion"),
  T("row-level security", "bi_admin", "RLS"), T("AST", "static_analysis", "static analysis", "ASTs"),
  T("Vercel", "hosting"), T("Supabase", "rdbms"),
];

export function extract(text) {
  const found = new Map();
  for (const t of TERMS) if (t.re.test(text)) found.set(t.name, t);
  // drop generic parents when a specific child matched
  if (found.has("Looker Studio")) found.delete("Looker");
  if (found.has("Spark Structured Streaming")) found.delete("Spark");
  return [...found.values()];
}

export function profileTerms(profile) {
  // only explicit claims count as "has": the skill inventory and project stacks (facts can mention tools he did not use, e.g. "parses Java files")
  const corpus = JSON.stringify({ inv: profile.skillInventory, stacks: profile.projects.map((p) => p.stack) });
  return extract(corpus);
}

export function correlate(jdText, profile) {
  const jd = extract(jdText);
  const own = profileTerms(profile);
  const have = new Set(own.map((t) => t.name));
  const haveGroups = new Set(own.map((t) => t.group));
  const inHistory = new Set(extract(JSON.stringify({ f: profile.experience.map((e) => [e.facts, e.lenses]), p: profile.projects.map((p) => p.facts) })).map((t) => t.name));
  const matched = [], bridgeable = [], context = [], gaps = [];
  for (const t of jd) {
    if (have.has(t.name)) matched.push(t.name);
    else if (haveGroups.has(t.group)) bridgeable.push(t.name);
    else if (inHistory.has(t.name)) context.push(t.name); // appears in his real work, but not as a skill he claims
    else gaps.push(t.name);
  }
  const n = jd.length || 1;
  return { terms: jd.map((t) => t.name), matched, bridgeable, context, gaps, coverage: matched.length / n, reach: (matched.length + bridgeable.length) / n };
}

// Inventory tools that no fact, lens, or project stack supports. They may sit in Skills, never in a bullet.
export function unbacked(profile) {
  const backed = new Set(extract(JSON.stringify({ f: profile.experience.map((e) => [e.facts, e.lenses]), p: profile.projects })).map((t) => t.name));
  return extract(Object.values(profile.skillInventory).flat().join(" \n ")).filter((t) => !backed.has(t.name)).map((t) => t.name);
}
