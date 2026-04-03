package ru.denis.smarthome.device.dto.response;

import java.util.List;

/**
 * DTO для пагинированных ответов.
 *
 * @param <T> тип элементов списка
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last,
        boolean hasNext,
        boolean hasPrevious
) {
}



