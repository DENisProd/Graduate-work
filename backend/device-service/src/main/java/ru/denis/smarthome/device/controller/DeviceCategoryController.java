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
import ru.denis.smarthome.device.dto.response.DeviceCategoryResponse;
import ru.denis.smarthome.device.dto.response.PageResponse;
import ru.denis.smarthome.device.service.DeviceCategoryService;

import java.util.List;

/**
 * Пользовательский API для категорий устройств.
 * Ответы на языке пользователя (Accept-Language). CRUD и полные переводы — в /api/v1/admin/device-categories.
 */
@RestController
@RequestMapping("/api/v1/device-categories")
@RequiredArgsConstructor
@Tag(name = "Device Categories (User)", description = "Пользовательский API — категории устройств (язык из Accept-Language)")
public class DeviceCategoryController {

    private final DeviceCategoryService deviceCategoryService;

    @GetMapping
    @Operation(summary = "Список категорий с пагинацией",
            description = "Возвращает категории на языке из Accept-Language")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<PageResponse<DeviceCategoryResponse>> findAll(
            @Parameter(description = "Номер страницы (с 0)") @RequestParam(name = "page", defaultValue = "0") int page,
            @Parameter(description = "Размер страницы") @RequestParam(name = "size", defaultValue = "20") int size,
            @Parameter(description = "Сортировка") @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        return ResponseEntity.ok(deviceCategoryService.findAll(pageable));
    }

    @GetMapping("/all")
    @Operation(summary = "Все категории (без пагинации)",
            description = "Возвращает категории на языке из Accept-Language")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<List<DeviceCategoryResponse>> findAllList() {
        return ResponseEntity.ok(deviceCategoryService.findAll());
    }

    @GetMapping("/by-type/{deviceTypeId}")
    @Operation(summary = "Категории по типу устройства")
    @ApiResponse(responseCode = "200", description = "Успешно")
    public ResponseEntity<List<DeviceCategoryResponse>> findByDeviceTypeId(
            @Parameter(description = "ID типа устройства") @PathVariable Long deviceTypeId) {
        return ResponseEntity.ok(deviceCategoryService.findByDeviceTypeId(deviceTypeId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Категория по ID",
            description = "Возвращает категорию на языке из Accept-Language")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найдена"),
            @ApiResponse(responseCode = "404", description = "Не найдена")
    })
    public ResponseEntity<DeviceCategoryResponse> findById(
            @Parameter(description = "ID категории") @PathVariable Long id) {
        return ResponseEntity.ok(deviceCategoryService.findById(id));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Категория по коду")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Найдена"),
            @ApiResponse(responseCode = "404", description = "Не найдена")
    })
    public ResponseEntity<DeviceCategoryResponse> findByCode(
            @Parameter(description = "Код категории") @PathVariable String code) {
        return ResponseEntity.ok(deviceCategoryService.findByCode(code));
    }
}

