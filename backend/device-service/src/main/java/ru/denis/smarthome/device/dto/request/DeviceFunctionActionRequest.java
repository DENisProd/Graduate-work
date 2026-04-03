package ru.denis.smarthome.device.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import ru.denis.smarthome.device.model.ActionType;

import java.util.Map;

/**
 * DTO для создания/обновления действия функции устройства.
 */
public record DeviceFunctionActionRequest(
        @NotBlank(message = "Код обязателен")
        @Size(max = 50, message = "Код не должен превышать 50 символов")
        @Pattern(regexp = "^[a-z][a-z0-9_]*$", message = "Код должен состоять из строчных букв, цифр и подчеркиваний")
        String code,

        @NotNull(message = "ID функции устройства обязателен")
        Long deviceFunctionId,

        @NotNull(message = "Тип действия обязателен")
        ActionType actionType,

        @Size(max = 2000, message = "Шаблон payload не должен превышать 2000 символов")
        String payloadTemplate,

        Boolean active,

        @NotEmpty(message = "Необходим хотя бы один перевод")
        @Valid
        Map<String, TranslationRequest> translations
) {
        public DeviceFunctionActionRequest {
                if (active == null) {
                        active = true;
                }
        }
}



