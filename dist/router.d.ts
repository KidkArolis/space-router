import { type MatchedRoute } from './match.ts';
import { type Mode, type Schedule } from './history.ts';
import { type Qs } from './qs.ts';
export interface RouterOptions {
    mode?: Mode;
    qs?: Qs;
    sync?: boolean;
    schedule?: Schedule;
}
export interface MatcherOptions {
    qs?: Qs;
}
export interface Route<Data = Record<string, unknown>> extends MatchedRoute {
    data: RouteData<Data>[];
}
export interface NavigateTarget {
    url?: string;
    pathname?: string;
    params?: Record<string, string | number>;
    query?: Record<string, unknown> | null;
    hash?: string | null;
    replace?: boolean;
    merge?: boolean;
}
export type To = string | NavigateTarget;
export type Redirect<Data = Record<string, unknown>> = To | ((route: Route<Data>) => To);
export type RouteData<Data = Record<string, unknown>> = Data & {
    path: string;
    redirect?: Redirect<Data>;
};
export type RouteDefinition<Data = Record<string, unknown>> = Data & {
    path?: string;
    redirect?: Redirect<Data>;
    routes?: RouteDefinition<Data>[];
};
export type From = Pick<NavigateTarget, 'pathname' | 'params' | 'query' | 'hash'> & {
    pattern?: string;
};
export interface Router<Data = Record<string, unknown>> {
    listen(routes: RouteDefinition<Data>[], onChange?: (route: Route<Data>) => void): () => void;
    navigate(to: To, from?: From): void;
    href(to: To, from?: From): string;
    match(url: string): Route<Data> | undefined;
    getUrl(): string;
    /**
     * Replace the current history entry with `url`, using mode-appropriate
     * mechanics, WITHOUT emitting a route change. For callers that have
     * already committed a route and only need the address bar to agree —
     * e.g. after a pre-commit transform rewrote the URL.
     */
    replaceUrl(url: string): void;
}
export interface Matcher<Data = Record<string, unknown>> {
    match(url: string): Route<Data> | undefined;
}
interface FlatRoute<Data = Record<string, unknown>> {
    pattern: string;
    data: RouteData<Data>[];
}
export declare function createRouter<Data = Record<string, unknown>>(options?: RouterOptions): Router<Data>;
export declare function createMatcher<Data = Record<string, unknown>>(routeMap: RouteDefinition<Data>[], options?: MatcherOptions): Matcher<Data>;
export declare function flatten<Data = Record<string, unknown>>(routeMap: RouteDefinition<Data>[]): FlatRoute<Data>[];
export declare function merge(from: From | undefined, to: NavigateTarget): NavigateTarget;
export {};
