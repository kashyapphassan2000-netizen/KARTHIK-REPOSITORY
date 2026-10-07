/**
 * Skills that show up in Forward Deployed Engineer / AI Engineer / ML Engineer
 * job descriptions (2025–2026). Used for three things:
 *   1. grouping skills into categories on the public site,
 *   2. auto-detecting skills in uploaded documents (name + aliases),
 *   3. the private "market gap" view in /admin.
 *
 * demand: "core"  = asked for in most FDE / AI-engineer postings
 *         "common" = frequently listed, often as nice-to-have
 *         "niche"  = specialised; valuable for specific roles
 * This is a curated judgement, not scraped statistics.
 */
export type Demand = "core" | "common" | "niche";

export type TaxonomySkill = { name: string; aliases?: string[]; demand: Demand };

export type Category = { name: string; skills: TaxonomySkill[] };

export const TAXONOMY: Category[] = [
  {
    name: "LLMs & Generative AI",
    skills: [
      { name: "Large Language Models (LLMs)", aliases: ["llm", "llms", "large language model", "large language models"], demand: "core" },
      { name: "Prompt Engineering", aliases: ["prompt design", "prompting", "system prompt"], demand: "core" },
      { name: "OpenAI API", aliases: ["openai", "gpt-4", "gpt-4o", "gpt-5", "chatgpt api"], demand: "core" },
      { name: "Anthropic Claude API", aliases: ["anthropic", "claude api", "claude"], demand: "common" },
      { name: "Google Gemini API", aliases: ["gemini"], demand: "common" },
      { name: "Open-weight Models (Llama, Qwen, Mistral)", aliases: ["llama", "llama 3", "qwen", "mistral", "gemma", "open-weight", "open weight", "open-source llm"], demand: "common" },
      { name: "Structured Outputs / JSON Schema", aliases: ["structured output", "structured outputs", "json schema", "constrained decoding", "constrained json"], demand: "core" },
      { name: "Function Calling / Tool Use", aliases: ["function calling", "tool use", "tool calling", "tool registry", "typed tools"], demand: "core" },
      { name: "Hugging Face Transformers", aliases: ["hugging face", "huggingface", "transformers"], demand: "common" },
      { name: "Multimodal AI", aliases: ["multimodal", "vision language", "vlm"], demand: "niche" },
      { name: "Ollama", aliases: ["ollama"], demand: "niche" },
    ],
  },
  {
    name: "Agents & Orchestration",
    skills: [
      { name: "AI Agents / Agentic Workflows", aliases: ["agentic", "ai agent", "ai agents", "agent architecture", "multi-agent", "agent runtime"], demand: "core" },
      { name: "LangGraph", aliases: ["langgraph"], demand: "core" },
      { name: "LangChain", aliases: ["langchain"], demand: "core" },
      { name: "LlamaIndex", aliases: ["llamaindex", "llama index"], demand: "common" },
      { name: "Model Context Protocol (MCP)", aliases: ["mcp", "model context protocol"], demand: "core" },
      { name: "CrewAI / AutoGen", aliases: ["crewai", "autogen"], demand: "niche" },
      { name: "Temporal (Durable Workflows)", aliases: ["temporal"], demand: "niche" },
      { name: "Human-in-the-loop Approvals", aliases: ["human-in-the-loop", "human in the loop", "approval workflow", "approval token", "approval tokens"], demand: "common" },
    ],
  },
  {
    name: "RAG & Search",
    skills: [
      { name: "Retrieval-Augmented Generation (RAG)", aliases: ["rag", "retrieval-augmented", "retrieval augmented"], demand: "core" },
      { name: "Embeddings", aliases: ["embedding", "embeddings", "bge-m3", "text embeddings"], demand: "core" },
      { name: "Vector Databases", aliases: ["vector database", "vector db", "vector store", "k-nn", "knn", "hnsw", "vector search"], demand: "core" },
      { name: "Hybrid Search (BM25 + Vector)", aliases: ["hybrid search", "bm25", "hybrid retrieval", "hybrid lexical"], demand: "common" },
      { name: "Reranking", aliases: ["rerank", "reranking", "reranker"], demand: "common" },
      { name: "Document Chunking & Ingestion", aliases: ["chunking", "chunks", "document pipeline", "ocr", "textract"], demand: "common" },
      { name: "Pinecone", aliases: ["pinecone"], demand: "common" },
      { name: "pgvector", aliases: ["pgvector"], demand: "common" },
      { name: "Chroma / FAISS / Qdrant / Weaviate", aliases: ["chroma", "chromadb", "faiss", "qdrant", "weaviate", "milvus"], demand: "common" },
      { name: "Knowledge Graphs", aliases: ["knowledge graph", "graph database", "openCypher", "cypher", "neo4j", "neptune"], demand: "common" },
      { name: "Citations & Grounding", aliases: ["citation", "citations", "grounded", "grounding", "span citations"], demand: "common" },
    ],
  },
  {
    name: "Model Training & Fine-tuning",
    skills: [
      { name: "LLM Fine-tuning (SFT)", aliases: ["fine-tuning", "fine tuning", "finetuning", "supervised fine-tuning", "sft"], demand: "core" },
      { name: "LoRA / QLoRA (PEFT)", aliases: ["lora", "qlora", "peft", "parameter-efficient"], demand: "common" },
      { name: "Continued Pre-training", aliases: ["continued pre-training", "domain adaptation", "continued pretraining"], demand: "niche" },
      { name: "Preference Tuning (DPO / RLHF)", aliases: ["dpo", "rlhf", "preference tuning", "direct preference optimisation", "direct preference optimization"], demand: "common" },
      { name: "Knowledge Distillation", aliases: ["distillation", "distil", "distill"], demand: "niche" },
      { name: "Model Quantization", aliases: ["quantisation", "quantization", "quantise", "int8", "awq", "4-bit", "fp8", "gguf"], demand: "common" },
      { name: "PyTorch", aliases: ["pytorch", "torch"], demand: "core" },
      { name: "TensorFlow / Keras", aliases: ["tensorflow", "keras"], demand: "common" },
    ],
  },
  {
    name: "ML & Data Science",
    skills: [
      { name: "Machine Learning", aliases: ["machine learning", "ml model", "ml models"], demand: "core" },
      { name: "scikit-learn", aliases: ["scikit-learn", "sklearn"], demand: "core" },
      { name: "XGBoost / Gradient Boosting", aliases: ["xgboost", "gradient boosting", "gradient-boosting", "lightgbm", "catboost"], demand: "common" },
      { name: "Feature Engineering", aliases: ["feature engineering", "engineered features", "feature catalogue", "feature catalog"], demand: "core" },
      { name: "Imbalanced Classification", aliases: ["class imbalance", "imbalanced", "weighted loss", "down-sampling"], demand: "niche" },
      { name: "Probability Calibration", aliases: ["calibration", "calibrated", "isotonic", "temperature scaling", "expected calibration error"], demand: "niche" },
      { name: "Model Evaluation Metrics (PR-AUC, Precision/Recall)", aliases: ["pr-auc", "roc-auc", "precision", "recall", "f1"], demand: "core" },
      { name: "Fraud / Anomaly Detection", aliases: ["fraud detection", "fraud", "anomaly detection"], demand: "niche" },
      { name: "Entity Resolution", aliases: ["entity resolution", "record linkage", "splink", "golden record"], demand: "niche" },
      { name: "NLP", aliases: ["nlp", "natural language processing", "named entity", "ner"], demand: "common" },
      { name: "Computer Vision", aliases: ["computer vision", "opencv", "object detection", "image classification"], demand: "common" },
      { name: "Time-series Forecasting", aliases: ["time series", "time-series", "forecasting"], demand: "niche" },
      { name: "NumPy / Pandas / Polars", aliases: ["numpy", "pandas", "polars"], demand: "core" },
      { name: "Jupyter", aliases: ["jupyter", "notebook", "notebooks"], demand: "common" },
    ],
  },
  {
    name: "LLMOps / MLOps & Evaluation",
    skills: [
      { name: "LLM Evaluation (Evals)", aliases: ["evals", "evaluation harness", "golden set", "golden sets", "golden dataset", "golden datasets", "evaluation gate", "evaluation gates", "llm evaluation"], demand: "core" },
      { name: "LLM Observability (Langfuse / LangSmith)", aliases: ["langfuse", "langsmith", "llm traces", "arize", "phoenix"], demand: "common" },
      { name: "MLflow", aliases: ["mlflow", "model registry"], demand: "common" },
      { name: "Weights & Biases", aliases: ["weights & biases", "wandb", "w&b"], demand: "niche" },
      { name: "LLM Serving (vLLM / TGI / Triton)", aliases: ["vllm", "tensorrt-llm", "tensorrt", "triton", "tgi", "text generation inference", "tei", "inference server", "dynamic batching", "continuous batching"], demand: "common" },
      { name: "GPU Inference & Sizing", aliases: ["gpu", "gpus", "l40s", "a100", "h100", "a10g", "l4"], demand: "common" },
      { name: "LLM Gateway / Model Routing", aliases: ["llm gateway", "litellm", "model routing", "routing policy"], demand: "common" },
      { name: "Drift Monitoring", aliases: ["drift", "psi", "population stability"], demand: "common" },
      { name: "MLOps", aliases: ["mlops", "llmops", "retraining pipeline", "model monitoring"], demand: "core" },
      { name: "LLM Cost Optimisation", aliases: ["token budget", "token budgets", "semantic cache", "cost per", "cost circuit breakers", "denial-of-wallet"], demand: "common" },
      { name: "Amazon SageMaker", aliases: ["sagemaker"], demand: "common" },
    ],
  },
  {
    name: "AI Safety & Security",
    skills: [
      { name: "Prompt Injection Defence", aliases: ["prompt injection", "prompt-injection", "injection classifier", "quarantined reader", "quarantined-reader"], demand: "common" },
      { name: "LLM Guardrails", aliases: ["guardrail", "guardrails", "output dlp", "llama guard"], demand: "common" },
      { name: "AI Red-teaming", aliases: ["red-team", "red team", "red-teaming", "red teaming"], demand: "common" },
      { name: "PII Redaction & Data Privacy", aliases: ["pii", "redaction", "dpdp", "gdpr", "data protection", "macie"], demand: "common" },
      { name: "Hallucination Mitigation", aliases: ["hallucination", "hallucinated", "citation verifier", "faithfulness"], demand: "common" },
    ],
  },
  {
    name: "Backend & APIs",
    skills: [
      { name: "Python", aliases: ["python"], demand: "core" },
      { name: "TypeScript", aliases: ["typescript"], demand: "core" },
      { name: "JavaScript / Node.js", aliases: ["javascript", "node.js", "nodejs", "express"], demand: "core" },
      { name: "FastAPI", aliases: ["fastapi"], demand: "core" },
      { name: "Flask / Django", aliases: ["flask", "django"], demand: "common" },
      { name: "Pydantic", aliases: ["pydantic"], demand: "common" },
      { name: "REST API Design", aliases: ["rest api", "rest apis", "restful", "openapi", "api contract", "api specification"], demand: "core" },
      { name: "Server-Sent Events / WebSockets", aliases: ["sse", "server-sent events", "websocket", "websockets"], demand: "common" },
      { name: "gRPC / GraphQL", aliases: ["grpc", "graphql"], demand: "niche" },
      { name: "Microservices", aliases: ["microservice", "microservices", "service decomposition"], demand: "common" },
      { name: "Go (Golang)", aliases: ["golang"], demand: "niche" },
      { name: "Java", aliases: ["java", "spring boot"], demand: "niche" },
      { name: "Testing (pytest / Playwright)", aliases: ["pytest", "playwright", "unit test", "unit tests", "testcontainers", "hypothesis", "schemathesis"], demand: "common" },
      { name: "Load Testing (k6 / Locust)", aliases: ["k6", "locust", "load test", "load testing"], demand: "niche" },
      { name: "SQLAlchemy / Alembic", aliases: ["sqlalchemy", "alembic"], demand: "niche" },
    ],
  },
  {
    name: "Frontend",
    skills: [
      { name: "React", aliases: ["react", "react 18"], demand: "core" },
      { name: "Next.js", aliases: ["next.js", "nextjs"], demand: "common" },
      { name: "Streamlit / Gradio", aliases: ["streamlit", "gradio"], demand: "common" },
      { name: "Tailwind CSS", aliases: ["tailwind"], demand: "common" },
      { name: "Data Visualisation (ECharts / D3)", aliases: ["echarts", "d3.js", "cytoscape", "maplibre", "plotly"], demand: "niche" },
    ],
  },
  {
    name: "Data Engineering & Streaming",
    skills: [
      { name: "SQL", aliases: ["sql"], demand: "core" },
      { name: "Apache Kafka", aliases: ["kafka", "msk", "kafka connect"], demand: "common" },
      { name: "Change Data Capture (Debezium / DMS)", aliases: ["cdc", "change data capture", "debezium", "dms"], demand: "niche" },
      { name: "Lakehouse (Iceberg / Delta)", aliases: ["lakehouse", "iceberg", "delta lake", "medallion"], demand: "common" },
      { name: "ETL / Data Pipelines", aliases: ["etl", "elt", "data pipeline", "data pipelines", "ingestion"], demand: "core" },
      { name: "Apache Spark", aliases: ["spark", "pyspark"], demand: "common" },
      { name: "Airflow / dbt", aliases: ["airflow", "dbt"], demand: "common" },
      { name: "Snowflake / Databricks / BigQuery", aliases: ["snowflake", "databricks", "bigquery"], demand: "common" },
      { name: "AWS Glue / Athena / Lake Formation", aliases: ["glue", "athena", "lake formation"], demand: "niche" },
      { name: "Data Quality & Lineage", aliases: ["data quality", "lineage", "great expectations", "freshness sla", "freshness slas"], demand: "common" },
      { name: "Event-driven Architecture", aliases: ["event-driven", "event driven", "event backbone", "dead-letter", "outbox", "idempotent"], demand: "common" },
    ],
  },
  {
    name: "Databases & Storage",
    skills: [
      { name: "PostgreSQL", aliases: ["postgresql", "postgres", "aurora"], demand: "core" },
      { name: "Redis", aliases: ["redis", "elasticache"], demand: "common" },
      { name: "MongoDB", aliases: ["mongodb", "mongo"], demand: "common" },
      { name: "OpenSearch / Elasticsearch", aliases: ["opensearch", "elasticsearch"], demand: "common" },
      { name: "Amazon S3", aliases: ["s3", "object lock"], demand: "common" },
      { name: "Feature Store", aliases: ["feature store", "low-latency store"], demand: "niche" },
    ],
  },
  {
    name: "Cloud",
    skills: [
      { name: "AWS", aliases: ["aws", "amazon web services"], demand: "core" },
      { name: "Amazon Bedrock", aliases: ["bedrock"], demand: "common" },
      { name: "Azure / Azure OpenAI", aliases: ["azure", "azure openai"], demand: "common" },
      { name: "Google Cloud / Vertex AI", aliases: ["gcp", "google cloud", "vertex ai"], demand: "common" },
      { name: "Serverless (Lambda / Fargate)", aliases: ["lambda", "fargate", "serverless"], demand: "common" },
      { name: "Vercel", aliases: ["vercel"], demand: "niche" },
    ],
  },
  {
    name: "DevOps, Infra & Observability",
    skills: [
      { name: "Docker", aliases: ["docker", "container", "containers", "containerised", "containerized"], demand: "core" },
      { name: "Kubernetes (EKS)", aliases: ["kubernetes", "k8s", "eks", "karpenter", "keda", "hpa"], demand: "core" },
      { name: "Terraform (IaC)", aliases: ["terraform", "infrastructure as code", "iac"], demand: "common" },
      { name: "CI/CD (GitHub Actions)", aliases: ["ci/cd", "github actions", "pipeline roles"], demand: "core" },
      { name: "GitOps (Argo CD)", aliases: ["argo cd", "argocd", "gitops", "argo rollouts"], demand: "niche" },
      { name: "Git", aliases: ["git", "github", "gitlab"], demand: "core" },
      { name: "Linux", aliases: ["linux", "bash", "shell scripting"], demand: "core" },
      { name: "Observability (OpenTelemetry / Prometheus / Grafana)", aliases: ["opentelemetry", "prometheus", "grafana", "cloudwatch", "datadog", "observability"], demand: "common" },
      { name: "High Availability & Disaster Recovery", aliases: ["multi-az", "disaster recovery", "warm standby", "rpo", "rto", "failover"], demand: "common" },
      { name: "Networking & Security (mTLS, VPC, KMS)", aliases: ["mtls", "mutual tls", "vpc", "kms", "privatelink", "private subnets", "waf"], demand: "common" },
      { name: "Identity & Access (OAuth, SSO, RBAC/ABAC)", aliases: ["oauth", "oidc", "saml", "sso", "rbac", "abac", "cedar", "verified permissions", "irsa"], demand: "common" },
    ],
  },
  {
    name: "Forward Deployed & Delivery",
    skills: [
      { name: "Solution Architecture", aliases: ["solution architecture", "architecture blueprint", "c4", "architecture decision record", "adr"], demand: "core" },
      { name: "System Design", aliases: ["system design", "high-level design", "low-level design", "hld", "lld"], demand: "core" },
      { name: "Requirements Gathering", aliases: ["requirements", "client requirement", "requirement document", "crd", "functional requirements", "non-functional requirements"], demand: "core" },
      { name: "Customer Discovery & Stakeholder Management", aliases: ["stakeholder", "stakeholders", "discovery", "product owner"], demand: "core" },
      { name: "Technical Writing & Documentation", aliases: ["documentation", "runbook", "model card", "technical writing"], demand: "core" },
      { name: "Capacity Planning", aliases: ["capacity planning", "capacity plan", "sizing", "demand model"], demand: "common" },
      { name: "Cloud Cost Modelling (FinOps)", aliases: ["finops", "cost model", "unit economics", "savings plans", "tco"], demand: "common" },
      { name: "Proof of Concept / Rapid Prototyping", aliases: ["poc", "proof of concept", "prototype", "prototyping", "mvp"], demand: "core" },
      { name: "Enterprise Systems Integration (ERP / CRM)", aliases: ["erp", "crm", "sap", "salesforce", "write-back", "itsm", "microsoft graph"], demand: "common" },
      { name: "Compliance (PCI DSS, SOC 2, GDPR)", aliases: ["pci dss", "soc 2", "soc2", "hipaa", "iso 27001", "compliance"], demand: "common" },
      { name: "Risk & Acceptance Criteria", aliases: ["acceptance criteria", "acceptance testing", "raid log", "risk register", "go/no-go"], demand: "common" },
      { name: "Production Debugging & Incident Response", aliases: ["incident response", "on-call", "root cause", "postmortem"], demand: "common" },
    ],
  },
];

