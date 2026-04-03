package ru.denis.smarthome.device.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import ru.denis.smarthome.device.model.DeviceFunctionType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO для возврата функции устройства.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record DeviceFunctionResponse(
        Long id,
        String code,
        String name,
        String description,
        Long deviceId,
        DeviceFunctionType functionType,
        String currentValue,
        Double minValue,
        Double maxValue,
        String unit,
        Boolean active,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt,

        List<DeviceFunctionActionResponse> actions,

        Map<String, TranslationResponse> translations
) {
        /**
         * Конструктор для краткого локализованного ответа.
         */
        public DeviceFunctionResponse(Long id, String code, String name, String description,
                                       Long deviceId, DeviceFunctionType functionType,
                                       String currentValue, Double minValue, Double maxValue, String unit,
                                       Boolean active, LocalDateTime createdAt, LocalDateTime updatedAt) {
                this(id, code, name, description, deviceId, functionType, currentValue, minValue, maxValue, unit,
                        active, createdAt, updatedAt, null, null);
        }
}



