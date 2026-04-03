package ru.denis.smarthome.device.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO для передачи переводов.
 */
public record TranslationRequest(
        @Size(max = 255, message = "Название не должно превышать 255 символов")
        String name,

        @Size(max = 2000, message = "Описание не должно превышать 2000 символов")
        String description
) {
}



