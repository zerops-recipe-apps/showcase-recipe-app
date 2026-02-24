export const config = {
  port: parseInt(process.env.API_PORT || "3000"),

  db: {
    host: process.env.DB_HOST || process.env.db_hostname || "localhost",
    port: parseInt(process.env.DB_PORT || process.env.db_port || "5432"),
    user: process.env.DB_USER || process.env.db_user || "postgres",
    password: process.env.DB_PASS || process.env.db_password || "postgres",
    database: process.env.DB_NAME || process.env.db_dbName || "db",
  },

  valkey: {
    host: process.env.REDIS_HOST || process.env.redis_hostname || "localhost",
    port: parseInt(process.env.REDIS_PORT || process.env.redis_port || "6379"),
    password: undefined as string | undefined,
  },

  nats: {
    host: process.env.NATS_HOST || process.env.queue_hostname || "localhost",
    port: parseInt(process.env.NATS_PORT || process.env.queue_port || "4222"),
    user: process.env.NATS_USER || process.env.queue_user || undefined,
    password: process.env.NATS_PASS || process.env.queue_password || undefined,
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT || process.env.storage_apiUrl || "https://localhost",
    accessKeyId: process.env.S3_ACCESS_KEY || process.env.storage_accessKeyId || "",
    secretAccessKey: process.env.S3_SECRET_KEY || process.env.storage_secretAccessKey || "",
    bucket: process.env.S3_BUCKET || process.env.storage_bucketName || "",
  },

  upload: {
    maxSizeMB: parseInt(process.env.UPLOAD_MAX_SIZE_MB || "10"),
  },

  demoBurstMax: parseInt(process.env.DEMO_BURST_MAX || "20"),
} as const;
