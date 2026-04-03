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
import ru.denis.smarthome.device.dto.response.DeviceFunctionActionResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.service.DeviceFunctionActionService;

import java.util.List;

/**
 * Пользовательский API для действий функций устройств.
 * Ответы на языке пользователя (Accept-Language). CRUD и полные переводы — в /api/v1/admin/device-function-actions.
 * Здесь же — выполнение действия (execute).
 */
@RestController
@RequestMapping("/api/v1/device-function-actions")
@RequiredArgsConstructor
@Tag(name = "Device Function Actions (User)", description = "Пользовательский API — действия функций (язык из Accept-Language)")
public class DeviceFunctionActionController {

    private final DeviceFunctionActionService deviceFunctionActionService;

    @GetMapping("/by-function/{functionId}")
    @Operation(summary = "Действия функции с пагинацией")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<PageResponse<DeviceFunctionActionResponse>> findByFunctionId(
            @Parameter(description = "ID функции") @PathVariable("functionId") Long functionId,
            @Parameter(description = "Номер страницы (с 0)") @RequestParam(name = "page", defaultValue = "0") int page,
            @Parameter(description = "Размер страницы") @RequestParam(name = "size", defaultValue = "20") int size,
            @Parameter(description = "Сортировка") @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        return ResponseEntity.ok(deviceFunctionActionService.findByFunctionId(functionId, pageable));
    }

    @GetMapping("/by-function/{functionId}/all")
    @Operation(summary = "Все действия функции (без пагинации)")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<List<DeviceFunctionActionResponse>> findAllByFunctionId(
            @Parameter(description = "ID функции") @PathVariable("functionId") Long functionId) {
        return ResponseEntity.ok(deviceFunctionActionService.findByFunctionId(functionId));
    }

    @GetMapping("/by-device/{deviceId}")
    @Operation(summary = "Действия устройства с пагинацией")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<PageResponse<DeviceFunctionActionResponse>> findByDeviceId(
            @Parameter(description = "ID устройства") @PathVariable("deviceId") Long deviceId,
            @Parameter(description = "Номер страницы (с 0)") @RequestParam(name = "page", defaultValue = "0") int page,
            @Parameter(description = "Размер страницы") @RequestParam(name = "size", defaultValue = "20") int size,
            @Parameter(description = "Сортировка") @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        return ResponseEntity.ok(deviceFunctionActionService.findByDeviceId(deviceId, pageable));
    }

    @GetMapping("/by-device/{deviceId}/all")
    @Operation(summary = "Все действия устройства (без пагинации)")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<List<DeviceFunctionActionResponse>> findAllByDeviceId(
            @Parameter(description = "ID устройства") @PathVariable("deviceId") Long deviceId) {
        return ResponseEntity.ok(deviceFunctionActionService.findByDeviceId(deviceId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Действие по ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найдено"),
            @ApiResponse(responseCode = "404", description = "Не найдено")
    })
    public ResponseEntity<DeviceFunctionActionResponse> findById(
            @Parameter(description = "ID действия") @PathVariable Long id) {
        return ResponseEntity.ok(deviceFunctionActionService.findById(id));
    }

    @PostMapping("/{id}/execute")
    @Operation(summary = "Выполнить действие (отправить команду на устройство)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Действие выполнено"),
            @ApiResponse(responseCode = "404", description = "Действие не найдено")
    })
    public ResponseEntity<DeviceFunctionActionResponse> execute(
            @Parameter(description = "ID действия") @PathVariable Long id) {
        return ResponseEntity.ok(deviceFunctionActionService.execute(id));
    }
}

