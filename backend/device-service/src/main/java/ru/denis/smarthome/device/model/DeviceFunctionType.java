package ru.denis.smarthome.device.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Тип функции устройства.
 * Определяет, можно ли читать значение, записывать или оба варианта.
 */
public enum DeviceFunctionType {
    /**
     * Только чтение (сенсоры, датчики)
     */
    READ("R"),

    /**
     * Только запись (команды управления)
     */
    WRITE("W"),

    /**
     * Чтение и запись (регулируемые параметры)
     */
    READ_WRITE("RW");

    private final String code;

    DeviceFunctionType(String code) {
        this.code = code;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static DeviceFunctionType fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (DeviceFunctionType type : values()) {
            if (type.code.equalsIgnoreCase(code) || type.name().equalsIgnoreCase(code)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown DeviceFunctionType code: " + code);
    }
}
