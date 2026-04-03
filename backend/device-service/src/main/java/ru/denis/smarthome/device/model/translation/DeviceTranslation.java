package ru.denis.smarthome.device.model.translation;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ru.denis.smarthome.device.model.Device;

@Entity
@Table(name = "device_translations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"device_id", "locale"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String locale;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;
}



