package ru.denis.smarthome.device.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ru.denis.smarthome.device.model.translation.DeviceFunctionTranslation;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "device_functions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"device_id", "code"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceFunction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Enumerated(EnumType.STRING)
    @Column(name = "function_type", nullable = false, length = 20)
    private DeviceFunctionType functionType;

    @Column(name = "current_value")
    private String currentValue;

    @Column(name = "min_value")
    private Double minValue;

    @Column(name = "max_value")
    private Double maxValue;

    @Column(length = 50)
    private String unit;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "deviceFunction", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @MapKey(name = "locale")
    @Builder.Default
    private Map<String, DeviceFunctionTranslation> translations = new HashMap<>();

    @OneToMany(mappedBy = "deviceFunction", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DeviceFunctionAction> actions = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addTranslation(String locale, String name, String description) {
        DeviceFunctionTranslation translation = DeviceFunctionTranslation.builder()
                .locale(locale)
                .name(name)
                .description(description)
                .deviceFunction(this)
                .build();
        translations.put(locale, translation);
    }

    public String getName(String locale) {
        DeviceFunctionTranslation translation = translations.get(locale);
        return translation != null ? translation.getName() : null;
    }

    public String getDescription(String locale) {
        DeviceFunctionTranslation translation = translations.get(locale);
        return translation != null ? translation.getDescription() : null;
    }

    public void addAction(DeviceFunctionAction action) {
        actions.add(action);
        action.setDeviceFunction(this);
    }

    public void removeAction(DeviceFunctionAction action) {
        actions.remove(action);
        action.setDeviceFunction(null);
    }

    public boolean isReadable() {
        return DeviceFunctionType.READ.equals(this.functionType) ||
                DeviceFunctionType.READ_WRITE.equals(this.functionType);
    }

    public boolean isWritable() {
        return DeviceFunctionType.WRITE.equals(this.functionType) ||
                DeviceFunctionType.READ_WRITE.equals(this.functionType);
    }
}
