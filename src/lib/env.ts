const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEWS_API_KEY',
  'OPENAI_API_KEY',
] as const

// Optional environment variables for reference
// const optionalEnvVars = [
//   'SUPABASE_SERVICE_ROLE_KEY',
//   'NEXTAUTH_URL',
//   'NEXTAUTH_SECRET',
//   'FINLIGHT_API_KEY',
// ] as const

// Optional environment variables for reference
// const optionalEnvVars = [
//   'SUPABASE_SERVICE_ROLE_KEY',
//   'NEXTAUTH_URL',
//   'NEXTAUTH_SECRET',
// ] as const

export function validateEnv() {
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  )

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    )
  }

  return {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    nextauth: {
      url: process.env.NEXTAUTH_URL,
      secret: process.env.NEXTAUTH_SECRET,
    },
    newsapi: {
      apiKey: process.env.NEWS_API_KEY,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  }
}

export function getEnv() {
  return validateEnv()
} 