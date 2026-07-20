export type Mode = 'history' | 'hash' | 'memory';
export interface History {
    listen(onChange: (url: string, info: NavigationInfo) => void): () => void;
    getUrl(): string;
    push(url: string): void;
    replace(url: string): void;
    replaceSilent(url: string): void;
}
export interface NavigationInfo {
    traversal: boolean;
}
export type ScheduleInfo = NavigationInfo;
export type Schedule = (fire: () => void, info: ScheduleInfo) => void;
export interface CreateHistoryOptions {
    mode?: Mode;
    sync?: boolean;
    schedule?: Schedule;
}
export declare function createHistory(options?: CreateHistoryOptions): History;
export declare function normalizeRouteUrl(url: string): string;
//# sourceMappingURL=history.d.ts.map