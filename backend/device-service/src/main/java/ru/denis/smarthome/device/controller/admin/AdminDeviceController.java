package ru.denis.smarthome.device.controller.admin;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.denis.smarthome.device.dto.request.DeviceRequest;
import ru.denis.smarthome.device.dto.response.DeviceResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.service.DeviceService;

/**
 * Админ API для управления устройствами (каталог).
 * Все ответы содержат все языки и переводы (translations).
 * Управление статусом устройства (ONLINE/OFFLINE) — в пользовательском API.
 */
@RestController
@RequestMapping("/api/v1/admin/devices")
@RequiredArgsConstructor
@Tag(name = "Admin: Devices", description = "Админ API — устройства (все переводы)")
public class AdminDeviceController {

    private final DeviceService deviceService;

    @GetMapping
    @Operation(summary = "Список устройств со всеми переводами (пагинация)")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<PageResponse<DeviceResponse>> findAll(
            @Parameter(description = "Номер страницы (с 0)") @RequestParam(name = "page", defaultValue = "0") int page,
            @Parameter(description = "Размер страницы") @RequestParam(name = "size", defaultValue = "20") int size,
            @Parameter(description = "Сортировка") @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        return ResponseEntity.ok(deviceService.findAllFull(pageable));
    }

    @GetMapping("/by-category/{categoryId}")
    @Operation(summary = "Устройства по категории со всеми переводами (пагинация)")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<PageResponse<DeviceResponse>> findByCategoryId(
            @Parameter(description = "ID категории") @PathVariable Long categoryId,
            @Parameter(description = "Номер страницы (с 0)") @RequestParam(name = "page", defaultValue = "0") int page,
            @Parameter(description = "Размер страницы") @RequestParam(name = "size", defaultValue = "20") int size,
            @Parameter(description = "Сортировка") @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        return ResponseEntity.ok(deviceService.findByCategoryIdFull(categoryId, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Устройство по ID со всеми переводами")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найдено"),
            @ApiResponse(responseCode = "404", description = "Не найдено")
    })
    public ResponseEntity<DeviceResponse> findById(
            @Parameter(description = "ID устройства") @PathVariable Long id) {
        return ResponseEntity.ok(deviceService.findByIdFull(id));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Устройство по коду со всеми переводами")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найдено"),
            @ApiResponse(responseCode = "404", description = "Не найдено")
    })
    public ResponseEntity<DeviceResponse> findByCode(
            @Parameter(description = "Код устройства") @PathVariable String code) {
        return ResponseEntity.ok(deviceService.findByCodeFull(code));
    }

    @PostMapping
    @Operation(summary = "Создать устройство")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Создано"),
            @ApiResponse(responseCode = "400", description = "Некорректные данные"),
            @ApiResponse(responseCode = "404", description = "Категория не найдена"),
            @ApiResponse(responseCode = "409", description = "Код уже существует")
    })
    public ResponseEntity<DeviceResponse> create(
            @Valid @RequestBody DeviceRequest request) {
        DeviceResponse response = deviceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить устройство")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Обновлено"),
            @ApiResponse(responseCode = "400", description = "Некорректные данные"),
            @ApiResponse(responseCode = "404", description = "Не найдено"),
            @ApiResponse(responseCode = "409", description = "Код уже существует")
    })
    public ResponseEntity<DeviceResponse> update(
            @Parameter(description = "ID устройства") @PathVariable Long id,
            @Valid @RequestBody DeviceRequest request) {
        return ResponseEntity.ok(deviceService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить устройство (мягкое удаление)")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Удалено"),
            @ApiResponse(responseCode = "404", description = "Не найдено")
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID устройства") @PathVariable Long id) {
        deviceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
