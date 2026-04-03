package ru.denis.smarthome.device.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.denis.smarthome.device.dto.request.DeviceFunctionActionRequest;
import ru.denis.smarthome.device.dto.response.DeviceFunctionActionResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.exception.DuplicateResourceException;
import ru.denis.smarthome.device.exception.ResourceNotFoundException;
import ru.denis.smarthome.device.mapper.DeviceFunctionActionMapper;
import ru.denis.smarthome.device.model.DeviceFunction;
import ru.denis.smarthome.device.model.DeviceFunctionAction;
import ru.denis.smarthome.device.repository.DeviceFunctionActionRepository;

import java.util.List;

/**
 * Сервис для работы с действиями функций устройств.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeviceFunctionActionService {

    private final DeviceFunctionActionRepository deviceFunctionActionRepository;
    private final DeviceFunctionActionMapper deviceFunctionActionMapper;
    private final DeviceFunctionService deviceFunctionService;
    private final LocaleService localeService;

    /**
     * Получить все действия функции (без пагинации).
     */
    public List<DeviceFunctionActionResponse> findByFunctionId(Long functionId) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение действий функции: {}, локаль: {}", functionId, locale);

        List<DeviceFunctionAction> actions = deviceFunctionActionRepository
                .findByFunctionIdWithTranslations(functionId);
        return deviceFunctionActionMapper.toResponseList(actions, locale);
    }

    /**
     * Получить все действия функции с пагинацией.
     */
    public PageResponse<DeviceFunctionActionResponse> findByFunctionId(Long functionId, Pageable pageable) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение действий функции: {}, страница: {}, локаль: {}", functionId, pageable.getPageNumber(), locale);

        Page<DeviceFunctionAction> actionPage = deviceFunctionActionRepository
                .findByFunctionIdWithTranslations(functionId, pageable);
        return deviceFunctionActionMapper.toPageResponse(actionPage, locale);
    }

    /**
     * Получить все действия устройства (без пагинации).
     */
    public List<DeviceFunctionActionResponse> findByDeviceId(Long deviceId) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение действий устройства: {}, локаль: {}", deviceId, locale);

        List<DeviceFunctionAction> actions = deviceFunctionActionRepository
                .findByDeviceIdWithTranslations(deviceId);
        return deviceFunctionActionMapper.toResponseList(actions, locale);
    }

    /**
     * Получить все действия устройства с пагинацией.
     */
    public PageResponse<DeviceFunctionActionResponse> findByDeviceId(Long deviceId, Pageable pageable) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение действий устройства: {}, страница: {}, локаль: {}", deviceId, pageable.getPageNumber(), locale);

        Page<DeviceFunctionAction> actionPage = deviceFunctionActionRepository
                .findByDeviceIdWithTranslations(deviceId, pageable);
        return deviceFunctionActionMapper.toPageResponse(actionPage, locale);
    }

    /**
     * Получить действие по ID.
     */
    public DeviceFunctionActionResponse findById(Long id) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение действия функции по ID: {}, локаль: {}", id, locale);

        DeviceFunctionAction action = getActionById(id);
        return deviceFunctionActionMapper.toResponse(action, locale);
    }

    /**
     * Получить действие по ID с полными переводами (для админки).
     */
    public DeviceFunctionActionResponse findByIdFull(Long id) {
        log.debug("Получение полного действия функции по ID: {}", id);

        DeviceFunctionAction action = getActionById(id);
        return deviceFunctionActionMapper.toFullResponse(action);
    }

    /**
     * Получить все действия функции со всеми переводами (для админки).
     */
    public List<DeviceFunctionActionResponse> findByFunctionIdFull(Long functionId) {
        log.debug("Получение действий функции {} со всеми переводами", functionId);

        List<DeviceFunctionAction> actions = deviceFunctionActionRepository
                .findByFunctionIdWithTranslations(functionId);
        return deviceFunctionActionMapper.toFullResponseList(actions);
    }

    /**
     * Получить все действия функции со всеми переводами с пагинацией (для админки).
     */
    public PageResponse<DeviceFunctionActionResponse> findByFunctionIdFull(Long functionId, Pageable pageable) {
        log.debug("Получение действий функции {} со всеми переводами, страница: {}", functionId, pageable.getPageNumber());

        Page<DeviceFunctionAction> actionPage = deviceFunctionActionRepository
                .findByFunctionIdWithTranslations(functionId, pageable);
        return deviceFunctionActionMapper.toFullPageResponse(actionPage);
    }

    /**
     * Получить все действия устройства со всеми переводами (для админки).
     */
    public List<DeviceFunctionActionResponse> findByDeviceIdFull(Long deviceId) {
        log.debug("Получение действий устройства {} со всеми переводами", deviceId);

        List<DeviceFunctionAction> actions = deviceFunctionActionRepository
                .findByDeviceIdWithTranslations(deviceId);
        return deviceFunctionActionMapper.toFullResponseList(actions);
    }

    /**
     * Получить все действия устройства со всеми переводами с пагинацией (для админки).
     */
    public PageResponse<DeviceFunctionActionResponse> findByDeviceIdFull(Long deviceId, Pageable pageable) {
        log.debug("Получение действий устройства {} со всеми переводами, страница: {}", deviceId, pageable.getPageNumber());

        Page<DeviceFunctionAction> actionPage = deviceFunctionActionRepository
                .findByDeviceIdWithTranslations(deviceId, pageable);
        return deviceFunctionActionMapper.toFullPageResponse(actionPage);
    }

    /**
     * Создать новое действие функции.
     */
    @Transactional
    public DeviceFunctionActionResponse create(DeviceFunctionActionRequest request) {
        log.info("Создание нового действия функции: {} для функции: {}",
                request.code(), request.deviceFunctionId());

        validateCodeUniqueness(request.deviceFunctionId(), request.code(), null);

        DeviceFunction function = deviceFunctionService.getFunctionById(request.deviceFunctionId());
        DeviceFunctionAction action = deviceFunctionActionMapper.toEntity(request, function);
        action = deviceFunctionActionRepository.save(action);

        log.info("Действие функции создано с ID: {}", action.getId());
        return deviceFunctionActionMapper.toResponse(action, localeService.getCurrentLocale());
    }

    /**
     * Обновить действие функции.
     */
    @Transactional
    public DeviceFunctionActionResponse update(Long id, DeviceFunctionActionRequest request) {
        log.info("Обновление действия функции с ID: {}", id);

        DeviceFunctionAction action = getActionById(id);
        validateCodeUniqueness(request.deviceFunctionId(), request.code(), id);

        DeviceFunction function = deviceFunctionService.getFunctionById(request.deviceFunctionId());
        deviceFunctionActionMapper.updateEntity(action, request, function);
        action = deviceFunctionActionRepository.save(action);

        log.info("Действие функции обновлено: {}", id);
        return deviceFunctionActionMapper.toResponse(action, localeService.getCurrentLocale());
    }

    /**
     * Удалить действие функции (мягкое удаление).
     */
    @Transactional
    public void delete(Long id) {
        log.info("Удаление действия функции с ID: {}", id);

        DeviceFunctionAction action = getActionById(id);
        action.setActive(false);
        deviceFunctionActionRepository.save(action);

        log.info("Действие функции деактивировано: {}", id);
    }

    /**
     * Выполнить действие (заглушка для будущей интеграции с IoT).
     */
    @Transactional
    public DeviceFunctionActionResponse execute(Long id) {
        log.info("Выполнение действия функции с ID: {}", id);

        DeviceFunctionAction action = getActionById(id);

        // TODO: Интеграция с IoT брокером / протоколами устройств
        // Здесь будет логика отправки команды на устройство
        log.info("Действие {} выполнено для функции {}", action.getCode(),
                action.getDeviceFunction().getCode());

        return deviceFunctionActionMapper.toResponse(action, localeService.getCurrentLocale());
    }

    /**
     * Получить Entity действия по ID.
     */
    public DeviceFunctionAction getActionById(Long id) {
        return deviceFunctionActionRepository.findByIdWithTranslations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Действие функции", "id", id));
    }

    /**
     * Проверка уникальности кода в рамках функции.
     */
    private void validateCodeUniqueness(Long functionId, String code, Long excludeId) {
        deviceFunctionActionRepository.findByDeviceFunctionIdAndCode(functionId, code).ifPresent(existing -> {
            if (excludeId == null || !existing.getId().equals(excludeId)) {
                throw new DuplicateResourceException("Действие функции", "code", code);
            }
        });
    }
}

