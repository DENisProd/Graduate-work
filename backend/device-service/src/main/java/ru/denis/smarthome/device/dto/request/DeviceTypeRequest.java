package ru.denis.smarthome.device.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Map;

/**
 * DTO для создания/обновления типа устройства.
 */
public record DeviceTypeRequest(
        @NotBlank(message = "Код обязателен")
        @Size(max = 50, message = "Код не должен превышать 50 символов")
        @Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "Код должен состоять из заглавных букв, цифр и подчеркиваний")
        String code,

        Boolean active,

        @NotEmpty(message = "Необходим хотя бы один перевод")
        @Valid
        Map<String, TranslationRequest> translations
) {
        public DeviceTypeRequest {
                if (active == null) {
                        active = true;
                }
        }
}



