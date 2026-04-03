package ru.denis.smarthome.device.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import ru.denis.smarthome.device.model.ActionType;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO для возврата действия функции устройства.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record DeviceFunctionActionResponse(
        Long id,
        String code,
        String name,
        String description,
        Long deviceFunctionId,
        ActionType actionType,
        String payloadTemplate,
        Boolean active,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt,

        Map<String, TranslationResponse> translations
) {
        /**
         * Конструктор для краткого локализованного ответа.
         */
        public DeviceFunctionActionResponse(Long id, String code, String name, String description,
                                             Long deviceFunctionId, ActionType actionType,
                                             String payloadTemplate, Boolean active,
                                             LocalDateTime createdAt, LocalDateTime updatedAt) {
                this(id, code, name, description, deviceFunctionId, actionType, payloadTemplate, active,
                        createdAt, updatedAt, null);
        }
}



