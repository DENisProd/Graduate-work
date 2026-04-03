package ru.denis.smarthome.device.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.denis.smarthome.device.dto.request.DeviceCategoryRequest;
import ru.denis.smarthome.device.dto.response.DeviceCategoryResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.exception.DuplicateResourceException;
import ru.denis.smarthome.device.exception.ResourceNotFoundException;
import ru.denis.smarthome.device.mapper.DeviceCategoryMapper;
import ru.denis.smarthome.device.model.DeviceCategory;
import ru.denis.smarthome.device.model.DeviceType;
import ru.denis.smarthome.device.repository.DeviceCategoryRepository;

import java.util.List;

/**
 * Сервис для работы с категориями устройств.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeviceCategoryService {

    private final DeviceCategoryRepository deviceCategoryRepository;
    private final DeviceCategoryMapper deviceCategoryMapper;
    private final DeviceTypeService deviceTypeService;
    private final LocaleService localeService;

    /**
     * Получить все активные категории устройств (без пагинации).
     */
    public List<DeviceCategoryResponse> findAll() {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение всех категорий устройств, локаль: {}", locale);

        List<DeviceCategory> categories = deviceCategoryRepository.findAllActiveWithTranslations();
        return deviceCategoryMapper.toResponseList(categories, locale);
    }

    /**
     * Получить все активные категории устройств с пагинацией.
     */
    public PageResponse<DeviceCategoryResponse> findAll(Pageable pageable) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение категорий устройств, страница: {}, локаль: {}", pageable.getPageNumber(), locale);

        Page<DeviceCategory> categoryPage = deviceCategoryRepository.findAllActiveWithTranslations(pageable);
        return deviceCategoryMapper.toPageResponse(categoryPage, locale);
    }

    /**
     * Получить категории по типу устройства.
     */
    public List<DeviceCategoryResponse> findByDeviceTypeId(Long deviceTypeId) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение категорий по типу устройства: {}, локаль: {}", deviceTypeId, locale);

        List<DeviceCategory> categories = deviceCategoryRepository
                .findByDeviceTypeIdWithTranslations(deviceTypeId);
        return deviceCategoryMapper.toResponseList(categories, locale);
    }

    /**
     * Получить категории по типу устройства со всеми переводами (для админки).
     */
    public List<DeviceCategoryResponse> findByDeviceTypeIdFull(Long deviceTypeId) {
        log.debug("Получение категорий по типу устройства {} со всеми переводами", deviceTypeId);

        List<DeviceCategory> categories = deviceCategoryRepository
                .findByDeviceTypeIdWithTranslations(deviceTypeId);
        return deviceCategoryMapper.toFullResponseList(categories);
    }

    /**
     * Получить категорию по ID.
     */
    public DeviceCategoryResponse findById(Long id) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение категории устройства по ID: {}, локаль: {}", id, locale);

        DeviceCategory category = getCategoryById(id);
        return deviceCategoryMapper.toResponse(category, locale);
    }

    /**
     * Получить категорию по ID с полными переводами (для админки).
     */
    public DeviceCategoryResponse findByIdFull(Long id) {
        log.debug("Получение полной категории устройства по ID: {}", id);

        DeviceCategory category = getCategoryById(id);
        return deviceCategoryMapper.toFullResponse(category);
    }

    /**
     * Получить все категории со всеми переводами (для админки).
     */
    public List<DeviceCategoryResponse> findAllFull() {
        log.debug("Получение всех категорий устройств со всеми переводами");

        List<DeviceCategory> categories = deviceCategoryRepository.findAllActiveWithTranslations();
        return deviceCategoryMapper.toFullResponseList(categories);
    }

    /**
     * Получить все категории со всеми переводами с пагинацией (для админки).
     */
    public PageResponse<DeviceCategoryResponse> findAllFull(Pageable pageable) {
        log.debug("Получение категорий устройств со всеми переводами, страница: {}", pageable.getPageNumber());

        Page<DeviceCategory> categoryPage = deviceCategoryRepository.findAllActiveWithTranslations(pageable);
        return deviceCategoryMapper.toFullPageResponse(categoryPage);
    }

    /**
     * Получить категорию по коду.
     */
    public DeviceCategoryResponse findByCode(String code) {
        String locale = localeService.getCurrentLocale();
        log.debug("Получение категории устройства по коду: {}, локаль: {}", code, locale);

        DeviceCategory category = deviceCategoryRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Категория устройства", "code", code));
        return deviceCategoryMapper.toResponse(category, locale);
    }

    /**
     * Получить категорию по коду со всеми переводами (для админки).
     */
    public DeviceCategoryResponse findByCodeFull(String code) {
        log.debug("Получение категории устройства по коду {} со всеми переводами", code);

        DeviceCategory category = deviceCategoryRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Категория устройства", "code", code));
        return deviceCategoryMapper.toFullResponse(getCategoryById(category.getId()));
    }

    /**
     * Создать новую категорию устройства.
     */
    @Transactional
    public DeviceCategoryResponse create(DeviceCategoryRequest request) {
        log.info("Создание новой категории устройства: {}", request.code());

        validateCodeUniqueness(request.code(), null);

        DeviceType deviceType = deviceTypeService.getDeviceTypeById(request.deviceTypeId());
        DeviceCategory category = deviceCategoryMapper.toEntity(request, deviceType);
        category = deviceCategoryRepository.save(category);

        log.info("Категория устройства создана с ID: {}", category.getId());
        return deviceCategoryMapper.toResponse(category, localeService.getCurrentLocale());
    }

    /**
     * Обновить категорию устройства.
     */
    @Transactional
    public DeviceCategoryResponse update(Long id, DeviceCategoryRequest request) {
        log.info("Обновление категории устройства с ID: {}", id);

        DeviceCategory category = getCategoryById(id);
        validateCodeUniqueness(request.code(), id);

        DeviceType deviceType = deviceTypeService.getDeviceTypeById(request.deviceTypeId());
        deviceCategoryMapper.updateEntity(category, request, deviceType);
        category = deviceCategoryRepository.save(category);

        log.info("Категория устройства обновлена: {}", id);
        return deviceCategoryMapper.toResponse(category, localeService.getCurrentLocale());
    }

    /**
     * Удалить категорию устройства (мягкое удаление).
     */
    @Transactional
    public void delete(Long id) {
        log.info("Удаление категории устройства с ID: {}", id);

        DeviceCategory category = getCategoryById(id);
        category.setActive(false);
        deviceCategoryRepository.save(category);

        log.info("Категория устройства деактивирована: {}", id);
    }

    /**
     * Получить Entity категории по ID.
     */
    public DeviceCategory getCategoryById(Long id) {
        return deviceCategoryRepository.findByIdWithTranslations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Категория устройства", "id", id));
    }

    /**
     * Проверка уникальности кода.
     */
    private void validateCodeUniqueness(String code, Long excludeId) {
        deviceCategoryRepository.findByCode(code).ifPresent(existing -> {
            if (excludeId == null || !existing.getId().equals(excludeId)) {
                throw new DuplicateResourceException("Категория устройства", "code", code);
            }
        });
    }
}

