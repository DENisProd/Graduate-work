package ru.denis.smarthome.device.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO для возврата типа устройства.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record DeviceTypeResponse(
        Long id,
        String code,
        String name,
        String description,
        Boolean active,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt,

        Map<String, TranslationResponse> translations
) {
        /**
         * Конструктор для локализованного ответа (без всех переводов).
         */
        public DeviceTypeResponse(Long id, String code, String name, String description,
                                   Boolean active, LocalDateTime createdAt, LocalDateTime updatedAt) {
                this(id, code, name, description, active, createdAt, updatedAt, null);
        }
}



