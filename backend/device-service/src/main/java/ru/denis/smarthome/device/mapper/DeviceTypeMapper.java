package ru.denis.smarthome.device.mapper;

import org.springframework.stereotype.Component;
import ru.denis.smarthome.device.dto.request.DeviceTypeRequest;
import ru.denis.smarthome.device.dto.request.TranslationRequest;
import ru.denis.smarthome.device.dto.response.DeviceTypeResponse;
import ru.denis.smarthome.device.dto.response.TranslationResponse;
import ru.denis.smarthome.device.model.DeviceType;
import ru.denis.smarthome.device.model.translation.DeviceTypeTranslation;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Маппер для преобразования DeviceType между Entity и DTO.
 */
@Component
public class DeviceTypeMapper {

    /**
     * Преобразует Entity в локализованный Response DTO.
     */
    public DeviceTypeResponse toResponse(DeviceType entity, String locale) {
        if (entity == null) {
            return null;
        }

        return new DeviceTypeResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(locale),
                entity.getDescription(locale),
                entity.getActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    /**
     * Преобразует Entity в полный Response DTO со всеми переводами.
     */
    public DeviceTypeResponse toFullResponse(DeviceType entity) {
        if (entity == null) {
            return null;
        }

        Map<String, TranslationResponse> translations = entity.getTranslations().entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> toTranslationResponse(e.getValue())
                ));

        return new DeviceTypeResponse(
                entity.getId(),
                entity.getCode(),
                null,
                null,
                entity.getActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                translations
        );
    }

    /**
     * Преобразует список Entity в список полных Response DTO со всеми переводами (для админки).
     */
    public List<DeviceTypeResponse> toFullResponseList(List<DeviceType> entities) {
        return entities.stream()
                .map(this::toFullResponse)
                .collect(Collectors.toList());
    }

    /**
     * Преобразует список Entity в список локализованных Response DTO.
     */
    public List<DeviceTypeResponse> toResponseList(List<DeviceType> entities, String locale) {
        return entities.stream()
                .map(entity -> toResponse(entity, locale))
                .collect(Collectors.toList());
    }

    /**
     * Создает новую Entity из Request DTO.
     */
    public DeviceType toEntity(DeviceTypeRequest request) {
        if (request == null) {
            return null;
        }

        DeviceType entity = DeviceType.builder()
                .code(request.code())
                .active(request.active())
                .build();

        addTranslations(entity, request.translations());

        return entity;
    }

    /**
     * Обновляет существующую Entity из Request DTO.
     */
    public void updateEntity(DeviceType entity, DeviceTypeRequest request) {
        if (entity == null || request == null) {
            return;
        }

        entity.setCode(request.code());
        entity.setActive(request.active());

        // Очищаем старые переводы и добавляем новые
        entity.getTranslations().clear();
        addTranslations(entity, request.translations());
    }

    /**
     * Добавляет переводы к Entity.
     */
    private void addTranslations(DeviceType entity, Map<String, TranslationRequest> translations) {
        if (translations == null) {
            return;
        }

        translations.forEach((locale, translation) ->
                entity.addTranslation(locale, translation.name(), translation.description())
        );
    }

    /**
     * Преобразует Translation Entity в Response DTO.
     */
    private TranslationResponse toTranslationResponse(DeviceTypeTranslation translation) {
        return new TranslationResponse(
                translation.getLocale(),
                translation.getName(),
                translation.getDescription()
        );
    }
}



