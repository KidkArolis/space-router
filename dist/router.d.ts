import { type MatchedRoute } from './match.ts';
import { type Mode } from './history.ts';
import { type Qs } from './qs.ts';
export interface RouterOptions {
    mode?: Mode;
    qs?: Qs;
    sync?: boolean;
}
export interface Route<Data = Record<string, unknown>> extends MatchedRoute {
    data: Data[];
    /**
     * Opaque state passed via `navigate(to, { state })`. Populated when the
     * route is delivered through `listen()`; `undefined` from `match()`.
     */
    state?: unknown;
}
export interface NavigateTarget {
    url?: string;
    pathname?: string;
    params?: Record<string, string | number>;
    query?: Record<string, unknown> | null;
    hash?: string | null;
    replace?: boolean;
    merge?: boolean;
    /**
     * Opaque value stashed alongside the navigation. Forwarded to
     * `history.pushState`/`replaceState` in history mode and surfaced as
     * `route.state` in the listen callback. Ignored in hash mode (no DOM
     * support).
     */
    state?: unknown;
}
export type To = string | NavigateTarget;
export type Redirect<Data = Record<string, unknown>> = To | ((route: Route<Data>) => To);
export type RouteDefinition<Data = Record<string, unknown>> = Data & {
    path?: string;
    redirect?: Redirect<Data>;
    routes?: RouteDefinition<Data>[];
};
export interface Router<Data = Record<string, unknown>> {
    listen(routes: RouteDefinition<Data>[], onChange?: (route: Route<Data>) => void): () => void;
    navigate(to: To, curr?: Route<Data>): void;
    href(to: To, curr?: Route<Data>): string;
    match(url: string): Route<Data> | undefined;
    getUrl(): string;
}
interface FlatRoute {
    pattern: string;
    data: Array<Record<string, unknown>>;
}
export declare function createRouter<Data = Record<string, unknown>>(options?: RouterOptions): Router<Data>;
export declare function flatten(routeMap: RouteDefinition[]): FlatRoute[];
export declare function merge(curr: Partial<Route> | NavigateTarget | undefined, to: NavigateTarget): NavigateTarget;
export {};
