package com.maka.stock.core;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

/**
 * Format de réponse standardisé pour TOUS les endpoints du stock-service.
 * Inspiré du pattern ApiResponse de l'architecture MAKA Hub-and-Spoke.
 */
@Getter
@Builder
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private String message;
    private String traceId;

    // ── Factories statiques ──

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .message("OK")
                .traceId(UUID.randomUUID().toString())
                .build();
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .message(message)
                .traceId(UUID.randomUUID().toString())
                .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .data(null)
                .message(message)
                .traceId(UUID.randomUUID().toString())
                .build();
    }
}
