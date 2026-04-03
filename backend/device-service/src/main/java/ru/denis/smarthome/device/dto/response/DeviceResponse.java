package ru.denis.smarthome.device.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import ru.denis.smarthome.device.model.DeviceStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO для возврата устройства.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record DeviceResponse(
        Long id,
        String code,
        String name,
        String description,
        DeviceCategoryResponse category,
        DeviceStatus status,
        Boolean online,
        String serialNumber,
        String firmwareVersion,
        Boolean active,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime lastSeenAt,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt,

        List<DeviceFunctionResponse> functions,

        Map<String, TranslationResponse> translations
) {
        /**
         * Конструктор для краткого локализованного ответа.
         */
        public DeviceResponse(Long id, String code, String name, String description,
                               DeviceCategoryResponse category, DeviceStatus status, Boolean online,
                               String serialNumber, String firmwareVersion, Boolean active,
                               LocalDateTime lastSeenAt, LocalDateTime createdAt, LocalDateTime updatedAt) {
                this(id, code, name, description, category, status, online, serialNumber, firmwareVersion,
                        active, lastSeenAt, createdAt, updatedAt, null, null);
        }
}

