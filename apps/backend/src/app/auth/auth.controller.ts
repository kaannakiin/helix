import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ACCESS_TOKEN_COOKIE_NAME } from '@org/constants/auth-constants';
import type { Request, Response } from 'express';
import { RealIp } from 'nestjs-real-ip';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { parseUserAgent } from '../../core/utils/ua-parser.util';
import { AuthService } from './auth.service';
import { DeviceService } from './device.service';
import {
  ChangePasswordDTO,
  EmailLoginDTO,
  PaginationQueryDTO,
  RegisterDTO,
  UpdateProfileDTO,
} from './dto';
import {
  FacebookAuthGuard,
  GoogleAuthGuard,
  InstagramAuthGuard,
  JwtRefreshGuard,
  LocalAuthGuard,
} from './guards';
import type {
  OAuthProfile,
  RefreshTokenContext,
  RequestMetadata,
  ValidatedUser,
} from './interfaces';
import { SessionService } from './session.service';

@ApiTags('Auth')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly deviceService: DeviceService,
    private readonly config: ConfigService
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or phone already exists' })
  async register(
    @Body() dto: RegisterDTO,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @RealIp() ip: string
  ) {
    const metadata = this.buildMetadata(req, ip);
    return this.authService.register(dto, metadata, res, req.hostname);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: EmailLoginDTO })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @RealIp() ip: string
  ) {
    const metadata = this.buildMetadata(req, ip);
    return this.authService.login(req.user as ValidatedUser, metadata, res, req.hostname);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const context = req.user as RefreshTokenContext;
    return this.authService.refreshTokens(context, res, req.hostname);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @CurrentUser('sub') userId: string,
    @CurrentUser('sessionId') sessionId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @RealIp() ip: string
  ) {
    const metadata = this.buildMetadata(req, ip);
    return this.authService.logout(userId, sessionId, metadata, res, req.hostname);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout all sessions' })
  @ApiResponse({ status: 200, description: 'All sessions revoked' })
  async logoutAll(
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @RealIp() ip: string
  ) {
    const metadata = this.buildMetadata(req, ip);
    return this.authService.logoutAll(userId, metadata, res, req.hostname);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDTO,
    @Req() req: Request,
    @RealIp() ip: string
  ) {
    const metadata = this.buildMetadata(req, ip);
    return this.authService.updateProfile(userId, dto, metadata);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDTO,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @RealIp() ip: string
  ) {
    const metadata = this.buildMetadata(req, ip);
    return this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
      metadata,
      res,
      req.hostname,
    );
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get active sessions' })
  @ApiResponse({ status: 200, description: 'Active sessions list' })
  async getSessions(@CurrentUser('sub') userId: string) {
    return this.sessionService.getActiveSessions(userId);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Revoke a session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  async revokeSession(@Param('id') sessionId: string) {
    return this.sessionService.revokeSession(sessionId, 'USER_REVOKED');
  }

  @Get('devices')
  @ApiOperation({ summary: 'Get user devices' })
  @ApiResponse({ status: 200, description: 'Devices list' })
  async getDevices(@CurrentUser('sub') userId: string) {
    return this.deviceService.getUserDevices(userId);
  }

  @Delete('devices/:id')
  @ApiOperation({ summary: 'Delete a device' })
  @ApiParam({ name: 'id', description: 'Device ID' })
  @ApiResponse({ status: 200, description: 'Device deleted' })
  async deleteDevice(@Param('id') deviceId: string) {
    return this.deviceService.deleteDevice(deviceId);
  }

  @Patch('devices/:id/trust')
  @ApiOperation({ summary: 'Toggle device trust status' })
  @ApiParam({ name: 'id', description: 'Device ID' })
  @ApiResponse({ status: 200, description: 'Device trust updated' })
  async toggleDeviceTrust(
    @Param('id') deviceId: string,
    @Body('isTrusted') isTrusted: boolean
  ) {
    return this.deviceService.toggleTrust(deviceId, isTrusted);
  }

  @Get('login-history')
  @ApiOperation({ summary: 'Get login history' })
  @ApiResponse({ status: 200, description: 'Login history list' })
  async getLoginHistory(
    @CurrentUser('sub') userId: string,
    @Query() query: PaginationQueryDTO
  ) {
    return this.authService.getLoginHistory(userId, query.page, query.limit);
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  googleLogin(): void {}

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
    @RealIp() ip: string
  ) {
    const oauthProfile = req.user as OAuthProfile;
    const metadata = this.buildMetadata(req, ip);
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    try {
      await this.authService.handleOAuthLogin(oauthProfile, metadata, res, req.hostname);
      res.redirect(frontendUrl);
    } catch {
      res.redirect(`${frontendUrl}/auth/error`);
    }
  }

  @Public()
  @UseGuards(FacebookAuthGuard)
  @Get('facebook')
  @ApiOperation({ summary: 'Initiate Facebook OAuth login' })
  facebookLogin(): void {}

  @Public()
  @UseGuards(FacebookAuthGuard)
  @Get('facebook/callback')
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  async facebookCallback(
    @Req() req: Request,
    @Res() res: Response,
    @RealIp() ip: string
  ) {
    const oauthProfile = req.user as OAuthProfile;
    const metadata = this.buildMetadata(req, ip);
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    try {
      await this.authService.handleOAuthLogin(oauthProfile, metadata, res, req.hostname);
      res.redirect(frontendUrl);
    } catch {
      res.redirect(`${frontendUrl}/auth/error`);
    }
  }

  @Public()
  @UseGuards(InstagramAuthGuard)
  @Get('instagram')
  @ApiOperation({ summary: 'Initiate Instagram OAuth login' })
  instagramLogin(): void {}

  @Public()
  @UseGuards(InstagramAuthGuard)
  @Get('instagram/callback')
  @ApiOperation({ summary: 'Instagram OAuth callback' })
  async instagramCallback(
    @Req() req: Request,
    @Res() res: Response,
    @RealIp() ip: string
  ) {
    const oauthProfile = req.user as OAuthProfile;
    const metadata = this.buildMetadata(req, ip);
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    try {
      await this.authService.handleOAuthLogin(oauthProfile, metadata, res, req.hostname);
      res.redirect(frontendUrl);
    } catch {
      res.redirect(`${frontendUrl}/auth/error`);
    }
  }

  private buildMetadata(req: Request, ip: string): RequestMetadata {
    const userAgent = req.headers['user-agent'] ?? '';
    const parsed = parseUserAgent(userAgent);

    return {
      ipAddress: ip,
      userAgent,
      browserName: parsed.browserName,
      browserVersion: parsed.browserVersion,
      osName: parsed.osName,
      osVersion: parsed.osVersion,
      deviceType: parsed.deviceType,
      fingerprint: parsed.fingerprint,
    };
  }
}
