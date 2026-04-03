package ru.denis.smarthome.device.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.denis.smarthome.device.model.DeviceCategory;

import java.util.List;
import java.util.Optional;

/**
 * Репозиторий для работы с категориями устройств.
 */
@Repository
public interface DeviceCategoryRepository extends JpaRepository<DeviceCategory, Long> {

    /**
     * Найти категорию по коду.
     */
    Optional<DeviceCategory> findByCode(String code);

    /**
     * Проверить существование категории по коду.
     */
    boolean existsByCode(String code);

    /**
     * Найти все активные категории.
     */
    List<DeviceCategory> findByActiveTrue();

    /**
     * Найти категории по типу устройства.
     */
    List<DeviceCategory> findByDeviceTypeIdAndActiveTrue(Long deviceTypeId);

    /**
     * Найти категорию по ID с переводами.
     */
    @Query("SELECT dc FROM DeviceCategory dc " +
            "LEFT JOIN FETCH dc.translations " +
            "LEFT JOIN FETCH dc.deviceType dt " +
            "LEFT JOIN FETCH dt.translations " +
            "WHERE dc.id = :id")
    Optional<DeviceCategory> findByIdWithTranslations(@Param("id") Long id);

    /**
     * Найти все активные категории с переводами.
     */
    @Query("SELECT DISTINCT dc FROM DeviceCategory dc " +
            "LEFT JOIN FETCH dc.translations " +
            "LEFT JOIN FETCH dc.deviceType dt " +
            "LEFT JOIN FETCH dt.translations " +
            "WHERE dc.active = true")
    List<DeviceCategory> findAllActiveWithTranslations();

    /**
     * Найти все активные категории с переводами (пагинация).
     */
    @Query(value = "SELECT DISTINCT dc FROM DeviceCategory dc " +
            "LEFT JOIN FETCH dc.translations " +
            "LEFT JOIN FETCH dc.deviceType dt " +
            "LEFT JOIN FETCH dt.translations " +
            "WHERE dc.active = true",
            countQuery = "SELECT COUNT(dc) FROM DeviceCategory dc WHERE dc.active = true")
    Page<DeviceCategory> findAllActiveWithTranslations(Pageable pageable);

    /**
     * Найти категории по типу устройства с переводами.
     */
    @Query("SELECT DISTINCT dc FROM DeviceCategory dc " +
            "LEFT JOIN FETCH dc.translations " +
            "LEFT JOIN FETCH dc.deviceType dt " +
            "LEFT JOIN FETCH dt.translations " +
            "WHERE dt.id = :deviceTypeId AND dc.active = true")
    List<DeviceCategory> findByDeviceTypeIdWithTranslations(@Param("deviceTypeId") Long deviceTypeId);
}

