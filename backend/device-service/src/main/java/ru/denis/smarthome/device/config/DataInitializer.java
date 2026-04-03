package ru.denis.smarthome.device.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ru.denis.smarthome.device.model.*;
import ru.denis.smarthome.device.repository.*;

/**
 * Инициализатор тестовых данных для разработки.
 * Активируется только в профиле 'dev'.
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DeviceTypeRepository deviceTypeRepository;
    private final DeviceCategoryRepository deviceCategoryRepository;
    private final DeviceRepository deviceRepository;
    private final DeviceFunctionRepository deviceFunctionRepository;
    private final DeviceFunctionActionRepository deviceFunctionActionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (deviceTypeRepository.count() > 0) {
            log.info("База данных уже содержит данные, пропускаем инициализацию");
            return;
        }

        log.info("Начинаем инициализацию тестовых данных...");

        // 1. Создаем типы устройств
        DeviceType lightingType = createDeviceType("LIGHTING", "Освещение", "Lighting",
                "Устройства освещения", "Lighting devices");

        DeviceType climateType = createDeviceType("CLIMATE", "Климат", "Climate",
                "Устройства климат-контроля", "Climate control devices");

        DeviceType securityType = createDeviceType("SECURITY", "Безопасность", "Security",
                "Устройства безопасности", "Security devices");

        DeviceType sensorType = createDeviceType("SENSOR", "Датчики", "Sensors",
                "Различные датчики", "Various sensors");

        // 2. Создаем категории устройств
        DeviceCategory smartBulbCategory = createDeviceCategory("SMART_BULB", lightingType,
                "Умная лампочка", "Smart Bulb",
                "LED лампочка с управлением", "LED bulb with control");

        DeviceCategory ledStripCategory = createDeviceCategory("LED_STRIP", lightingType,
                "Светодиодная лента", "LED Strip",
                "RGB светодиодная лента", "RGB LED strip");

        DeviceCategory thermostatCategory = createDeviceCategory("THERMOSTAT", climateType,
                "Термостат", "Thermostat",
                "Умный термостат", "Smart thermostat");

        DeviceCategory acCategory = createDeviceCategory("AIR_CONDITIONER", climateType,
                "Кондиционер", "Air Conditioner",
                "Умный кондиционер", "Smart air conditioner");

        DeviceCategory cameraCategory = createDeviceCategory("CAMERA", securityType,
                "Камера", "Camera",
                "IP камера видеонаблюдения", "IP surveillance camera");

        DeviceCategory doorLockCategory = createDeviceCategory("DOOR_LOCK", securityType,
                "Умный замок", "Smart Lock",
                "Электронный дверной замок", "Electronic door lock");

        DeviceCategory tempSensorCategory = createDeviceCategory("TEMP_SENSOR", sensorType,
                "Датчик температуры", "Temperature Sensor",
                "Датчик температуры и влажности", "Temperature and humidity sensor");

        DeviceCategory motionSensorCategory = createDeviceCategory("MOTION_SENSOR", sensorType,
                "Датчик движения", "Motion Sensor",
                "Инфракрасный датчик движения", "Infrared motion sensor");

        // 3. Создаем устройства
        Device livingRoomLamp = createDevice("LIVING_ROOM_LAMP_01", smartBulbCategory,
                "Лампа в гостиной", "Living Room Lamp",
                "Потолочная лампа в гостиной", "Ceiling lamp in living room",
                "SN-LAMP-001", "1.2.3");

        Device bedroomLamp = createDevice("BEDROOM_LAMP_01", smartBulbCategory,
                "Лампа в спальне", "Bedroom Lamp",
                "Настольная лампа в спальне", "Table lamp in bedroom",
                "SN-LAMP-002", "1.2.3");

        Device kitchenStrip = createDevice("KITCHEN_LED_STRIP_01", ledStripCategory,
                "Подсветка кухни", "Kitchen LED Strip",
                "Светодиодная лента под шкафами", "LED strip under cabinets",
                "SN-STRIP-001", "2.0.1");

        Device livingRoomThermostat = createDevice("LIVING_ROOM_THERMOSTAT_01", thermostatCategory,
                "Термостат гостиной", "Living Room Thermostat",
                "Умный термостат для гостиной", "Smart thermostat for living room",
                "SN-THERM-001", "3.1.0");

        Device bedroomAC = createDevice("BEDROOM_AC_01", acCategory,
                "Кондиционер спальни", "Bedroom Air Conditioner",
                "Сплит-система в спальне", "Split system in bedroom",
                "SN-AC-001", "1.5.2");

        Device frontDoorCamera = createDevice("FRONT_DOOR_CAMERA_01", cameraCategory,
                "Камера у входа", "Front Door Camera",
                "Камера видеонаблюдения у входной двери", "Surveillance camera at front door",
                "SN-CAM-001", "4.2.0");

        Device frontDoorLock = createDevice("FRONT_DOOR_LOCK_01", doorLockCategory,
                "Замок входной двери", "Front Door Lock",
                "Электронный замок входной двери", "Electronic front door lock",
                "SN-LOCK-001", "2.1.0");

        Device livingRoomTempSensor = createDevice("LIVING_ROOM_TEMP_01", tempSensorCategory,
                "Датчик температуры гостиной", "Living Room Temperature Sensor",
                "Датчик температуры и влажности", "Temperature and humidity sensor",
                "SN-TEMP-001", "1.0.5");

        Device hallwayMotionSensor = createDevice("HALLWAY_MOTION_01", motionSensorCategory,
                "Датчик движения в коридоре", "Hallway Motion Sensor",
                "Инфракрасный датчик движения", "Infrared motion sensor",
                "SN-MOTION-001", "1.1.0");

        // 4. Создаем функции устройств

        // Функции для умной лампы
        DeviceFunction lampPower = createDeviceFunction("power", livingRoomLamp, DeviceFunctionType.READ_WRITE,
                "Питание", "Power", "Включение/выключение лампы", "Turn lamp on/off",
                "false", null, null, null);

        DeviceFunction lampBrightness = createDeviceFunction("brightness", livingRoomLamp, DeviceFunctionType.READ_WRITE,
                "Яркость", "Brightness", "Уровень яркости лампы", "Lamp brightness level",
                "100", 0.0, 100.0, "%");

        DeviceFunction lampColorTemp = createDeviceFunction("color_temperature", livingRoomLamp, DeviceFunctionType.READ_WRITE,
                "Цветовая температура", "Color Temperature", "Теплый/холодный свет", "Warm/cold light",
                "4000", 2700.0, 6500.0, "K");

        // Функции для термостата
        DeviceFunction thermostatTemp = createDeviceFunction("current_temperature", livingRoomThermostat, DeviceFunctionType.READ,
                "Текущая температура", "Current Temperature", "Текущая температура в помещении", "Current room temperature",
                "22.5", -10.0, 50.0, "°C");

        DeviceFunction thermostatTarget = createDeviceFunction("target_temperature", livingRoomThermostat, DeviceFunctionType.READ_WRITE,
                "Целевая температура", "Target Temperature", "Желаемая температура", "Desired temperature",
                "23.0", 16.0, 30.0, "°C");

        DeviceFunction thermostatMode = createDeviceFunction("mode", livingRoomThermostat, DeviceFunctionType.READ_WRITE,
                "Режим работы", "Operating Mode", "Режим работы термостата", "Thermostat operating mode",
                "auto", null, null, null);

        // Функции для замка
        DeviceFunction lockState = createDeviceFunction("lock_state", frontDoorLock, DeviceFunctionType.READ_WRITE,
                "Состояние замка", "Lock State", "Открыт/закрыт", "Locked/unlocked",
                "locked", null, null, null);

        DeviceFunction lockBattery = createDeviceFunction("battery_level", frontDoorLock, DeviceFunctionType.READ,
                "Уровень заряда", "Battery Level", "Уровень заряда батареи", "Battery charge level",
                "85", 0.0, 100.0, "%");

        // Функции для датчика температуры
        DeviceFunction sensorTemp = createDeviceFunction("temperature", livingRoomTempSensor, DeviceFunctionType.READ,
                "Температура", "Temperature", "Измеренная температура", "Measured temperature",
                "22.3", -40.0, 80.0, "°C");

        DeviceFunction sensorHumidity = createDeviceFunction("humidity", livingRoomTempSensor, DeviceFunctionType.READ,
                "Влажность", "Humidity", "Относительная влажность воздуха", "Relative air humidity",
                "45", 0.0, 100.0, "%");

        // Функции для датчика движения
        DeviceFunction motionDetected = createDeviceFunction("motion_detected", hallwayMotionSensor, DeviceFunctionType.READ,
                "Обнаружено движение", "Motion Detected", "Статус обнаружения движения", "Motion detection status",
                "false", null, null, null);

        // 5. Создаем действия для функций

        // Действия для питания лампы
        createAction("turn_on", lampPower, ActionType.TURN_ON,
                "Включить", "Turn On", "Включить лампу", "Turn the lamp on",
                "{\"state\": true}");

        createAction("turn_off", lampPower, ActionType.TURN_OFF,
                "Выключить", "Turn Off", "Выключить лампу", "Turn the lamp off",
                "{\"state\": false}");

        createAction("toggle", lampPower, ActionType.TOGGLE,
                "Переключить", "Toggle", "Переключить состояние", "Toggle state",
                "{\"action\": \"toggle\"}");

        // Действия для яркости
        createAction("set_brightness", lampBrightness, ActionType.SET_VALUE,
                "Установить яркость", "Set Brightness", "Установить уровень яркости", "Set brightness level",
                "{\"brightness\": ${value}}");

        createAction("increase_brightness", lampBrightness, ActionType.INCREASE,
                "Увеличить яркость", "Increase Brightness", "Увеличить яркость на 10%", "Increase brightness by 10%",
                "{\"brightness\": \"+10\"}");

        createAction("decrease_brightness", lampBrightness, ActionType.DECREASE,
                "Уменьшить яркость", "Decrease Brightness", "Уменьшить яркость на 10%", "Decrease brightness by 10%",
                "{\"brightness\": \"-10\"}");

        // Действия для термостата
        createAction("set_temperature", thermostatTarget, ActionType.SET_VALUE,
                "Установить температуру", "Set Temperature", "Установить целевую температуру", "Set target temperature",
                "{\"target_temp\": ${value}}");

        createAction("increase_temp", thermostatTarget, ActionType.INCREASE,
                "Повысить температуру", "Increase Temperature", "Повысить на 0.5°C", "Increase by 0.5°C",
                "{\"target_temp\": \"+0.5\"}");

        createAction("decrease_temp", thermostatTarget, ActionType.DECREASE,
                "Понизить температуру", "Decrease Temperature", "Понизить на 0.5°C", "Decrease by 0.5°C",
                "{\"target_temp\": \"-0.5\"}");

        // Действия для замка
        createAction("lock", lockState, ActionType.LOCK,
                "Закрыть", "Lock", "Закрыть замок", "Lock the door",
                "{\"state\": \"locked\"}");

        createAction("unlock", lockState, ActionType.UNLOCK,
                "Открыть", "Unlock", "Открыть замок", "Unlock the door",
                "{\"state\": \"unlocked\"}");

        log.info("Инициализация тестовых данных завершена успешно!");
        log.info("Создано: {} типов, {} категорий, {} устройств",
                deviceTypeRepository.count(),
                deviceCategoryRepository.count(),
                deviceRepository.count());
    }

    private DeviceType createDeviceType(String code, String nameRu, String nameEn,
                                         String descRu, String descEn) {
        DeviceType type = DeviceType.builder()
                .code(code)
                .active(true)
                .build();
        type.addTranslation("ru", nameRu, descRu);
        type.addTranslation("en", nameEn, descEn);
        return deviceTypeRepository.save(type);
    }

    private DeviceCategory createDeviceCategory(String code, DeviceType type,
                                                  String nameRu, String nameEn,
                                                  String descRu, String descEn) {
        DeviceCategory category = DeviceCategory.builder()
                .code(code)
                .deviceType(type)
                .active(true)
                .build();
        category.addTranslation("ru", nameRu, descRu);
        category.addTranslation("en", nameEn, descEn);
        return deviceCategoryRepository.save(category);
    }

    private Device createDevice(String code, DeviceCategory category,
                                 String nameRu, String nameEn,
                                 String descRu, String descEn,
                                 String serialNumber, String firmwareVersion) {
        Device device = Device.builder()
                .code(code)
                .deviceCategory(category)
                .status(DeviceStatus.ONLINE)
                .serialNumber(serialNumber)
                .firmwareVersion(firmwareVersion)
                .active(true)
                .build();
        device.addTranslation("ru", nameRu, descRu);
        device.addTranslation("en", nameEn, descEn);
        return deviceRepository.save(device);
    }

    private DeviceFunction createDeviceFunction(String code, Device device, DeviceFunctionType type,
                                                  String nameRu, String nameEn,
                                                  String descRu, String descEn,
                                                  String currentValue, Double minValue, Double maxValue, String unit) {
        DeviceFunction function = DeviceFunction.builder()
                .code(code)
                .device(device)
                .functionType(type)
                .currentValue(currentValue)
                .minValue(minValue)
                .maxValue(maxValue)
                .unit(unit)
                .active(true)
                .build();
        function.addTranslation("ru", nameRu, descRu);
        function.addTranslation("en", nameEn, descEn);
        return deviceFunctionRepository.save(function);
    }

    private DeviceFunctionAction createAction(String code, DeviceFunction function, ActionType actionType,
                                               String nameRu, String nameEn,
                                               String descRu, String descEn,
                                               String payloadTemplate) {
        DeviceFunctionAction action = DeviceFunctionAction.builder()
                .code(code)
                .deviceFunction(function)
                .actionType(actionType)
                .payloadTemplate(payloadTemplate)
                .active(true)
                .build();
        action.addTranslation("ru", nameRu, descRu);
        action.addTranslation("en", nameEn, descEn);
        return deviceFunctionActionRepository.save(action);
    }
}

