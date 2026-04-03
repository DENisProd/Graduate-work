package ru.denis.smarthome.device.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.denis.smarthome.device.dto.response.DeviceTypeResponse;
import ru.denis.smarthome.device.service.DeviceTypeService;

import java.util.List;

/**
 * Пользовательский API для типов устройств.
 * Ответы на языке пользователя (Accept-Language). CRUD и полные переводы — в /api/v1/admin/device-types.
 */
@RestController
@RequestMapping("/api/v1/device-types")
@RequiredArgsConstructor
@Tag(name = "Device Types (User)", description = "Пользовательский API — типы устройств (язык из Accept-Language)")
public class DeviceTypeController {

    private final DeviceTypeService deviceTypeService;

    @GetMapping
    @Operation(summary = "Все типы устройств",
            description = "Возвращает типы на языке из Accept-Language")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<List<DeviceTypeResponse>> findAll() {
        return ResponseEntity.ok(deviceTypeService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Тип устройства по ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найден"),
            @ApiResponse(responseCode = "404", description = "Не найден")
    })
    public ResponseEntity<DeviceTypeResponse> findById(
            @Parameter(description = "ID типа устройства") @PathVariable Long id) {
        return ResponseEntity.ok(deviceTypeService.findById(id));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Тип устройства по коду")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найден"),
            @ApiResponse(responseCode = "404", description = "Не найден")
    })
    public ResponseEntity<DeviceTypeResponse> findByCode(
            @Parameter(description = "Код типа устройства") @PathVariable String code) {
        return ResponseEntity.ok(deviceTypeService.findByCode(code));
    }
}



