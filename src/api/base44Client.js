// Stub file - base44 has been removed
// This file exists only to prevent import errors in files that haven't been refactored yet

console.warn('base44Client is deprecated and should not be used. Please refactor to use Supabase directly.');

export const base44 = {
  Auth: {
    login: () => Promise.reject(new Error('base44 Auth deprecated')),
    logout: () => Promise.reject(new Error('base44 Auth deprecated')),
    getCurrentUser: () => Promise.reject(new Error('base44 Auth deprecated'))
  },
  appLogs: {
    logUserInApp: () => Promise.resolve() // Silent no-op for navigation tracking
  },
  entities: new Proxy({}, {
    get: () => ({
      find: () => Promise.reject(new Error('base44 entities deprecated - use Supabase')),
      findOne: () => Promise.reject(new Error('base44 entities deprecated - use Supabase')),
      create: () => Promise.reject(new Error('base44 entities deprecated - use Supabase')),
      update: () => Promise.reject(new Error('base44 entities deprecated - use Supabase')),
      delete: () => Promise.reject(new Error('base44 entities deprecated - use Supabase'))
    })
  })
};

export default base44;
