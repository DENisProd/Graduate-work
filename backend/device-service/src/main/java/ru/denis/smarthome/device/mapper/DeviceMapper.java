package ru.denis.smarthome.device.mapper;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;
import ru.denis.smarthome.device.dto.request.DeviceRequest;
import ru.denis.smarthome.device.dto.request.TranslationRequest;
import ru.denis.smarthome.device.dto.response.DeviceResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.dto.response.TranslationResponse;
import ru.denis.smarthome.device.model.Device;
import ru.denis.smarthome.device.model.DeviceCategory;
import ru.denis.smarthome.device.model.translation.DeviceTranslation;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Маппер для преобразования Device между Entity и DTO.
 */
@Component
@RequiredArgsConstructor
public class DeviceMapper {

    private final DeviceCategoryMapper deviceCategoryMapper;
    private final DeviceFunctionMapper deviceFunctionMapper;

    /**
     * Преобразует Entity в локализованный Response DTO.
     */
    public DeviceResponse toResponse(Device entity, String locale) {
        if (entity == null) {
            return null;
        }

        return new DeviceResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(locale),
                entity.getDescription(locale),
                deviceCategoryMapper.toResponse(entity.getDeviceCategory(), locale),
                entity.getStatus(),
                entity.isOnline(),
                entity.getSerialNumber(),
                entity.getFirmwareVersion(),
                entity.getActive(),
                entity.getLastSeenAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    /**
     * Преобразует Entity в детальный Response DTO с функциями.
     */
    public DeviceResponse toDetailedResponse(Device entity, String locale) {
        if (entity == null) {
            return null;
        }

        return new DeviceResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(locale),
                entity.getDescription(locale),
                deviceCategoryMapper.toResponse(entity.getDeviceCategory(), locale),
                entity.getStatus(),
                entity.isOnline(),
                entity.getSerialNumber(),
                entity.getFirmwareVersion(),
                entity.getActive(),
                entity.getLastSeenAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                deviceFunctionMapper.toResponseList(entity.getFunctions(), locale),
                null
        );
    }

    /**
     * Преобразует Entity в полный Response DTO со всеми переводами.
     */
    public DeviceResponse toFullResponse(Device entity) {
        if (entity == null) {
            return null;
        }

        Map<String, TranslationResponse> translations = entity.getTranslations().entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> toTranslationResponse(e.getValue())
                ));

        return new DeviceResponse(
                entity.getId(),
                entity.getCode(),
                null,
                null,
                deviceCategoryMapper.toFullResponse(entity.getDeviceCategory()),
                entity.getStatus(),
                entity.isOnline(),
                entity.getSerialNumber(),
                entity.getFirmwareVersion(),
                entity.getActive(),
                entity.getLastSeenAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                null,
                translations
        );
    }

    /**
     * Преобразует список Entity в список локализованных Response DTO.
     */
    public List<DeviceResponse> toResponseList(List<Device> entities, String locale) {
        return entities.stream()
                .map(entity -> toResponse(entity, locale))
                .collect(Collectors.toList());
    }

    /**
     * Преобразует список Entity в список полных Response DTO со всеми переводами (для админки).
     */
    public List<DeviceResponse> toFullResponseList(List<Device> entities) {
        return entities.stream()
                .map(this::toFullResponse)
                .collect(Collectors.toList());
    }

    /**
     * Преобразует Page Entity в PageResponse DTO с полными переводами (для админки).
     */
    public PageResponse<DeviceResponse> toFullPageResponse(Page<Device> page) {
        List<DeviceResponse> content = page.getContent().stream()
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
    public PageResponse<DeviceResponse> toPageResponse(Page<Device> page, String locale) {
        List<DeviceResponse> content = page.getContent().stream()
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
    public Device toEntity(DeviceRequest request, DeviceCategory deviceCategory) {
        if (request == null) {
            return null;
        }

        Device entity = Device.builder()
                .code(request.code())
                .deviceCategory(deviceCategory)
                .status(request.status())
                .serialNumber(request.serialNumber())
                .firmwareVersion(request.firmwareVersion())
                .active(request.active())
                .build();

        addTranslations(entity, request.translations());

        return entity;
    }

    /**
     * Обновляет существующую Entity из Request DTO.
     */
    public void updateEntity(Device entity, DeviceRequest request, DeviceCategory deviceCategory) {
        if (entity == null || request == null) {
            return;
        }

        entity.setCode(request.code());
        entity.setDeviceCategory(deviceCategory);
        entity.setStatus(request.status());
        entity.setSerialNumber(request.serialNumber());
        entity.setFirmwareVersion(request.firmwareVersion());
        entity.setActive(request.active());

        // Очищаем старые переводы и добавляем новые
        entity.getTranslations().clear();
        addTranslations(entity, request.translations());
    }

    /**
     * Добавляет переводы к Entity.
     */
    private void addTranslations(Device entity, Map<String, TranslationRequest> translations) {
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
    private TranslationResponse toTranslationResponse(DeviceTranslation translation) {
        return new TranslationResponse(
                translation.getLocale(),
                translation.getName(),
                translation.getDescription()
        );
    }
}

