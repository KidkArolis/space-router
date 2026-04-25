export type Mode = 'history' | 'hash' | 'memory';
export interface History {
    listen(onChange: (url: string, state: unknown) => void): () => void;
    getUrl(): string;
    push(url: string, state?: unknown): void;
    replace(url: string, state?: unknown): void;
}
export interface CreateHistoryOptions {
    mode?: Mode;
    sync?: boolean;
}
export declare function createHistory(options?: CreateHistoryOptions): History;
