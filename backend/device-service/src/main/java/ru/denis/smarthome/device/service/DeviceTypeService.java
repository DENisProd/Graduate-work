package ru.denis.smarthome.device.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.denis.smarthome.device.dto.request.DeviceTypeRequest;
import ru.denis.smarthome.device.dto.response.DeviceTypeResponse;
import ru.denis.smarthome.device.exception.DuplicateResourceException;
import ru.denis.smarthome.device.exception.ResourceNotFoundException;
import ru.denis.smarthome.device.mapper.DeviceTypeMapper;
import ru.denis.smarthome.device.model.DeviceType;
import ru.denis.smarthome.device.repository.DeviceTypeRepository;

import java.util.List;

/**
 * Сервис для работы с типами устройств.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeviceTypeService {

    private final DeviceTypeRepository deviceTypeRepository;
    private final DeviceTypeMapper deviceTypeMapper;
    private final LocaleService localeService;

    /**
     * Получить все активные типы устройств.
     */
    public List<DeviceTypeResponse> findAll() {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение всех типов устройств, локаль: {}", locale);

        List<DeviceType> deviceTypes = deviceTypeRepository.findAllActiveWithTranslations();
        return deviceTypeMapper.toResponseList(deviceTypes, locale);
    }

    /**
     * Получить тип устройства по ID.
     */
    public DeviceTypeResponse findById(Long id) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение типа устройства по ID: {}, локаль: {}", id, locale);

        DeviceType deviceType = getDeviceTypeById(id);
        return deviceTypeMapper.toResponse(deviceType, locale);
    }

    /**
     * Получить тип устройства по ID с полными переводами (для админки).
     */
    public DeviceTypeResponse findByIdFull(Long id) {
        log.debug("Получение полного типа устройства по ID: {}", id);

        DeviceType deviceType = getDeviceTypeById(id);
        return deviceTypeMapper.toFullResponse(deviceType);
    }

    /**
     * Получить все типы устройств со всеми переводами (для админки).
     */
    public List<DeviceTypeResponse> findAllFull() {
        log.debug("Получение всех типов устройств со всеми переводами");

        List<DeviceType> deviceTypes = deviceTypeRepository.findAllActiveWithTranslations();
        return deviceTypeMapper.toFullResponseList(deviceTypes);
    }

    /**
     * Получить тип устройства по коду.
     */
    public DeviceTypeResponse findByCode(String code) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение типа устройства по коду: {}, локаль: {}", code, locale);

        DeviceType deviceType = deviceTypeRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Тип устройства", "code", code));
        return deviceTypeMapper.toResponse(deviceType, locale);
    }

    /**
     * Получить тип устройства по коду со всеми переводами (для админки).
     */
    public DeviceTypeResponse findByCodeFull(String code) {
        log.debug("Получение типа устройства по коду {} со всеми переводами", code);

        DeviceType deviceType = deviceTypeRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Тип устройства", "code", code));
        return deviceTypeMapper.toFullResponse(getDeviceTypeById(deviceType.getId()));
    }

    /**
     * Создать новый тип устройства.
     */
    @Transactional
    public DeviceTypeResponse create(DeviceTypeRequest request) {
        log.info("Создание нового типа устройства: {}", request.code());

        validateCodeUniqueness(request.code(), null);

        DeviceType deviceType = deviceTypeMapper.toEntity(request);
        deviceType = deviceTypeRepository.save(deviceType);

        log.info("Тип устройства создан с ID: {}", deviceType.getId());
        return deviceTypeMapper.toResponse(deviceType, localeService.getCurrentLocale());
    }

    /**
     * Обновить тип устройства.
     */
    @Transactional
    public DeviceTypeResponse update(Long id, DeviceTypeRequest request) {
        log.info("Обновление типа устройства с ID: {}", id);

        DeviceType deviceType = getDeviceTypeById(id);
        validateCodeUniqueness(request.code(), id);

        deviceTypeMapper.updateEntity(deviceType, request);
        deviceType = deviceTypeRepository.save(deviceType);

        log.info("Тип устройства обновлен: {}", id);
        return deviceTypeMapper.toResponse(deviceType, localeService.getCurrentLocale());
    }

    /**
     * Удалить тип устройства (мягкое удаление).
     */
    @Transactional
    public void delete(Long id) {
        log.info("Удаление типа устройства с ID: {}", id);

        DeviceType deviceType = getDeviceTypeById(id);
        deviceType.setActive(false);
        deviceTypeRepository.save(deviceType);

        log.info("Тип устройства деактивирован: {}", id);
    }

    /**
     * Получить Entity типа устройства по ID.
     */
    public DeviceType getDeviceTypeById(Long id) {
        return deviceTypeRepository.findByIdWithTranslations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Тип устройства", "id", id));
    }

    /**
     * Проверка уникальности кода.
     */
    private void validateCodeUniqueness(String code, Long excludeId) {
        deviceTypeRepository.findByCode(code).ifPresent(existing -> {
            if (excludeId == null || !existing.getId().equals(excludeId)) {
                throw new DuplicateResourceException("Тип устройства", "code", code);
            }
        });
    }
}



