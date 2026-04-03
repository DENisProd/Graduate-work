package ru.denis.smarthome.device.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.denis.smarthome.device.model.DeviceType;

import java.util.List;
import java.util.Optional;

/**
 * Репозиторий для работы с типами устройств.
 */
@Repository
public interface DeviceTypeRepository extends JpaRepository<DeviceType, Long> {

    /**
     * Найти тип устройства по коду.
     */
    Optional<DeviceType> findByCode(String code);

    /**
     * Проверить существование типа устройства по коду.
     */
    boolean existsByCode(String code);

    /**
     * Найти все активные типы устройств.
     */
    List<DeviceType> findByActiveTrue();

    /**
     * Найти тип устройства по ID с переводами.
     */
    @Query("SELECT dt FROM DeviceType dt LEFT JOIN FETCH dt.translations WHERE dt.id = :id")
    Optional<DeviceType> findByIdWithTranslations(@Param("id") Long id);

    /**
     * Найти все типы устройств с переводами.
     */
    @Query("SELECT DISTINCT dt FROM DeviceType dt LEFT JOIN FETCH dt.translations WHERE dt.active = true")
    List<DeviceType> findAllActiveWithTranslations();
}



