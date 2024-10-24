import { IsString, ValidateNested, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WorkflowStepDefinitionDto } from './workflow-step-definition.dto';

export class StepDefinitions {
  [key: string]: WorkflowStepDefinitionDto;
}

export class WorkflowConfigDto {
  @ApiProperty({
    description: 'One or more steps required to complete an exchange on the workflow.',
    type: StepDefinitions
  })
  @ValidateNested()
  @Type(() => StepDefinitions)
  steps: StepDefinitions;

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
    type: WorkflowConfigDto
  })
  @ValidateNested()
  @Type(() => WorkflowConfigDto)
  config: WorkflowConfigDto;
}
