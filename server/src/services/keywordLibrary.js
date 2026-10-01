// Keyword library used for JD gap analysis. Running this locally (instead of
// asking the model) costs zero tokens and gives deterministic, testable results.
//
// term:     canonical name shown in the UI
// aliases:  other spellings found in job descriptions
// adjacent: real skills that make this term an honest bridge, not a fabrication
// group:    used for grouping in the UI

const k = (term, group, aliases = [], adjacent = []) => ({ term, group, aliases, adjacent });

export const KEYWORD_LIBRARY = [
  // Languages
  k('SQL', 'Languages', ['T-SQL', 'TSQL', 'PL/SQL', 'ANSI SQL']),
  k('Python', 'Languages', ['python3']),
  k('Scala', 'Languages', [], ['PySpark', 'Spark']),
  k('Java', 'Languages', [], ['Python']),
  k('JavaScript', 'Languages', ['JS', 'ES6']),
  k('TypeScript', 'Languages', [], ['JavaScript']),
  k('Golang', 'Languages', ['Go lang']),
  k('C++', 'Languages', ['cpp']),
  k('C#', 'Languages', ['.NET', 'dotnet']),
  k('Bash', 'Languages', ['shell scripting', 'shell'], ['Python']),
  k('R language', 'Languages', ['R programming', 'RStudio', 'Python, R', 'Python or R', 'R or Python', 'Python/R', 'R/Python'], ['Python', 'Statistics']),
  k('SAS', 'Languages', [], ['Python', 'Statistics']),

  // Processing and orchestration
  k('Spark', 'Processing', ['Apache Spark', 'Spark SQL']),
  k('PySpark', 'Processing'),
  k('Kafka', 'Processing', ['Apache Kafka', 'Confluent']),
  k('Flink', 'Processing', ['Apache Flink'], ['Spark', 'Kafka']),
  k('Hadoop', 'Processing', ['HDFS', 'Hive', 'MapReduce'], ['Spark', 'Databricks']),
  k('Airflow', 'Orchestration', ['Apache Airflow', 'Cloud Composer', 'MWAA'], ['Azure Data Factory']),
  k('dbt', 'Orchestration', ['data build tool'], ['SQL', 'Data Modeling']),
  k('Dagster', 'Orchestration', [], ['Azure Data Factory']),
  k('Prefect', 'Orchestration', [], ['Azure Data Factory']),
  k('Fivetran', 'Orchestration', [], ['Azure Data Factory']),
  k('Informatica', 'Orchestration', [], ['Azure Data Factory', 'ETL']),
  k('SSIS', 'Orchestration', [], ['Azure Data Factory', 'ETL']),
  k('Talend', 'Orchestration', [], ['ETL']),
  k('ETL', 'Engineering', ['ETL/ELT', 'extract, transform', 'extract transform load']),
  k('ELT', 'Engineering'),
  k('Data Pipelines', 'Engineering', ['data pipeline', 'pipelines']),
  k('Streaming', 'Engineering', ['real-time', 'real time', 'event streaming'], ['Kafka', 'Spark']),
  k('Data Modeling', 'Engineering', ['dimensional modeling', 'star schema', 'data model', 'data models', 'Kimball']),
  k('Data Vault', 'Engineering', ['Data Vault 2.0']),
  k('Data Quality', 'Engineering', ['data validation', 'data integrity', 'data-quality']),
  k('Data Governance', 'Engineering', ['governance', 'data lineage', 'data catalog'], ['Data Quality']),
  k('CI/CD', 'Engineering', ['continuous integration', 'GitHub Actions', 'Azure DevOps', 'Jenkins'], ['Git']),
  k('Git', 'Engineering', ['GitHub', 'GitLab', 'version control']),
  k('Docker', 'Engineering', ['containers', 'containerization']),
  k('Kubernetes', 'Engineering', ['k8s', 'AKS', 'EKS', 'GKE']),
  k('Terraform', 'Engineering', ['infrastructure as code', 'IaC']),
  k('REST APIs', 'Engineering', ['REST', 'RESTful', 'API', 'APIs']),
  k('Microservices', 'Engineering'),

  // Warehouses and databases
  k('Snowflake', 'Warehouses'),
  k('BigQuery', 'Warehouses', ['Google BigQuery'], ['Snowflake', 'Synapse']),
  k('Redshift', 'Warehouses', ['Amazon Redshift'], ['Snowflake', 'Synapse']),
  k('Synapse', 'Warehouses', ['Azure Synapse']),
  k('Databricks', 'Warehouses', ['Delta Lake', 'Unity Catalog']),
  k('PostgreSQL', 'Databases', ['Postgres']),
  k('MySQL', 'Databases', [], ['PostgreSQL', 'SQL']),
  k('SQL Server', 'Databases', ['MSSQL', 'Microsoft SQL Server'], ['SQL']),
  k('Oracle', 'Databases', [], ['SQL']),
  k('MongoDB', 'Databases', ['NoSQL'], ['PostgreSQL']),
  k('Cassandra', 'Databases'),
  k('Data Warehouse', 'Warehouses', ['data warehousing', 'warehouse', 'lakehouse', 'data lake'], ['Snowflake']),

  // Cloud
  k('Azure', 'Cloud', ['Microsoft Azure']),
  k('Azure Data Factory', 'Cloud', ['ADF', 'Data Factory']),
  k('ADLS', 'Cloud', ['Azure Data Lake', 'Data Lake Storage']),
  k('AWS', 'Cloud', ['Amazon Web Services']),
  k('S3', 'Cloud', ['Amazon S3'], ['AWS', 'ADLS']),
  k('Glue', 'Cloud', ['AWS Glue'], ['Azure Data Factory', 'AWS']),
  k('Athena', 'Cloud', ['AWS Athena'], ['SQL', 'AWS']),
  k('Lambda', 'Cloud', ['AWS Lambda', 'serverless'], ['AWS']),
  k('EMR', 'Cloud', ['AWS EMR'], ['Spark', 'Databricks']),
  k('GCP', 'Cloud', ['Google Cloud', 'Google Cloud Platform', 'Dataflow', 'Dataproc'], ['Azure', 'AWS']),

  // BI and analytics
  k('Power BI', 'Analytics', ['PowerBI', 'Power-BI']),
  k('DAX', 'Analytics'),
  k('Power Query', 'Analytics', ['M language']),
  k('Tableau', 'Analytics', [], ['Power BI']),
  k('Looker', 'Analytics', ['LookML', 'Looker Studio'], ['Power BI']),
  k('Qlik', 'Analytics', ['QlikView', 'Qlik Sense'], ['Power BI']),
  k('Excel', 'Analytics', ['Microsoft Excel', 'pivot tables', 'VLOOKUP', 'XLOOKUP']),
  k('Dashboards', 'Analytics', ['dashboard', 'dashboarding', 'reporting']),
  k('Data Visualization', 'Analytics', ['visualization', 'visualizations', 'data viz']),
  k('KPIs', 'Analytics', ['KPI', 'metrics'], ['Dashboards']),
  k('Statistics', 'Analytics', ['statistical analysis', 'statistical', 'hypothesis testing', 'regression']),
  k('A/B Testing', 'Analytics', ['experimentation', 'experiments', 'AB testing'], ['Statistics']),
  k('Product Analytics', 'Analytics', ['funnel analysis', 'cohort analysis', 'Amplitude', 'Mixpanel'], ['SQL', 'Dashboards']),
  k('Forecasting', 'Analytics', ['time series', 'time-series'], ['Machine Learning', 'Statistics']),
  k('Pandas', 'Analytics', ['NumPy'], ['Python']),

  // ML and AI
  k('Machine Learning', 'ML and AI', ['ML', 'predictive modeling', 'predictive models']),
  k('Scikit-learn', 'ML and AI', ['sklearn', 'scikit learn']),
  k('Deep Learning', 'ML and AI', ['neural networks', 'PyTorch', 'TensorFlow', 'Keras'], ['Machine Learning']),
  k('Explainable AI', 'ML and AI', ['XAI', 'model interpretability', 'interpretability', 'SHAP', 'LIME']),
  k('MLOps', 'ML and AI', ['MLflow', 'model deployment', 'model monitoring'], ['Machine Learning', 'Databricks']),
  k('LLM', 'ML and AI', ['LLMs', 'large language model', 'large language models', 'GPT']),
  k('Generative AI', 'ML and AI', ['GenAI', 'Gen AI', 'generative']),
  k('RAG', 'ML and AI', ['retrieval augmented generation', 'retrieval-augmented', 'vector database', 'embeddings'], ['LLM']),
  k('NLP', 'ML and AI', ['natural language processing'], ['LLM', 'Machine Learning']),
  k('Computer Vision', 'ML and AI', ['OpenCV', 'object detection', 'pose estimation'], ['Machine Learning']),

  // Business and domain
  k('Stakeholder Communication', 'Ways of working', ['stakeholders', 'stakeholder', 'cross-functional', 'business partners']),
  k('Agile', 'Ways of working', ['Scrum', 'Jira', 'sprint'], ['Stakeholder Communication']),
  k('Automation', 'Ways of working', ['automate', 'automated', 'automating']),
  k('Documentation', 'Ways of working', ['documenting', 'technical writing'], ['Stakeholder Communication']),
  k('Salesforce', 'Domain tools', ['SFDC'], ['REST APIs']),
  k('SAP', 'Domain tools', ['SAP HANA', 'S/4HANA']),
  k('SharePoint', 'Domain tools'),
  k('HIPAA', 'Domain', ['PHI', 'protected health information'], ['Data Governance']),
  k('FHIR', 'Domain', ['HL7']),
  k('HEDIS', 'Domain'),
  k('Healthcare', 'Domain', ['clinical', 'EHR', 'EMR data', 'claims data']),
  k('Financial services', 'Domain', ['banking', 'fintech', 'capital markets']),
];
