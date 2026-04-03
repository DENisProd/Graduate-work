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
import ru.denis.smarthome.device.dto.response.DeviceFunctionResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.service.DeviceFunctionService;

import java.util.List;

/**
 * Пользовательский API для функций устройств.
 * Ответы на языке пользователя (Accept-Language). CRUD и полные переводы — в /api/v1/admin/device-functions.
 * Здесь же — обновление значения функции (управление).
 */
@RestController
@RequestMapping("/api/v1/device-functions")
@RequiredArgsConstructor
@Tag(name = "Device Functions (User)", description = "Пользовательский API — функции устройств (язык из Accept-Language)")
public class DeviceFunctionController {

    private final DeviceFunctionService deviceFunctionService;

    @GetMapping("/by-device/{deviceId}")
    @Operation(summary = "Функции устройства с пагинацией")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<PageResponse<DeviceFunctionResponse>> findByDeviceId(
            @Parameter(description = "ID устройства") @PathVariable("deviceId") Long deviceId,
            @Parameter(description = "Номер страницы (с 0)") @RequestParam(name = "page", defaultValue = "0") int page,
            @Parameter(description = "Размер страницы") @RequestParam(name = "size", defaultValue = "20") int size,
            @Parameter(description = "Сортировка") @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        return ResponseEntity.ok(deviceFunctionService.findByDeviceId(deviceId, pageable));
    }

    @GetMapping("/by-device/{deviceId}/all")
    @Operation(summary = "Все функции устройства (без пагинации)")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<List<DeviceFunctionResponse>> findAllByDeviceId(
            @Parameter(description = "ID устройства") @PathVariable("deviceId") Long deviceId) {
        return ResponseEntity.ok(deviceFunctionService.findByDeviceId(deviceId));
    }

    @GetMapping("/by-device/{deviceId}/writable")
    @Operation(summary = "Управляемые функции устройства (WRITE/READ_WRITE)")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<List<DeviceFunctionResponse>> findWritableFunctions(
            @Parameter(description = "ID устройства") @PathVariable Long deviceId) {
        return ResponseEntity.ok(deviceFunctionService.findWritableFunctions(deviceId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Функция по ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найдена"),
            @ApiResponse(responseCode = "404", description = "Не найдена")
    })
    public ResponseEntity<DeviceFunctionResponse> findById(
            @Parameter(description = "ID функции") @PathVariable Long id) {
        return ResponseEntity.ok(deviceFunctionService.findById(id));
    }

    @GetMapping("/{id}/detailed")
    @Operation(summary = "Функция с действиями")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найдена"),
            @ApiResponse(responseCode = "404", description = "Не найдена")
    })
    public ResponseEntity<DeviceFunctionResponse> findByIdDetailed(
            @Parameter(description = "ID функции") @PathVariable Long id) {
        return ResponseEntity.ok(deviceFunctionService.findByIdDetailed(id));
    }

    @PatchMapping("/{id}/value")
    @Operation(summary = "Обновить значение функции (яркость, температура и т.д.)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Значение обновлено"),
            @ApiResponse(responseCode = "404", description = "Функция не найдена")
    })
    public ResponseEntity<DeviceFunctionResponse> updateValue(
            @Parameter(description = "ID функции") @PathVariable("id") Long id,
            @Parameter(description = "Новое значение") @RequestParam("value") String value) {
        return ResponseEntity.ok(deviceFunctionService.updateValue(id, value));
    }
}

