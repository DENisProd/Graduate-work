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
import ru.denis.smarthome.device.dto.request.DeviceCategoryRequest;
import ru.denis.smarthome.device.dto.response.DeviceCategoryResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.service.DeviceCategoryService;

import java.util.List;

/**
 * Админ API для управления категориями устройств.
 * Все ответы содержат все языки и переводы (translations).
 */
@RestController
@RequestMapping("/api/v1/admin/device-categories")
@RequiredArgsConstructor
@Tag(name = "Admin: Device Categories", description = "Админ API — категории устройств (все переводы)")
public class AdminDeviceCategoryController {

    private final DeviceCategoryService deviceCategoryService;

    @GetMapping
    @Operation(summary = "Список категорий со всеми переводами (пагинация)")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<PageResponse<DeviceCategoryResponse>> findAll(
            @Parameter(description = "Номер страницы (с 0)") @RequestParam(name = "page", defaultValue = "0") int page,
            @Parameter(description = "Размер страницы") @RequestParam(name = "size", defaultValue = "20") int size,
            @Parameter(description = "Сортировка") @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        return ResponseEntity.ok(deviceCategoryService.findAllFull(pageable));
    }

    @GetMapping("/all")
    @Operation(summary = "Все категории со всеми переводами (без пагинации)")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<List<DeviceCategoryResponse>> findAllList() {
        return ResponseEntity.ok(deviceCategoryService.findAllFull());
    }

    @GetMapping("/by-type/{deviceTypeId}")
    @Operation(summary = "Категории по типу устройства (со всеми переводами)")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<List<DeviceCategoryResponse>> findByDeviceTypeId(
            @Parameter(description = "ID типа устройства") @PathVariable Long deviceTypeId) {
        return ResponseEntity.ok(deviceCategoryService.findByDeviceTypeIdFull(deviceTypeId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Категория по ID со всеми переводами")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найдена"),
            @ApiResponse(responseCode = "404", description = "Не найдена")
    })
    public ResponseEntity<DeviceCategoryResponse> findById(
            @Parameter(description = "ID категории") @PathVariable Long id) {
        return ResponseEntity.ok(deviceCategoryService.findByIdFull(id));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Категория по коду со всеми переводами")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найдена"),
            @ApiResponse(responseCode = "404", description = "Не найдена")
    })
    public ResponseEntity<DeviceCategoryResponse> findByCode(
            @Parameter(description = "Код категории") @PathVariable String code) {
        return ResponseEntity.ok(deviceCategoryService.findByCodeFull(code));
    }

    @PostMapping
    @Operation(summary = "Создать категорию")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Создана"),
            @ApiResponse(responseCode = "400", description = "Некорректные данные"),
            @ApiResponse(responseCode = "404", description = "Тип устройства не найден"),
            @ApiResponse(responseCode = "409", description = "Код уже существует")
    })
    public ResponseEntity<DeviceCategoryResponse> create(
            @Valid @RequestBody DeviceCategoryRequest request) {
        DeviceCategoryResponse response = deviceCategoryService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить категорию")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Обновлена"),
            @ApiResponse(responseCode = "400", description = "Некорректные данные"),
            @ApiResponse(responseCode = "404", description = "Не найдена"),
            @ApiResponse(responseCode = "409", description = "Код уже существует")
    })
    public ResponseEntity<DeviceCategoryResponse> update(
            @Parameter(description = "ID категории") @PathVariable Long id,
            @Valid @RequestBody DeviceCategoryRequest request) {
        return ResponseEntity.ok(deviceCategoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить категорию (мягкое удаление)")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Удалена"),
            @ApiResponse(responseCode = "404", description = "Не найдена")
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID категории") @PathVariable Long id) {
        deviceCategoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
