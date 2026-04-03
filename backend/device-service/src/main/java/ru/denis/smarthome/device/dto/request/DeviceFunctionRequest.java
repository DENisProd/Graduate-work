package ru.denis.smarthome.device.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import ru.denis.smarthome.device.model.DeviceFunctionType;

import java.util.Map;

/**
 * DTO для создания/обновления функции устройства.
 */
public record DeviceFunctionRequest(
        @NotBlank(message = "Код обязателен")
        @Size(max = 50, message = "Код не должен превышать 50 символов")
        @Pattern(regexp = "^[a-z][a-z0-9_]*$", message = "Код должен состоять из строчных букв, цифр и подчеркиваний")
        String code,

        @NotNull(message = "ID устройства обязателен")
        Long deviceId,

        @NotNull(message = "Тип функции обязателен")
        DeviceFunctionType functionType,

        String currentValue,

        Double minValue,

        Double maxValue,

        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unit,

        Boolean active,

        @NotEmpty(message = "Необходим хотя бы один перевод")
        @Valid
        Map<String, TranslationRequest> translations
) {
        public DeviceFunctionRequest {
                if (active == null) {
                        active = true;
                }
        }
}



