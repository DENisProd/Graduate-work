package ru.denis.smarthome.device.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ru.denis.smarthome.device.model.translation.DeviceTranslation;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "devices")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_category_id", nullable = false)
    private DeviceCategory deviceCategory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeviceStatus status = DeviceStatus.OFFLINE;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "firmware_version", length = 50)
    private String firmwareVersion;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "device", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @MapKey(name = "locale")
    @Builder.Default
    private Map<String, DeviceTranslation> translations = new HashMap<>();

    @OneToMany(mappedBy = "device", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DeviceFunction> functions = new ArrayList<>();

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
        DeviceTranslation translation = DeviceTranslation.builder()
                .locale(locale)
                .name(name)
                .description(description)
                .device(this)
                .build();
        translations.put(locale, translation);
    }

    public String getName(String locale) {
        DeviceTranslation translation = translations.get(locale);
        return translation != null ? translation.getName() : null;
    }

    public String getDescription(String locale) {
        DeviceTranslation translation = translations.get(locale);
        return translation != null ? translation.getDescription() : null;
    }

    public void addFunction(DeviceFunction function) {
        functions.add(function);
        function.setDevice(this);
    }

    public void removeFunction(DeviceFunction function) {
        functions.remove(function);
        function.setDevice(null);
    }

    public boolean isOnline() {
        return DeviceStatus.ONLINE.equals(this.status);
    }
}
