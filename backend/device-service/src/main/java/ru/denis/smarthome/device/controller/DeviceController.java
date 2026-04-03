package ru.denis.smarthome.device.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.denis.smarthome.device.dto.response.DeviceResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.model.DeviceStatus;
import ru.denis.smarthome.device.service.DeviceService;

/**
 * Пользовательский API для устройств.
 * Ответы на языке пользователя (Accept-Language). CRUD и полные переводы — в /api/v1/admin/devices.
 * Здесь же — обновление статуса (ONLINE/OFFLINE).
 */
@RestController
@RequestMapping("/api/v1/devices")
@RequiredArgsConstructor
@Tag(name = "Devices (User)", description = "Пользовательский API — устройства (язык из Accept-Language)")
public class DeviceController {

    private final DeviceService deviceService;

    @GetMapping
    @Operation(summary = "Список устройств с пагинацией")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<PageResponse<DeviceResponse>> findAll(
            @Parameter(description = "Номер страницы (с 0)") @RequestParam(name = "page", defaultValue = "0") int page,
            @Parameter(description = "Размер страницы") @RequestParam(name = "size", defaultValue = "20") int size,
            @Parameter(description = "Сортировка (поле,направление)") @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        return ResponseEntity.ok(deviceService.findAll(pageable));
    }

    @GetMapping("/by-category/{categoryId}")
    @Operation(summary = "Устройства по категории с пагинацией")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<PageResponse<DeviceResponse>> findByCategoryId(
            @Parameter(description = "ID категории") @PathVariable("categoryId") Long categoryId,
            @Parameter(description = "Номер страницы (с 0)") @RequestParam(name = "page", defaultValue = "0") int page,
            @Parameter(description = "Размер страницы") @RequestParam(name = "size", defaultValue = "20") int size,
            @Parameter(description = "Сортировка") @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        return ResponseEntity.ok(deviceService.findByCategoryId(categoryId, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Устройство по ID",
            description = "Возвращает устройство на языке из Accept-Language")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найдено"),
            @ApiResponse(responseCode = "404", description = "Не найдено")
    })
    public ResponseEntity<DeviceResponse> findById(
            @Parameter(description = "ID устройства") @PathVariable Long id) {
        return ResponseEntity.ok(deviceService.findById(id));
    }

    @GetMapping("/{id}/detailed")
    @Operation(summary = "Устройство с функциями")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найдено"),
            @ApiResponse(responseCode = "404", description = "Не найдено")
    })
    public ResponseEntity<DeviceResponse> findByIdDetailed(
            @Parameter(description = "ID устройства") @PathVariable Long id) {
        return ResponseEntity.ok(deviceService.findByIdDetailed(id));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Устройство по коду")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найдено"),
            @ApiResponse(responseCode = "404", description = "Не найдено")
    })
    public ResponseEntity<DeviceResponse> findByCode(
            @Parameter(description = "Код устройства") @PathVariable String code) {
        return ResponseEntity.ok(deviceService.findByCode(code));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Обновить статус устройства (ONLINE/OFFLINE)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Статус обновлен"),
            @ApiResponse(responseCode = "404", description = "Устройство не найдено")
    })
    public ResponseEntity<DeviceResponse> updateStatus(
            @Parameter(description = "ID устройства") @PathVariable("id") Long id,
            @Parameter(description = "Новый статус") @RequestParam("status") DeviceStatus status) {
        return ResponseEntity.ok(deviceService.updateStatus(id, status));
    }
}

