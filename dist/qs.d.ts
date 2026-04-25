export interface Qs {
    parse(queryString: string): Record<string, string>;
    stringify(query: Record<string, unknown>): string;
}
export declare const qs: Qs;
