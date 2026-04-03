package ru.denis.smarthome.device.dto.response;

/**
 * DTO для возврата переводов.
 */
public record TranslationResponse(
        String locale,
        String name,
        String description
) {
}



