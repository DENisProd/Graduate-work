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
import ru.denis.smarthome.device.dto.request.DeviceFunctionActionRequest;
import ru.denis.smarthome.device.dto.response.DeviceFunctionActionResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.service.DeviceFunctionActionService;

import java.util.List;

/**
 * Админ API для управления действиями функций устройств.
 * Все ответы содержат все языки и переводы (translations).
 * Выполнение действия (execute) — в пользовательском API.
 */
@RestController
@RequestMapping("/api/v1/admin/device-function-actions")
@RequiredArgsConstructor
@Tag(name = "Admin: Device Function Actions", description = "Админ API — действия функций (все переводы)")
public class AdminDeviceFunctionActionController {

    private final DeviceFunctionActionService deviceFunctionActionService;

    @GetMapping("/by-function/{functionId}")
    @Operation(summary = "Действия функции со всеми переводами (пагинация)")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<PageResponse<DeviceFunctionActionResponse>> findByFunctionId(
            @Parameter(description = "ID функции") @PathVariable Long functionId,
            @Parameter(description = "Номер страницы (с 0)") @RequestParam(name = "page", defaultValue = "0") int page,
            @Parameter(description = "Размер страницы") @RequestParam(name = "size", defaultValue = "20") int size,
            @Parameter(description = "Сортировка") @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        return ResponseEntity.ok(deviceFunctionActionService.findByFunctionIdFull(functionId, pageable));
    }

    @GetMapping("/by-function/{functionId}/all")
    @Operation(summary = "Все действия функции со всеми переводами (без пагинации)")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<List<DeviceFunctionActionResponse>> findAllByFunctionId(
            @Parameter(description = "ID функции") @PathVariable Long functionId) {
        return ResponseEntity.ok(deviceFunctionActionService.findByFunctionIdFull(functionId));
    }

    @GetMapping("/by-device/{deviceId}")
    @Operation(summary = "Действия устройства со всеми переводами (пагинация)")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<PageResponse<DeviceFunctionActionResponse>> findByDeviceId(
            @Parameter(description = "ID устройства") @PathVariable Long deviceId,
            @Parameter(description = "Номер страницы (с 0)") @RequestParam(name = "page", defaultValue = "0") int page,
            @Parameter(description = "Размер страницы") @RequestParam(name = "size", defaultValue = "20") int size,
            @Parameter(description = "Сортировка") @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        return ResponseEntity.ok(deviceFunctionActionService.findByDeviceIdFull(deviceId, pageable));
    }

    @GetMapping("/by-device/{deviceId}/all")
    @Operation(summary = "Все действия устройства со всеми переводами (без пагинации)")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<List<DeviceFunctionActionResponse>> findAllByDeviceId(
            @Parameter(description = "ID устройства") @PathVariable Long deviceId) {
        return ResponseEntity.ok(deviceFunctionActionService.findByDeviceIdFull(deviceId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Действие по ID со всеми переводами")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найдено"),
            @ApiResponse(responseCode = "404", description = "Не найдено")
    })
    public ResponseEntity<DeviceFunctionActionResponse> findById(
            @Parameter(description = "ID действия") @PathVariable Long id) {
        return ResponseEntity.ok(deviceFunctionActionService.findByIdFull(id));
    }

    @PostMapping
    @Operation(summary = "Создать действие функции")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Создано"),
            @ApiResponse(responseCode = "400", description = "Некорректные данные"),
            @ApiResponse(responseCode = "404", description = "Функция не найдена"),
            @ApiResponse(responseCode = "409", description = "Код уже существует")
    })
    public ResponseEntity<DeviceFunctionActionResponse> create(
            @Valid @RequestBody DeviceFunctionActionRequest request) {
        DeviceFunctionActionResponse response = deviceFunctionActionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить действие функции")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Обновлено"),
            @ApiResponse(responseCode = "400", description = "Некорректные данные"),
            @ApiResponse(responseCode = "404", description = "Не найдено"),
            @ApiResponse(responseCode = "409", description = "Код уже существует")
    })
    public ResponseEntity<DeviceFunctionActionResponse> update(
            @Parameter(description = "ID действия") @PathVariable Long id,
            @Valid @RequestBody DeviceFunctionActionRequest request) {
        return ResponseEntity.ok(deviceFunctionActionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить действие функции (мягкое удаление)")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Удалено"),
            @ApiResponse(responseCode = "404", description = "Не найдено")
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID действия") @PathVariable Long id) {
        deviceFunctionActionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
