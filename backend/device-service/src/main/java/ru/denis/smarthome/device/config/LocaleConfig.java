package ru.denis.smarthome.device.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Конфигурация локализации для мультиязычной поддержки.
 */
@Configuration
public class LocaleConfig {

    /**
     * Локаль по умолчанию.
     */
    public static final String DEFAULT_LOCALE = "ru";

    /**
     * Поддерживаемые локали.
     */
    public static final Set<String> SUPPORTED_LOCALES = Set.of("ru", "en");

    /**
     * Резолвер локали на основе заголовка Accept-Language.
     */
    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(Locale.forLanguageTag(DEFAULT_LOCALE));
        resolver.setSupportedLocales(List.of(
                Locale.forLanguageTag("ru"),
                Locale.forLanguageTag("en")
        ));
        return resolver;
    }

    /**
     * Проверяет, поддерживается ли указанная локаль.
     */
    public static boolean isSupported(String locale) {
        return SUPPORTED_LOCALES.contains(locale);
    }

    /**
     * Возвращает локаль или локаль по умолчанию, если указанная не поддерживается.
     */
    public static String getValidLocale(String locale) {
        return isSupported(locale) ? locale : DEFAULT_LOCALE;
    }
}



