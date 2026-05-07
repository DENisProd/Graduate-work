import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export const HOUSE_MQTT_CONFIG_MODEL = 'HouseMqttConfig';

@Schema({ collection: 'house_mqtt_configs', timestamps: true })
export class HouseMqttConfigModel extends Document {
  @Prop({ required: true, unique: true, index: true })
  houseId!: string;

  @Prop({ required: true })
  mqttUrl!: string;

  @Prop()
  mqttUsername?: string;

  @Prop()
  mqttPassword?: string;

  @Prop({ default: 'zigbee2mqtt' })
  topicPrefix!: string;

  @Prop({ default: true })
  enabled!: boolean;
}

export const HouseMqttConfigSchema = SchemaFactory.createForClass(HouseMqttConfigModel);
