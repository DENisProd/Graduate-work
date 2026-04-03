package ru.denis.smarthome.device.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import ru.denis.smarthome.device.config.LocaleConfig;

import java.util.Locale;
import java.util.Optional;

/**
 * Сервис для работы с локализацией.
 * Предоставляет методы для получения текущей локали из запроса.
 */
@Service
public class LocaleService {

    private static final String ACCEPT_LANGUAGE_HEADER = "Accept-Language";

    /**
     * Получает текущую локаль из HTTP запроса.
     * Если локаль не указана или не поддерживается, возвращает локаль по умолчанию.
     *
     * @return код локали (ru, en, и т.д.)
     */
    public String getCurrentLocale() {
        return getCurrentRequest()
                .map(this::extractLocaleFromRequest)
                .orElse(LocaleConfig.DEFAULT_LOCALE);
    }

    /**
     * Получает локаль или использует переданную, если она валидна.
     *
     * @param locale предпочтительная локаль
     * @return валидная локаль
     */
    public String getLocaleOrDefault(String locale) {
        if (locale != null && LocaleConfig.isSupported(locale)) {
            return locale;
        }
        return getCurrentLocale();
    }

    /**
     * Извлекает локаль из HTTP запроса.
     */
    private String extractLocaleFromRequest(HttpServletRequest request) {
        String acceptLanguage = request.getHeader(ACCEPT_LANGUAGE_HEADER);

        if (acceptLanguage != null && !acceptLanguage.isEmpty()) {
            String locale = parseLocale(acceptLanguage);
            return LocaleConfig.getValidLocale(locale);
        }

        Locale requestLocale = request.getLocale();
        if (requestLocale != null) {
            return LocaleConfig.getValidLocale(requestLocale.getLanguage());
        }

        return LocaleConfig.DEFAULT_LOCALE;
    }

    /**
     * Парсит заголовок Accept-Language и извлекает основной язык.
     */
    private String parseLocale(String acceptLanguage) {
        // Accept-Language может иметь формат: "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7"
        String[] parts = acceptLanguage.split("[,;]");
        if (parts.length > 0) {
            String locale = parts[0].trim();
            // Извлекаем только код языка (без региона)
            if (locale.contains("-")) {
                return locale.split("-")[0].toLowerCase();
            }
            return locale.toLowerCase();
        }
        return LocaleConfig.DEFAULT_LOCALE;
    }

    /**
     * Получает текущий HTTP запрос из контекста.
     */
    private Optional<HttpServletRequest> getCurrentRequest() {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            return Optional.of(attributes.getRequest());
        }
        return Optional.empty();
    }
}



