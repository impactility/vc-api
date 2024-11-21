import { ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkflowEntity } from './entities/workflow.entity';
import { Repository } from 'typeorm';
import { CreateWorkflowRequestDto } from './dtos/create-workflow-request.dto';
import { CreateExchangeDto } from './dtos/create-exchange.dto';
import { CreateExchangeSuccessDto } from './dtos/create-exchange-success.dto';
import { ExchangeEntity } from './entities/exchange.entity';
import { CreateWorkflowSuccessDto } from './dtos/create-workflow-success.dto';
import { ExchangeState } from './types/exchange-status';
import { ExchangeStateDto } from './dtos/exchange-state.dto';
import { VerifiablePresentationDto } from '../credentials/dtos/verifiable-presentation.dto';
import { VerifiablePresentation } from './types/verifiable-presentation';
import { VpSubmissionVerifierService } from './vp-submission-verifier.service';
import { ExchangeResponseDto } from './dtos/exchange-response.dto';

export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name, { timestamp: true });
  
  constructor(
    private vpSubmissionVerifierService: VpSubmissionVerifierService,
    @InjectRepository(WorkflowEntity)
    private workflowRepository: Repository<WorkflowEntity>,
    @InjectRepository(ExchangeEntity)
    private exchangeRepository: Repository<ExchangeEntity>
  ) {}

  public async createWorkflow(createWorkflowRequestDto: CreateWorkflowRequestDto): Promise<CreateWorkflowSuccessDto> {
    if (await this.workflowRepository.findOneBy({ workflowId: createWorkflowRequestDto.config.id })) {
      throw new ConflictException(`workflowId='${createWorkflowRequestDto.config.id}' already exists`);
    }
    const workflow = new WorkflowEntity(createWorkflowRequestDto.config);
    await this.workflowRepository.save(workflow);
    createWorkflowRequestDto.config.id = workflow.workflowId;
    return createWorkflowRequestDto;
  }

  public async getWorkflow(localWorkflowId: string): Promise<CreateWorkflowSuccessDto> {
    const workflow = await this.workflowRepository.findOneBy({ workflowId: localWorkflowId });
    if (workflow == null) {
      throw new NotFoundException(`workflowId='${localWorkflowId}' does not exist`); 
    }
    const workflowResponse : CreateWorkflowSuccessDto = {
      config: {
        steps: workflow.workflowSteps,
        initialStep: workflow.initialStep,
        id: workflow.workflowId
      }
    };
    return workflowResponse;
  }

  public async createExchange(
    localWorkflowId: string,
    createExchangeDto?: CreateExchangeDto
  ): Promise<CreateExchangeSuccessDto> {
    const workflow = await this.workflowRepository.findOneBy({ workflowId: localWorkflowId });
    if (workflow == null) {
      throw new NotFoundException(`workflowId='${localWorkflowId}' does not exist`); 
    }
    const firstStep = workflow.getInitialStep();
    const exchange = new ExchangeEntity(localWorkflowId, firstStep, workflow.initialStep);
    await this.exchangeRepository.save(exchange);
    return {
      exchangeId: exchange.exchangeId,
      step: workflow.initialStep,
      state: exchange.state,
    };
  }

  public async getExchangeState(
    localWorkflowId: string,
    localExchangeId: string
  ): Promise<ExchangeStateDto> {
    const exchange = await this.exchangeRepository.findOneBy(
      { workflowId: localWorkflowId, exchangeId: localExchangeId }
    );
    if (exchange == null) {
      throw new NotFoundException(`exchangeId='${localExchangeId}' does not exist`);
    }
    return {
      exchangeId: localExchangeId,
      state: exchange.state
    }
  }

  public async participateInExchange(
    localWorkflowId: string,
    localExchangeId: string,
    presentation: VerifiablePresentationDto
  ): Promise<ExchangeResponseDto> {
    const exchange = await this.exchangeRepository.findOneBy(
      { workflowId: localWorkflowId, exchangeId: localExchangeId }
    );
    if (exchange == null) {
      throw new NotFoundException(`exchangeId='${localExchangeId}' does not exist`);
    }

    const workflow = await this.workflowRepository.findOneBy({ workflowId: localWorkflowId });
    if (workflow == null) {
      throw new NotFoundException(`workflowId='${localWorkflowId}' does not exist`); 
    }
    const currentStep = exchange.getCurrentStep();
    const [nextStepDefinition, nextStepId] = workflow.getNextStep(currentStep.stepId);

    const exchangeRepsonse = await exchange.participateInExchange(
      presentation,
      this.vpSubmissionVerifierService,
      nextStepDefinition,
      nextStepId
    )
    return exchangeRepsonse.response;
  }

}
