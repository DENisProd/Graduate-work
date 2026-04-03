package ru.denis.smarthome.device.controller.admin;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.denis.smarthome.device.dto.request.DeviceTypeRequest;
import ru.denis.smarthome.device.dto.response.DeviceTypeResponse;
import ru.denis.smarthome.device.service.DeviceTypeService;

import java.util.List;

/**
 * Админ API для управления типами устройств.
 * Все ответы содержат все языки и переводы (translations).
 */
@RestController
@RequestMapping("/api/v1/admin/device-types")
@RequiredArgsConstructor
@Tag(name = "Admin: Device Types", description = "Админ API — типы устройств (все переводы)")
public class AdminDeviceTypeController {

    private final DeviceTypeService deviceTypeService;

    @GetMapping
    @Operation(summary = "Все типы устройств со всеми переводами")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<List<DeviceTypeResponse>> findAll() {
        return ResponseEntity.ok(deviceTypeService.findAllFull());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Тип устройства по ID со всеми переводами")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найден"),
            @ApiResponse(responseCode = "404", description = "Не найден")
    })
    public ResponseEntity<DeviceTypeResponse> findById(
            @Parameter(description = "ID типа устройства") @PathVariable Long id) {
        return ResponseEntity.ok(deviceTypeService.findByIdFull(id));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Тип устройства по коду со всеми переводами")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найден"),
            @ApiResponse(responseCode = "404", description = "Не найден")
    })
    public ResponseEntity<DeviceTypeResponse> findByCode(
            @Parameter(description = "Код типа устройства") @PathVariable String code) {
        return ResponseEntity.ok(deviceTypeService.findByCodeFull(code));
    }

    @PostMapping
    @Operation(summary = "Создать тип устройства")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Создан"),
            @ApiResponse(responseCode = "400", description = "Некорректные данные"),
            @ApiResponse(responseCode = "409", description = "Код уже существует")
    })
    public ResponseEntity<DeviceTypeResponse> create(
            @Valid @RequestBody DeviceTypeRequest request) {
        DeviceTypeResponse response = deviceTypeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить тип устройства")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Обновлен"),
            @ApiResponse(responseCode = "400", description = "Некорректные данные"),
            @ApiResponse(responseCode = "404", description = "Не найден"),
            @ApiResponse(responseCode = "409", description = "Код уже существует")
    })
    public ResponseEntity<DeviceTypeResponse> update(
            @Parameter(description = "ID типа устройства") @PathVariable Long id,
            @Valid @RequestBody DeviceTypeRequest request) {
        return ResponseEntity.ok(deviceTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить тип устройства (мягкое удаление)")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Удален"),
            @ApiResponse(responseCode = "404", description = "Не найден")
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID типа устройства") @PathVariable Long id) {
        deviceTypeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
