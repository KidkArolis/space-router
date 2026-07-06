import type { Qs } from './qs.ts';
export interface MatchedRoute {
    pattern: string;
    url: string;
    pathname: string;
    params: Record<string, string>;
    query: Record<string, string>;
    search: string;
    hash: string;
}
export declare function matchOne(pattern: string, url: string, qs?: Qs): MatchedRoute | undefined;
