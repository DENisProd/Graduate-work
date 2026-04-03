package ru.denis.smarthome.device.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.denis.smarthome.device.model.DeviceFunction;
import ru.denis.smarthome.device.model.DeviceFunctionType;

import java.util.List;
import java.util.Optional;

/**
 * Репозиторий для работы с функциями устройств.
 */
@Repository
public interface DeviceFunctionRepository extends JpaRepository<DeviceFunction, Long> {

    /**
     * Найти функцию по коду и устройству.
     */
    Optional<DeviceFunction> findByDeviceIdAndCode(Long deviceId, String code);

    /**
     * Проверить существование функции по коду и устройству.
     */
    boolean existsByDeviceIdAndCode(Long deviceId, String code);

    /**
     * Найти все активные функции устройства.
     */
    List<DeviceFunction> findByDeviceIdAndActiveTrue(Long deviceId);

    /**
     * Найти функции по типу.
     */
    List<DeviceFunction> findByDeviceIdAndFunctionTypeAndActiveTrue(Long deviceId, DeviceFunctionType functionType);

    /**
     * Найти функцию по ID с переводами.
     */
    @Query("SELECT df FROM DeviceFunction df " +
            "LEFT JOIN FETCH df.translations " +
            "LEFT JOIN FETCH df.device d " +
            "LEFT JOIN FETCH d.translations " +
            "WHERE df.id = :id")
    Optional<DeviceFunction> findByIdWithTranslations(@Param("id") Long id);

    /**
     * Найти функцию по ID с действиями.
     */
    @Query("SELECT df FROM DeviceFunction df " +
            "LEFT JOIN FETCH df.translations " +
            "LEFT JOIN FETCH df.actions a " +
            "LEFT JOIN FETCH a.translations " +
            "WHERE df.id = :id")
    Optional<DeviceFunction> findByIdWithActions(@Param("id") Long id);

    /**
     * Найти все функции устройства с переводами.
     */
    @Query("SELECT DISTINCT df FROM DeviceFunction df " +
            "LEFT JOIN FETCH df.translations " +
            "WHERE df.device.id = :deviceId AND df.active = true")
    List<DeviceFunction> findByDeviceIdWithTranslations(@Param("deviceId") Long deviceId);

    /**
     * Найти все функции устройства с переводами (пагинация).
     */
    @Query(value = "SELECT DISTINCT df FROM DeviceFunction df " +
            "LEFT JOIN FETCH df.translations " +
            "WHERE df.device.id = :deviceId AND df.active = true",
            countQuery = "SELECT COUNT(df) FROM DeviceFunction df WHERE df.device.id = :deviceId AND df.active = true")
    Page<DeviceFunction> findByDeviceIdWithTranslations(@Param("deviceId") Long deviceId, Pageable pageable);

    /**
     * Найти функции для записи (управления).
     */
    @Query("SELECT df FROM DeviceFunction df " +
            "LEFT JOIN FETCH df.translations " +
            "WHERE df.device.id = :deviceId " +
            "AND (df.functionType = 'WRITE' OR df.functionType = 'READ_WRITE') " +
            "AND df.active = true")
    List<DeviceFunction> findWritableFunctionsByDeviceId(@Param("deviceId") Long deviceId);
}

