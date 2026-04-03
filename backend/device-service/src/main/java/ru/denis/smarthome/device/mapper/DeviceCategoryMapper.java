package ru.denis.smarthome.device.mapper;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;
import ru.denis.smarthome.device.dto.request.DeviceCategoryRequest;
import ru.denis.smarthome.device.dto.request.TranslationRequest;
import ru.denis.smarthome.device.dto.response.DeviceCategoryResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.dto.response.TranslationResponse;
import ru.denis.smarthome.device.model.DeviceCategory;
import ru.denis.smarthome.device.model.DeviceType;
import ru.denis.smarthome.device.model.translation.DeviceCategoryTranslation;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Маппер для преобразования DeviceCategory между Entity и DTO.
 */
@Component
@RequiredArgsConstructor
public class DeviceCategoryMapper {

    private final DeviceTypeMapper deviceTypeMapper;

    /**
     * Преобразует Entity в локализованный Response DTO.
     */
    public DeviceCategoryResponse toResponse(DeviceCategory entity, String locale) {
        if (entity == null) {
            return null;
        }

        return new DeviceCategoryResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(locale),
                entity.getDescription(locale),
                deviceTypeMapper.toResponse(entity.getDeviceType(), locale),
                entity.getActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    /**
     * Преобразует Entity в полный Response DTO со всеми переводами.
     */
    public DeviceCategoryResponse toFullResponse(DeviceCategory entity) {
        if (entity == null) {
            return null;
        }

        Map<String, TranslationResponse> translations = entity.getTranslations().entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> toTranslationResponse(e.getValue())
                ));

        return new DeviceCategoryResponse(
                entity.getId(),
                entity.getCode(),
                null,
                null,
                deviceTypeMapper.toFullResponse(entity.getDeviceType()),
                entity.getActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                translations
        );
    }

    /**
     * Преобразует список Entity в список локализованных Response DTO.
     */
    public List<DeviceCategoryResponse> toResponseList(List<DeviceCategory> entities, String locale) {
        return entities.stream()
                .map(entity -> toResponse(entity, locale))
                .collect(Collectors.toList());
    }

    /**
     * Преобразует список Entity в список полных Response DTO со всеми переводами (для админки).
     */
    public List<DeviceCategoryResponse> toFullResponseList(List<DeviceCategory> entities) {
        return entities.stream()
                .map(this::toFullResponse)
                .collect(Collectors.toList());
    }

    /**
     * Преобразует Page Entity в PageResponse DTO с полными переводами (для админки).
     */
    public PageResponse<DeviceCategoryResponse> toFullPageResponse(Page<DeviceCategory> page) {
        List<DeviceCategoryResponse> content = page.getContent().stream()
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
    public PageResponse<DeviceCategoryResponse> toPageResponse(Page<DeviceCategory> page, String locale) {
        List<DeviceCategoryResponse> content = page.getContent().stream()
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
    public DeviceCategory toEntity(DeviceCategoryRequest request, DeviceType deviceType) {
        if (request == null) {
            return null;
        }

        DeviceCategory entity = DeviceCategory.builder()
                .code(request.code())
                .deviceType(deviceType)
                .active(request.active())
                .build();

        addTranslations(entity, request.translations());

        return entity;
    }

    /**
     * Обновляет существующую Entity из Request DTO.
     */
    public void updateEntity(DeviceCategory entity, DeviceCategoryRequest request, DeviceType deviceType) {
        if (entity == null || request == null) {
            return;
        }

        entity.setCode(request.code());
        entity.setDeviceType(deviceType);
        entity.setActive(request.active());

        // Очищаем старые переводы и добавляем новые
        entity.getTranslations().clear();
        addTranslations(entity, request.translations());
    }

    /**
     * Добавляет переводы к Entity.
     */
    private void addTranslations(DeviceCategory entity, Map<String, TranslationRequest> translations) {
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
    private TranslationResponse toTranslationResponse(DeviceCategoryTranslation translation) {
        return new TranslationResponse(
                translation.getLocale(),
                translation.getName(),
                translation.getDescription()
        );
    }
}

