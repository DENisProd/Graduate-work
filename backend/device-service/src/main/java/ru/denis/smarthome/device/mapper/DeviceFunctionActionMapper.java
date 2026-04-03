package ru.denis.smarthome.device.mapper;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;
import ru.denis.smarthome.device.dto.request.DeviceFunctionActionRequest;
import ru.denis.smarthome.device.dto.request.TranslationRequest;
import ru.denis.smarthome.device.dto.response.DeviceFunctionActionResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.dto.response.TranslationResponse;
import ru.denis.smarthome.device.model.DeviceFunction;
import ru.denis.smarthome.device.model.DeviceFunctionAction;
import ru.denis.smarthome.device.model.translation.DeviceFunctionActionTranslation;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Маппер для преобразования DeviceFunctionAction между Entity и DTO.
 */
@Component
public class DeviceFunctionActionMapper {

    /**
     * Преобразует Entity в локализованный Response DTO.
     */
    public DeviceFunctionActionResponse toResponse(DeviceFunctionAction entity, String locale) {
        if (entity == null) {
            return null;
        }

        return new DeviceFunctionActionResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(locale),
                entity.getDescription(locale),
                entity.getDeviceFunction().getId(),
                entity.getActionType(),
                entity.getPayloadTemplate(),
                entity.getActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    /**
     * Преобразует Entity в полный Response DTO со всеми переводами.
     */
    public DeviceFunctionActionResponse toFullResponse(DeviceFunctionAction entity) {
        if (entity == null) {
            return null;
        }

        Map<String, TranslationResponse> translations = entity.getTranslations().entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> toTranslationResponse(e.getValue())
                ));

        return new DeviceFunctionActionResponse(
                entity.getId(),
                entity.getCode(),
                null,
                null,
                entity.getDeviceFunction().getId(),
                entity.getActionType(),
                entity.getPayloadTemplate(),
                entity.getActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                translations
        );
    }

    /**
     * Преобразует список Entity в список локализованных Response DTO.
     */
    public List<DeviceFunctionActionResponse> toResponseList(List<DeviceFunctionAction> entities, String locale) {
        return entities.stream()
                .map(entity -> toResponse(entity, locale))
                .collect(Collectors.toList());
    }

    /**
     * Преобразует список Entity в список полных Response DTO со всеми переводами (для админки).
     */
    public List<DeviceFunctionActionResponse> toFullResponseList(List<DeviceFunctionAction> entities) {
        return entities.stream()
                .map(this::toFullResponse)
                .collect(Collectors.toList());
    }

    /**
     * Преобразует Page Entity в PageResponse DTO с полными переводами (для админки).
     */
    public PageResponse<DeviceFunctionActionResponse> toFullPageResponse(Page<DeviceFunctionAction> page) {
        List<DeviceFunctionActionResponse> content = page.getContent().stream()
                .map(this::toFullResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast(),
                page.hasNext(),
                page.hasPrevious()
        );
    }

    /**
     * Преобразует Page Entity в PageResponse DTO.
     */
    public PageResponse<DeviceFunctionActionResponse> toPageResponse(Page<DeviceFunctionAction> page, String locale) {
        List<DeviceFunctionActionResponse> content = page.getContent().stream()
                .map(entity -> toResponse(entity, locale))
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast(),
                page.hasNext(),
                page.hasPrevious()
        );
    }

    /**
     * Создает новую Entity из Request DTO.
     */
    public DeviceFunctionAction toEntity(DeviceFunctionActionRequest request, DeviceFunction deviceFunction) {
        if (request == null) {
            return null;
        }

        DeviceFunctionAction entity = DeviceFunctionAction.builder()
                .code(request.code())
                .deviceFunction(deviceFunction)
                .actionType(request.actionType())
                .payloadTemplate(request.payloadTemplate())
                .active(request.active())
                .build();

        addTranslations(entity, request.translations());

        return entity;
    }

    /**
     * Обновляет существующую Entity из Request DTO.
     */
    public void updateEntity(DeviceFunctionAction entity, DeviceFunctionActionRequest request,
                              DeviceFunction deviceFunction) {
        if (entity == null || request == null) {
            return;
        }

        entity.setCode(request.code());
        entity.setDeviceFunction(deviceFunction);
        entity.setActionType(request.actionType());
        entity.setPayloadTemplate(request.payloadTemplate());
        entity.setActive(request.active());

        // Очищаем старые переводы и добавляем новые
        entity.getTranslations().clear();
        addTranslations(entity, request.translations());
    }

    /**
     * Добавляет переводы к Entity.
     */
    private void addTranslations(DeviceFunctionAction entity, Map<String, TranslationRequest> translations) {
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
    private TranslationResponse toTranslationResponse(DeviceFunctionActionTranslation translation) {
        return new TranslationResponse(
                translation.getLocale(),
                translation.getName(),
                translation.getDescription()
        );
    }
}

