/**
 * Type declarations for optional peer dependencies
 * These allow the hooks to compile even if React/React Query are not installed
 */

declare module '@tanstack/react-query' {
  export function useQuery<T>(options: any): any;
  export function useMutation<T>(options: any): any;
  export function useQueryClient(): any;
}

declare module 'react' {
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useState<T>(initial: T): [T, (value: T) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
}


