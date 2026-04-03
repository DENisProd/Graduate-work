package ru.denis.smarthome.device.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.denis.smarthome.device.dto.request.DeviceFunctionRequest;
import ru.denis.smarthome.device.dto.response.DeviceFunctionResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.exception.DuplicateResourceException;
import ru.denis.smarthome.device.exception.ResourceNotFoundException;
import ru.denis.smarthome.device.mapper.DeviceFunctionMapper;
import ru.denis.smarthome.device.model.Device;
import ru.denis.smarthome.device.model.DeviceFunction;
import ru.denis.smarthome.device.repository.DeviceFunctionRepository;

import java.util.List;

/**
 * Сервис для работы с функциями устройств.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeviceFunctionService {

    private final DeviceFunctionRepository deviceFunctionRepository;
    private final DeviceFunctionMapper deviceFunctionMapper;
    private final DeviceService deviceService;
    private final LocaleService localeService;

    /**
     * Получить все функции устройства (без пагинации).
     */
    public List<DeviceFunctionResponse> findByDeviceId(Long deviceId) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение функций устройства: {}, локаль: {}", deviceId, locale);

        List<DeviceFunction> functions = deviceFunctionRepository.findByDeviceIdWithTranslations(deviceId);
        return deviceFunctionMapper.toResponseList(functions, locale);
    }

    /**
     * Получить все функции устройства с пагинацией.
     */
    public PageResponse<DeviceFunctionResponse> findByDeviceId(Long deviceId, Pageable pageable) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение функций устройства: {}, страница: {}, локаль: {}", deviceId, pageable.getPageNumber(), locale);

        Page<DeviceFunction> functionPage = deviceFunctionRepository.findByDeviceIdWithTranslations(deviceId, pageable);
        return deviceFunctionMapper.toPageResponse(functionPage, locale);
    }

    /**
     * Получить функции для записи (управления) устройства.
     */
    public List<DeviceFunctionResponse> findWritableFunctions(Long deviceId) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение управляемых функций устройства: {}, локаль: {}", deviceId, locale);

        List<DeviceFunction> functions = deviceFunctionRepository.findWritableFunctionsByDeviceId(deviceId);
        return deviceFunctionMapper.toResponseList(functions, locale);
    }

    /**
     * Получить функцию по ID.
     */
    public DeviceFunctionResponse findById(Long id) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение функции устройства по ID: {}, локаль: {}", id, locale);

        DeviceFunction function = getFunctionById(id);
        return deviceFunctionMapper.toResponse(function, locale);
    }

    /**
     * Получить функцию по ID с действиями.
     */
    public DeviceFunctionResponse findByIdDetailed(Long id) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение детальной функции устройства по ID: {}, локаль: {}", id, locale);

        DeviceFunction function = deviceFunctionRepository.findByIdWithActions(id)
                .orElseThrow(() -> new ResourceNotFoundException("Функция устройства", "id", id));
        return deviceFunctionMapper.toDetailedResponse(function, locale);
    }

    /**
     * Получить функцию по ID с полными переводами (для админки).
     */
    public DeviceFunctionResponse findByIdFull(Long id) {
        log.debug("Получение полной функции устройства по ID: {}", id);

        DeviceFunction function = getFunctionById(id);
        return deviceFunctionMapper.toFullResponse(function);
    }

    /**
     * Получить все функции устройства со всеми переводами (для админки).
     */
    public List<DeviceFunctionResponse> findByDeviceIdFull(Long deviceId) {
        log.debug("Получение функций устройства {} со всеми переводами", deviceId);

        List<DeviceFunction> functions = deviceFunctionRepository.findByDeviceIdWithTranslations(deviceId);
        return deviceFunctionMapper.toFullResponseList(functions);
    }

    /**
     * Получить все функции устройства со всеми переводами с пагинацией (для админки).
     */
    public PageResponse<DeviceFunctionResponse> findByDeviceIdFull(Long deviceId, Pageable pageable) {
        log.debug("Получение функций устройства {} со всеми переводами, страница: {}", deviceId, pageable.getPageNumber());

        Page<DeviceFunction> functionPage = deviceFunctionRepository.findByDeviceIdWithTranslations(deviceId, pageable);
        return deviceFunctionMapper.toFullPageResponse(functionPage);
    }

    /**
     * Создать новую функцию устройства.
     */
    @Transactional
    public DeviceFunctionResponse create(DeviceFunctionRequest request) {
        log.info("Создание новой функции устройства: {} для устройства: {}", request.code(), request.deviceId());

        validateCodeUniqueness(request.deviceId(), request.code(), null);

        Device device = deviceService.getDeviceById(request.deviceId());
        DeviceFunction function = deviceFunctionMapper.toEntity(request, device);
        function = deviceFunctionRepository.save(function);

        log.info("Функция устройства создана с ID: {}", function.getId());
        return deviceFunctionMapper.toResponse(function, localeService.getCurrentLocale());
    }

    /**
     * Обновить функцию устройства.
     */
    @Transactional
    public DeviceFunctionResponse update(Long id, DeviceFunctionRequest request) {
        log.info("Обновление функции устройства с ID: {}", id);

        DeviceFunction function = getFunctionById(id);
        validateCodeUniqueness(request.deviceId(), request.code(), id);

        Device device = deviceService.getDeviceById(request.deviceId());
        deviceFunctionMapper.updateEntity(function, request, device);
        function = deviceFunctionRepository.save(function);

        log.info("Функция устройства обновлена: {}", id);
        return deviceFunctionMapper.toResponse(function, localeService.getCurrentLocale());
    }

    /**
     * Обновить текущее значение функции.
     */
    @Transactional
    public DeviceFunctionResponse updateValue(Long id, String value) {
        log.info("Обновление значения функции {} на {}", id, value);

        DeviceFunction function = getFunctionById(id);
        function.setCurrentValue(value);
        function = deviceFunctionRepository.save(function);

        log.info("Значение функции обновлено: {} -> {}", id, value);
        return deviceFunctionMapper.toResponse(function, localeService.getCurrentLocale());
    }

    /**
     * Удалить функцию устройства (мягкое удаление).
     */
    @Transactional
    public void delete(Long id) {
        log.info("Удаление функции устройства с ID: {}", id);

        DeviceFunction function = getFunctionById(id);
        function.setActive(false);
        deviceFunctionRepository.save(function);

        log.info("Функция устройства деактивирована: {}", id);
    }

    /**
     * Получить Entity функции по ID.
     */
    public DeviceFunction getFunctionById(Long id) {
        return deviceFunctionRepository.findByIdWithTranslations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Функция устройства", "id", id));
    }

    /**
     * Проверка уникальности кода в рамках устройства.
     */
    private void validateCodeUniqueness(Long deviceId, String code, Long excludeId) {
        deviceFunctionRepository.findByDeviceIdAndCode(deviceId, code).ifPresent(existing -> {
            if (excludeId == null || !existing.getId().equals(excludeId)) {
                throw new DuplicateResourceException("Функция устройства", "code", code);
            }
        });
    }
}