const BY_NAME = new Map<string, { category: string; skill: TaxonomySkill }>();
for (const c of TAXONOMY) for (const s of c.skills) BY_NAME.set(s.name.toLowerCase(), { category: c.name, skill: s });

export const ALL_SKILL_NAMES = TAXONOMY.flatMap((c) => c.skills.map((s) => s.name));

export function categoryOf(skill: string): string {
  return BY_NAME.get(skill.toLowerCase())?.category ?? "Other";
}

export function demandOf(skill: string): Demand | undefined {
  return BY_NAME.get(skill.toLowerCase())?.skill.demand;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MATCHERS = TAXONOMY.flatMap((c) =>
  c.skills.map((s) => {
    const terms = [s.name, ...(s.aliases ?? [])].map(escapeRegex);
    return { name: s.name, re: new RegExp(`(?<![a-z0-9])(?:${terms.join("|")})(?![a-z0-9])`, "i") };
  }),
);

/** Taxonomy skills whose name or an alias appears in the text. */
export function detectSkills(text: string): string[] {
  return MATCHERS.filter((m) => m.re.test(text)).map((m) => m.name);
}

/** Group a flat list of skills into taxonomy categories, preserving taxonomy order. */
export function groupSkills(skills: string[]): { category: string; skills: string[] }[] {
  const groups = new Map<string, string[]>();
  for (const c of TAXONOMY) groups.set(c.name, []);
  groups.set("Other", []);
  for (const s of skills) groups.get(categoryOf(s))!.push(s);
  return [...groups.entries()].filter(([, v]) => v.length).map(([category, skills]) => ({ category, skills }));
}
