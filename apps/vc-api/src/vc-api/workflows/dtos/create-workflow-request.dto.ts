import { IsString, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WorkflowStepDto } from './workflow-step.dto';

export class Steps {
  [key: string]: WorkflowStepDto;
}

export class WorkflowConfig {
  @ApiProperty({
    description: 'One or more steps required to complete an exchange on the workflow.',
    type: Steps
  })
  @ValidateNested()
  @Type(() => Steps)
  steps: Steps;

  @ApiProperty({
    description: 'The initial step of the workflow.'
  })
  @IsString()
  initialStep: string;

  @ApiProperty({
    description: 'The ID that will be used for the created workflow. Passing an ID is OPTIONAL.'
  })
  @IsString()
  @IsOptional()
  id: string;
}

export class CreateWorkflowRequestDto {
  @ApiProperty({
    description: 'Configuration for a workflow',
    type: WorkflowConfig
  })
  @ValidateNested()
  @Type(() => WorkflowConfig)
  config: WorkflowConfig;
}
