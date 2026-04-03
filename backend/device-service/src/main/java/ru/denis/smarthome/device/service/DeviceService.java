package ru.denis.smarthome.device.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.denis.smarthome.device.dto.request.DeviceRequest;
import ru.denis.smarthome.device.dto.response.DeviceResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.exception.DuplicateResourceException;
import ru.denis.smarthome.device.exception.ResourceNotFoundException;
import ru.denis.smarthome.device.mapper.DeviceMapper;
import ru.denis.smarthome.device.model.Device;
import ru.denis.smarthome.device.model.DeviceCategory;
import ru.denis.smarthome.device.model.DeviceStatus;
import ru.denis.smarthome.device.repository.DeviceRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Сервис для работы с устройствами.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final DeviceMapper deviceMapper;
    private final DeviceCategoryService deviceCategoryService;
    private final LocaleService localeService;

    /**
     * Получить все активные устройства с пагинацией.
     */
    public PageResponse<DeviceResponse> findAll(Pageable pageable) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение всех устройств, страница: {}, локаль: {}", pageable.getPageNumber(), locale);

        Page<Device> devicePage = deviceRepository.findAllActiveWithTranslations(pageable);
        return deviceMapper.toPageResponse(devicePage, locale);
    }

    /**
     * Получить устройства по категории (без пагинации).
     */
    public List<DeviceResponse> findByCategoryId(Long categoryId) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение устройств по категории: {}, локаль: {}", categoryId, locale);

        List<Device> devices = deviceRepository.findByDeviceCategoryIdAndActiveTrue(categoryId);
        return deviceMapper.toResponseList(devices, locale);
    }

    /**
     * Получить устройства по категории с пагинацией.
     */
    public PageResponse<DeviceResponse> findByCategoryId(Long categoryId, Pageable pageable) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение устройств по категории: {}, страница: {}, локаль: {}", categoryId, pageable.getPageNumber(), locale);

        Page<Device> devicePage = deviceRepository.findByCategoryIdWithTranslations(categoryId, pageable);
        return deviceMapper.toPageResponse(devicePage, locale);
    }

    /**
     * Получить устройство по ID.
     */
    public DeviceResponse findById(Long id) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение устройства по ID: {}, локаль: {}", id, locale);

        Device device = getDeviceById(id);
        return deviceMapper.toResponse(device, locale);
    }

    /**
     * Получить устройство по ID с функциями.
     */
    public DeviceResponse findByIdDetailed(Long id) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение детального устройства по ID: {}, локаль: {}", id, locale);

        Device device = deviceRepository.findByIdWithFunctions(id)
                .orElseThrow(() -> new ResourceNotFoundException("Устройство", "id", id));
        return deviceMapper.toDetailedResponse(device, locale);
    }

    /**
     * Получить устройство по ID с полными переводами (для админки).
     */
    public DeviceResponse findByIdFull(Long id) {
        log.debug("Получение полного устройства по ID: {}", id);

        Device device = getDeviceById(id);
        return deviceMapper.toFullResponse(device);
    }

    /**
     * Получить все устройства со всеми переводами с пагинацией (для админки).
     */
    public PageResponse<DeviceResponse> findAllFull(Pageable pageable) {
        log.debug("Получение устройств со всеми переводами, страница: {}", pageable.getPageNumber());

        Page<Device> devicePage = deviceRepository.findAllActiveWithTranslations(pageable);
        return deviceMapper.toFullPageResponse(devicePage);
    }

    /**
     * Получить все устройства по категории со всеми переводами с пагинацией (для админки).
     */
    public PageResponse<DeviceResponse> findByCategoryIdFull(Long categoryId, Pageable pageable) {
        log.debug("Получение устройств по категории {} со всеми переводами", categoryId);

        Page<Device> devicePage = deviceRepository.findByCategoryIdWithTranslations(categoryId, pageable);
        return deviceMapper.toFullPageResponse(devicePage);
    }

    /**
     * Получить устройство по коду.
     */
    public DeviceResponse findByCode(String code) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение устройства по коду: {}, локаль: {}", code, locale);

        Device device = deviceRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Устройство", "code", code));
        return deviceMapper.toResponse(device, locale);
    }

    /**
     * Получить устройство по коду со всеми переводами (для админки).
     */
    public DeviceResponse findByCodeFull(String code) {
        log.debug("Получение устройства по коду {} со всеми переводами", code);

        Device device = deviceRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Устройство", "code", code));
        return deviceMapper.toFullResponse(getDeviceById(device.getId()));
    }

    /**
     * Создать новое устройство.
     */
    @Transactional
    public DeviceResponse create(DeviceRequest request) {
        log.info("Создание нового устройства: {}", request.code());

        validateCodeUniqueness(request.code(), null);

        DeviceCategory category = deviceCategoryService.getCategoryById(request.deviceCategoryId());
        Device device = deviceMapper.toEntity(request, category);
        device = deviceRepository.save(device);

        log.info("Устройство создано с ID: {}", device.getId());
        return deviceMapper.toResponse(device, localeService.getCurrentLocale());
    }

    /**
     * Обновить устройство.
     */
    @Transactional
    public DeviceResponse update(Long id, DeviceRequest request) {
        log.info("Обновление устройства с ID: {}", id);

        Device device = getDeviceById(id);
        validateCodeUniqueness(request.code(), id);

        DeviceCategory category = deviceCategoryService.getCategoryById(request.deviceCategoryId());
        deviceMapper.updateEntity(device, request, category);
        device = deviceRepository.save(device);

        log.info("Устройство обновлено: {}", id);
        return deviceMapper.toResponse(device, localeService.getCurrentLocale());
    }

    /**
     * Обновить статус устройства.
     */
    @Transactional
    public DeviceResponse updateStatus(Long id, DeviceStatus status) {
        log.info("Обновление статуса устройства {} на {}", id, status);

        Device device = getDeviceById(id);
        device.setStatus(status);

        if (status == DeviceStatus.ONLINE) {
            device.setLastSeenAt(LocalDateTime.now());
        }

        device = deviceRepository.save(device);

        log.info("Статус устройства обновлен: {} -> {}", id, status);
        return deviceMapper.toResponse(device, localeService.getCurrentLocale());
    }

    /**
     * Удалить устройство (мягкое удаление).
     */
    @Transactional
    public void delete(Long id) {
        log.info("Удаление устройства с ID: {}", id);

        Device device = getDeviceById(id);
        device.setActive(false);
        deviceRepository.save(device);

        log.info("Устройство деактивировано: {}", id);
    }

    /**
     * Получить Entity устройства по ID.
     */
    public Device getDeviceById(Long id) {
        return deviceRepository.findByIdWithTranslations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Устройство", "id", id));
    }

    /**
     * Проверка уникальности кода.
     */
    private void validateCodeUniqueness(String code, Long excludeId) {
        deviceRepository.findByCode(code).ifPresent(existing -> {
            if (excludeId == null || !existing.getId().equals(excludeId)) {
                throw new DuplicateResourceException("Устройство", "code", code);
            }
        });
    }
}

