/**
 * Users feature - public API.
 * 
 * Exports:
 * - UsersProvider: Context provider for users state
 * - useUsers: Hook to access users state and operations
 * - All user service functions (API calls)
 */
export {
  UsersProvider,
  useUsersContext as useUsers,
} from "./users-context";
export * from "./services/users.service";