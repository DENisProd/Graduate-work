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
import ru.denis.smarthome.device.dto.request.DeviceFunctionRequest;
import ru.denis.smarthome.device.dto.response.DeviceFunctionResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.service.DeviceFunctionService;

import java.util.List;

/**
 * Админ API для управления функциями устройств.
 * Все ответы содержат все языки и переводы (translations).
 * Изменение значения функции (updateValue) — в пользовательском API.
 */
@RestController
@RequestMapping("/api/v1/admin/device-functions")
@RequiredArgsConstructor
@Tag(name = "Admin: Device Functions", description = "Админ API — функции устройств (все переводы)")
public class AdminDeviceFunctionController {

    private final DeviceFunctionService deviceFunctionService;

    @GetMapping("/by-device/{deviceId}")
    @Operation(summary = "Функции устройства со всеми переводами (пагинация)")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<PageResponse<DeviceFunctionResponse>> findByDeviceId(
            @Parameter(description = "ID устройства") @PathVariable Long deviceId,
            @Parameter(description = "Номер страницы (с 0)") @RequestParam(name = "page", defaultValue = "0") int page,
            @Parameter(description = "Размер страницы") @RequestParam(name = "size", defaultValue = "20") int size,
            @Parameter(description = "Сортировка") @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        return ResponseEntity.ok(deviceFunctionService.findByDeviceIdFull(deviceId, pageable));
    }

    @GetMapping("/by-device/{deviceId}/all")
    @Operation(summary = "Все функции устройства со всеми переводами (без пагинации)")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<List<DeviceFunctionResponse>> findAllByDeviceId(
            @Parameter(description = "ID устройства") @PathVariable Long deviceId) {
        return ResponseEntity.ok(deviceFunctionService.findByDeviceIdFull(deviceId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Функция по ID со всеми переводами")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найдена"),
            @ApiResponse(responseCode = "404", description = "Не найдена")
    })
    public ResponseEntity<DeviceFunctionResponse> findById(
            @Parameter(description = "ID функции") @PathVariable Long id) {
        return ResponseEntity.ok(deviceFunctionService.findByIdFull(id));
    }

    @PostMapping
    @Operation(summary = "Создать функцию устройства")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Создана"),
            @ApiResponse(responseCode = "400", description = "Некорректные данные"),
            @ApiResponse(responseCode = "404", description = "Устройство не найдено"),
            @ApiResponse(responseCode = "409", description = "Код уже существует")
    })
    public ResponseEntity<DeviceFunctionResponse> create(
            @Valid @RequestBody DeviceFunctionRequest request) {
        DeviceFunctionResponse response = deviceFunctionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить функцию устройства")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Обновлена"),
            @ApiResponse(responseCode = "400", description = "Некорректные данные"),
            @ApiResponse(responseCode = "404", description = "Не найдена"),
            @ApiResponse(responseCode = "409", description = "Код уже существует")
    })
    public ResponseEntity<DeviceFunctionResponse> update(
            @Parameter(description = "ID функции") @PathVariable Long id,
            @Valid @RequestBody DeviceFunctionRequest request) {
        return ResponseEntity.ok(deviceFunctionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить функцию устройства (мягкое удаление)")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Удалена"),
            @ApiResponse(responseCode = "404", description = "Не найдена")
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID функции") @PathVariable Long id) {
        deviceFunctionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
