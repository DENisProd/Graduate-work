package ru.denis.smarthome.device.mapper;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;
import ru.denis.smarthome.device.dto.request.DeviceFunctionRequest;
import ru.denis.smarthome.device.dto.request.TranslationRequest;
import ru.denis.smarthome.device.dto.response.DeviceFunctionResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.dto.response.TranslationResponse;
import ru.denis.smarthome.device.model.Device;
import ru.denis.smarthome.device.model.DeviceFunction;
import ru.denis.smarthome.device.model.translation.DeviceFunctionTranslation;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Маппер для преобразования DeviceFunction между Entity и DTO.
 */
@Component
@RequiredArgsConstructor
public class DeviceFunctionMapper {

    @Lazy
    private final DeviceFunctionActionMapper deviceFunctionActionMapper;

    /**
     * Преобразует Entity в локализованный Response DTO.
     */
    public DeviceFunctionResponse toResponse(DeviceFunction entity, String locale) {
        if (entity == null) {
            return null;
        }

        return new DeviceFunctionResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(locale),
                entity.getDescription(locale),
                entity.getDevice().getId(),
                entity.getFunctionType(),
                entity.getCurrentValue(),
                entity.getMinValue(),
                entity.getMaxValue(),
                entity.getUnit(),
                entity.getActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    /**
     * Преобразует Entity в детальный Response DTO с действиями.
     */
    public DeviceFunctionResponse toDetailedResponse(DeviceFunction entity, String locale) {
        if (entity == null) {
            return null;
        }

        return new DeviceFunctionResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(locale),
                entity.getDescription(locale),
                entity.getDevice().getId(),
                entity.getFunctionType(),
                entity.getCurrentValue(),
                entity.getMinValue(),
                entity.getMaxValue(),
                entity.getUnit(),
                entity.getActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                deviceFunctionActionMapper.toResponseList(entity.getActions(), locale),
                null
        );
    }

    /**
     * Преобразует Entity в полный Response DTO со всеми переводами.
     */
    public DeviceFunctionResponse toFullResponse(DeviceFunction entity) {
        if (entity == null) {
            return null;
        }

        Map<String, TranslationResponse> translations = entity.getTranslations().entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> toTranslationResponse(e.getValue())
                ));

        return new DeviceFunctionResponse(
                entity.getId(),
                entity.getCode(),
                null,
                null,
                entity.getDevice().getId(),
                entity.getFunctionType(),
                entity.getCurrentValue(),
                entity.getMinValue(),
                entity.getMaxValue(),
                entity.getUnit(),
                entity.getActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                null,
                translations
        );
    }

    /**
     * Преобразует список Entity в список локализованных Response DTO.
     */
    public List<DeviceFunctionResponse> toResponseList(List<DeviceFunction> entities, String locale) {
        return entities.stream()
                .map(entity -> toResponse(entity, locale))
                .collect(Collectors.toList());
    }

    /**
     * Преобразует список Entity в список полных Response DTO со всеми переводами (для админки).
     */
    public List<DeviceFunctionResponse> toFullResponseList(List<DeviceFunction> entities) {
        return entities.stream()
                .map(this::toFullResponse)
                .collect(Collectors.toList());
    }

    /**
     * Преобразует Page Entity в PageResponse DTO с полными переводами (для админки).
     */
    public PageResponse<DeviceFunctionResponse> toFullPageResponse(Page<DeviceFunction> page) {
        List<DeviceFunctionResponse> content = page.getContent().stream()
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
    public PageResponse<DeviceFunctionResponse> toPageResponse(Page<DeviceFunction> page, String locale) {
        List<DeviceFunctionResponse> content = page.getContent().stream()
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
    public DeviceFunction toEntity(DeviceFunctionRequest request, Device device) {
        if (request == null) {
            return null;
        }

        DeviceFunction entity = DeviceFunction.builder()
                .code(request.code())
                .device(device)
                .functionType(request.functionType())
                .currentValue(request.currentValue())
                .minValue(request.minValue())
                .maxValue(request.maxValue())
                .unit(request.unit())
                .active(request.active())
                .build();

        addTranslations(entity, request.translations());

        return entity;
    }

    /**
     * Обновляет существующую Entity из Request DTO.
     */
    public void updateEntity(DeviceFunction entity, DeviceFunctionRequest request, Device device) {
        if (entity == null || request == null) {
            return;
        }

        entity.setCode(request.code());
        entity.setDevice(device);
        entity.setFunctionType(request.functionType());
        entity.setCurrentValue(request.currentValue());
        entity.setMinValue(request.minValue());
        entity.setMaxValue(request.maxValue());
        entity.setUnit(request.unit());
        entity.setActive(request.active());

        // Обновляем переводы (upsert logic)
        updateTranslations(entity, request.translations());
    }

    /**
     * Обновляет переводы Entity: удаляет лишние, обновляет существующие, добавляет новые.
     */
    private void updateTranslations(DeviceFunction entity, Map<String, TranslationRequest> requestTranslations) {
        if (requestTranslations == null) {
            entity.getTranslations().clear();
            return;
        }

        // 1. Удаляем переводы, которых нет в запросе
        entity.getTranslations().keySet().removeIf(locale -> !requestTranslations.containsKey(locale));

        // 2. Обновляем существующие или добавляем новые
        requestTranslations.forEach((locale, translationReq) -> {
            DeviceFunctionTranslation existing = entity.getTranslations().get(locale);
            if (existing != null) {
                existing.setName(translationReq.name());
                existing.setDescription(translationReq.description());
            } else {
                entity.addTranslation(locale, translationReq.name(), translationReq.description());
            }
        });
    }

    /**
     * Добавляет переводы к Entity (для создания).
     */
    private void addTranslations(DeviceFunction entity, Map<String, TranslationRequest> translations) {
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
    private TranslationResponse toTranslationResponse(DeviceFunctionTranslation translation) {
        return new TranslationResponse(
                translation.getLocale(),
                translation.getName(),
                translation.getDescription()
        );
    }
}

