package ru.denis.smarthome.device.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.denis.smarthome.device.model.Device;
import ru.denis.smarthome.device.model.DeviceStatus;

import java.util.List;
import java.util.Optional;

/**
 * Репозиторий для работы с устройствами.
 */
@Repository
public interface DeviceRepository extends JpaRepository<Device, Long> {

    /**
     * Найти устройство по коду.
     */
    Optional<Device> findByCode(String code);

    /**
     * Проверить существование устройства по коду.
     */
    boolean existsByCode(String code);

    /**
     * Найти все активные устройства.
     */
    List<Device> findByActiveTrue();

    /**
     * Найти устройства по категории.
     */
    List<Device> findByDeviceCategoryIdAndActiveTrue(Long categoryId);

    /**
     * Найти устройства по категории с переводами (пагинация).
     */
    @Query(value = "SELECT DISTINCT d FROM Device d " +
            "LEFT JOIN FETCH d.translations " +
            "LEFT JOIN FETCH d.deviceCategory dc " +
            "LEFT JOIN FETCH dc.translations " +
            "WHERE dc.id = :categoryId AND d.active = true",
            countQuery = "SELECT COUNT(d) FROM Device d WHERE d.deviceCategory.id = :categoryId AND d.active = true")
    Page<Device> findByCategoryIdWithTranslations(@Param("categoryId") Long categoryId, Pageable pageable);

    /**
     * Найти устройства по статусу.
     */
    List<Device> findByStatusAndActiveTrue(DeviceStatus status);

    /**
     * Найти устройство по ID с переводами.
     */
    @Query("SELECT d FROM Device d " +
            "LEFT JOIN FETCH d.translations " +
            "LEFT JOIN FETCH d.deviceCategory dc " +
            "LEFT JOIN FETCH dc.translations " +
            "LEFT JOIN FETCH dc.deviceType dt " +
            "LEFT JOIN FETCH dt.translations " +
            "WHERE d.id = :id")
    Optional<Device> findByIdWithTranslations(@Param("id") Long id);

    /**
     * Найти устройство по ID с функциями.
     */
    @Query("SELECT d FROM Device d " +
            "LEFT JOIN FETCH d.translations " +
            "LEFT JOIN FETCH d.functions f " +
            "LEFT JOIN FETCH f.translations " +
            "WHERE d.id = :id")
    Optional<Device> findByIdWithFunctions(@Param("id") Long id);

    /**
     * Найти все активные устройства с переводами (пагинация).
     */
    @Query(value = "SELECT DISTINCT d FROM Device d " +
            "LEFT JOIN FETCH d.translations " +
            "LEFT JOIN FETCH d.deviceCategory dc " +
            "LEFT JOIN FETCH dc.translations " +
            "WHERE d.active = true",
            countQuery = "SELECT COUNT(d) FROM Device d WHERE d.active = true")
    Page<Device> findAllActiveWithTranslations(Pageable pageable);
}

