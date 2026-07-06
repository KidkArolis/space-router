export type Mode = 'history' | 'hash' | 'memory';
export interface History {
    listen(onChange: (url: string) => void): () => void;
    getUrl(): string;
    push(url: string): void;
    replace(url: string): void;
}
export interface ScheduleInfo {
    traversal: boolean;
}
export type Schedule = (fire: () => void, info: ScheduleInfo) => void;
export interface CreateHistoryOptions {
    mode?: Mode;
    sync?: boolean;
    schedule?: Schedule;
}
export declare function createHistory(options?: CreateHistoryOptions): History;
