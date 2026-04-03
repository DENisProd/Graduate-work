package ru.denis.smarthome.device.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.denis.smarthome.device.model.ActionType;
import ru.denis.smarthome.device.model.DeviceFunctionAction;

import java.util.List;
import java.util.Optional;

/**
 * Репозиторий для работы с действиями функций устройств.
 */
@Repository
public interface DeviceFunctionActionRepository extends JpaRepository<DeviceFunctionAction, Long> {

    /**
     * Найти действие по коду и функции.
     */
    Optional<DeviceFunctionAction> findByDeviceFunctionIdAndCode(Long functionId, String code);

    /**
     * Проверить существование действия по коду и функции.
     */
    boolean existsByDeviceFunctionIdAndCode(Long functionId, String code);

    /**
     * Найти все активные действия функции.
     */
    List<DeviceFunctionAction> findByDeviceFunctionIdAndActiveTrue(Long functionId);

    /**
     * Найти действия по типу.
     */
    List<DeviceFunctionAction> findByDeviceFunctionIdAndActionTypeAndActiveTrue(Long functionId, ActionType actionType);

    /**
     * Найти действие по ID с переводами.
     */
    @Query("SELECT dfa FROM DeviceFunctionAction dfa " +
            "LEFT JOIN FETCH dfa.translations " +
            "LEFT JOIN FETCH dfa.deviceFunction df " +
            "LEFT JOIN FETCH df.translations " +
            "WHERE dfa.id = :id")
    Optional<DeviceFunctionAction> findByIdWithTranslations(@Param("id") Long id);

    /**
     * Найти все действия функции с переводами.
     */
    @Query("SELECT DISTINCT dfa FROM DeviceFunctionAction dfa " +
            "LEFT JOIN FETCH dfa.translations " +
            "WHERE dfa.deviceFunction.id = :functionId AND dfa.active = true")
    List<DeviceFunctionAction> findByFunctionIdWithTranslations(@Param("functionId") Long functionId);

    /**
     * Найти все действия функции с переводами (пагинация).
     */
    @Query(value = "SELECT DISTINCT dfa FROM DeviceFunctionAction dfa " +
            "LEFT JOIN FETCH dfa.translations " +
            "WHERE dfa.deviceFunction.id = :functionId AND dfa.active = true",
            countQuery = "SELECT COUNT(dfa) FROM DeviceFunctionAction dfa WHERE dfa.deviceFunction.id = :functionId AND dfa.active = true")
    Page<DeviceFunctionAction> findByFunctionIdWithTranslations(@Param("functionId") Long functionId, Pageable pageable);

    /**
     * Найти все действия устройства (через функции).
     */
    @Query("SELECT DISTINCT dfa FROM DeviceFunctionAction dfa " +
            "LEFT JOIN FETCH dfa.translations " +
            "JOIN dfa.deviceFunction df " +
            "WHERE df.device.id = :deviceId AND dfa.active = true AND df.active = true")
    List<DeviceFunctionAction> findByDeviceIdWithTranslations(@Param("deviceId") Long deviceId);

    /**
     * Найти все действия устройства с пагинацией.
     */
    @Query(value = "SELECT DISTINCT dfa FROM DeviceFunctionAction dfa " +
            "LEFT JOIN FETCH dfa.translations " +
            "JOIN dfa.deviceFunction df " +
            "WHERE df.device.id = :deviceId AND dfa.active = true AND df.active = true",
            countQuery = "SELECT COUNT(dfa) FROM DeviceFunctionAction dfa JOIN dfa.deviceFunction df WHERE df.device.id = :deviceId AND dfa.active = true AND df.active = true")
    Page<DeviceFunctionAction> findByDeviceIdWithTranslations(@Param("deviceId") Long deviceId, Pageable pageable);
}

