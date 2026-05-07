import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HOUSE_MQTT_CONFIG_MODEL,
  HouseMqttConfigModel,
} from '../mongo/schemas/house-mqtt-config.mongo';

export interface HouseMqttConfig {
  houseId: string;
  mqttUrl: string;
  mqttUsername?: string;
  mqttPassword?: string;
  topicPrefix: string;
  enabled: boolean;
}

@Injectable()
export class HouseMqttConfigRepository {
  constructor(
    @InjectModel(HOUSE_MQTT_CONFIG_MODEL)
    private readonly model: Model<HouseMqttConfigModel>,
  ) {}

  async findAll(): Promise<HouseMqttConfig[]> {
    const docs = await this.model.find().lean().exec();
    return docs.map((d) => this.toDto(d as unknown as HouseMqttConfigModel));
  }

  async findByHouseId(houseId: string): Promise<HouseMqttConfig | null> {
    const doc = await this.model.findOne({ houseId }).lean().exec();
    return doc ? this.toDto(doc as unknown as HouseMqttConfigModel) : null;
  }

  async upsert(config: HouseMqttConfig): Promise<HouseMqttConfig> {
    const doc = await this.model
      .findOneAndUpdate(
        { houseId: config.houseId },
        { $set: config },
        { upsert: true, new: true },
      )
      .lean()
      .exec();
    return this.toDto(doc as unknown as HouseMqttConfigModel);
  }

  async deleteByHouseId(houseId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ houseId }).exec();
    return result.deletedCount > 0;
  }

  private toDto(doc: HouseMqttConfigModel): HouseMqttConfig {
    return {
      houseId: doc.houseId,
      mqttUrl: doc.mqttUrl,
      mqttUsername: doc.mqttUsername,
      mqttPassword: doc.mqttPassword,
      topicPrefix: doc.topicPrefix ?? 'zigbee2mqtt',
      enabled: doc.enabled ?? true,
    };
  }
}
