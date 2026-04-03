export declare class FieldErrorDto {
    field: string;
    message: string;
    rejectedValue?: unknown;
}
export declare class ErrorResponse {
    timestamp: string;
    status: number;
    error: string;
    message: string;
    path: string;
    fieldErrors?: FieldErrorDto[];
}
