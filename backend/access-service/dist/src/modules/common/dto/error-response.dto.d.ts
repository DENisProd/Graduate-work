export declare class ErrorResponse {
    timestamp: string;
    status: number;
    error: string;
    message: string;
    path: string;
    fieldErrors?: Array<{
        field: string;
        message: string;
        rejectedValue?: unknown;
    }>;
}
