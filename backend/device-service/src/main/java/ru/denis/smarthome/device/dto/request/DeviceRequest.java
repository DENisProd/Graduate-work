package ru.denis.smarthome.device.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import ru.denis.smarthome.device.model.DeviceStatus;

import java.util.Map;

/**
 * DTO для создания/обновления устройства.
 */
public record DeviceRequest(
        @NotBlank(message = "Код обязателен")
        @Size(max = 100, message = "Код не должен превышать 100 символов")
        String code,

        @NotNull(message = "ID категории устройства обязателен")
        Long deviceCategoryId,

        DeviceStatus status,

        @Size(max = 100, message = "Серийный номер не должен превышать 100 символов")
        String serialNumber,

        @Size(max = 50, message = "Версия прошивки не должна превышать 50 символов")
        String firmwareVersion,

        Boolean active,

        @NotEmpty(message = "Необходим хотя бы один перевод")
        @Valid
        Map<String, TranslationRequest> translations
) {
        public DeviceRequest {
                if (status == null) {
                        status = DeviceStatus.OFFLINE;
                }
                if (active == null) {
                        active = true;
                }
        }
}

