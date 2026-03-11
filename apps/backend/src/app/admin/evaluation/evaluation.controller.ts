import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Sse,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequireCapability } from '../../../core/decorators/require-capability.decorator';
import { CAPABILITIES } from '@org/types/authorization';
import type { Observable } from 'rxjs';
import { EvaluationJobQueryDTO } from './dto/index';
import { EvaluationSseService } from './evaluation-sse.service';
import { EvaluationService } from './evaluation.service';

@ApiTags('Admin - Evaluation Jobs')
@Controller('admin/evaluation-jobs')
export class EvaluationController {
  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly evaluationSseService: EvaluationSseService
  ) {}

  @Post('query')
  @RequireCapability(CAPABILITIES.CUSTOMER_GROUPS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get paginated list of evaluation jobs' })
  async getEvaluationJobs(@Body() query: EvaluationJobQueryDTO) {
    // return this.evaluationService.getEvaluationJobs(query);
  }

  @Get(':id')
  @RequireCapability(CAPABILITIES.CUSTOMER_GROUPS_READ)
  @ApiOperation({ summary: 'Get evaluation job by ID' })
  @ApiParam({ name: 'id', description: 'Evaluation Job ID' })
  async getEvaluationJobById(@Param('id') id: string) {
    return this.evaluationService.getJobById(id);
  }

  @Post(':id/cancel')
  @RequireCapability(CAPABILITIES.CUSTOMER_GROUPS_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending evaluation job' })
  @ApiParam({ name: 'id', description: 'Evaluation Job ID' })
  async cancelEvaluationJob(@Param('id') id: string) {
    return this.evaluationService.cancelJob(id);
  }

  @Get('entity/:entityType/:entityId')
  @RequireCapability(CAPABILITIES.CUSTOMER_GROUPS_READ)
  @ApiOperation({ summary: 'Get evaluation history for an entity' })
  @ApiParam({
    name: 'entityType',
    description: 'Entity type (e.g. CustomerGroup)',
  })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  async getEntityEvaluationHistory(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string
  ) {
    return this.evaluationService.getEntityHistory(entityType, entityId);
  }

  @Sse(':id/stream')
  @RequireCapability(CAPABILITIES.CUSTOMER_GROUPS_READ)
  @ApiOperation({ summary: 'Stream real-time evaluation job status' })
  @ApiParam({ name: 'id', description: 'Evaluation Job ID' })
  streamJob(@Param('id') id: string): Observable<MessageEvent> {
    return this.evaluationSseService.streamForJob(id);
  }

  @Sse('entity/:entityType/:entityId/stream')
  @RequireCapability(CAPABILITIES.CUSTOMER_GROUPS_READ)
  @ApiOperation({ summary: 'Stream real-time evaluation events for an entity' })
  @ApiParam({ name: 'entityType', description: 'Entity type' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  streamEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string
  ): Observable<MessageEvent> {
    return this.evaluationSseService.streamForEntity(entityType, entityId);
  }
}
