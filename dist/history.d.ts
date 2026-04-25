export type Mode = 'history' | 'hash' | 'memory';
export interface History {
    listen(onChange: (url: string) => void): () => void;
    getUrl(): string;
    push(url: string): void;
    replace(url: string): void;
}
export interface CreateHistoryOptions {
    mode?: Mode;
    sync?: boolean;
}
export declare function createHistory(options?: CreateHistoryOptions): History;
