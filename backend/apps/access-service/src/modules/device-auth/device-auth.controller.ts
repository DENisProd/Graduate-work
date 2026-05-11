import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { DeviceAuthService } from './device-auth.service';
import { UserId } from '../common/decorators/user-id.decorator';

class CreateDeviceAuthSessionDto {
  @ApiProperty({ required: false, example: 'http://127.0.0.1:4100/api/v1/system/auth/callback' })
  @IsOptional()
  @IsString()
  callbackUrl?: string;
}

class CompleteDeviceAuthDto {
  @ApiProperty({ example: 'ABCD-EFGH' })
  @IsString()
  userCode!: string;
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  externalUserId!: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  displayName?: string;
}

@ApiTags('Device Auth')
@Controller('device-auth')
export class DeviceAuthController {
  constructor(private readonly deviceAuthService: DeviceAuthService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Start local-server device authorization session' })
  createSession(@Body() dto: CreateDeviceAuthSessionDto) {
    return this.deviceAuthService.createSession(dto.callbackUrl);
  }

  @Get('sessions/:sessionId/poll')
  @ApiOperation({ summary: 'Poll authorization session status (pending/authorized/expired)' })
  pollSession(@Param('sessionId') sessionId: string) {
    return this.deviceAuthService.pollSession(sessionId);
  }

  @Post('sessions/:sessionId/logout')
  @ApiOperation({ summary: 'Revoke authorization session for local-server logout' })
  logoutSession(@Param('sessionId') sessionId: string) {
    return this.deviceAuthService.logoutSession(sessionId);
  }

  @Get('connected-servers')
  @ApiOperation({ summary: 'List local-server instances authorized by current user' })
  listConnectedServers(@UserId() externalUserId: string) {
    return this.deviceAuthService.listConnectedServers(externalUserId);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm user code and authorize the waiting local-server session' })
  async complete(@Body() dto: CompleteDeviceAuthDto) {
    await this.deviceAuthService.completeByUserCode(
      dto.userCode,
      dto.externalUserId,
      dto.displayName,
    );
    return { status: 'ok' };
  }
}
