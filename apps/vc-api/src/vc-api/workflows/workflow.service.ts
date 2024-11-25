import { BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkflowEntity } from './entities/workflow.entity';
import { Repository } from 'typeorm';
import { CreateWorkflowRequestDto } from './dtos/create-workflow-request.dto';
import { CreateExchangeDto } from './dtos/create-exchange.dto';
import { CreateExchangeSuccessDto } from './dtos/create-exchange-success.dto';
import { WfExchangeEntity } from './entities/wf-exchange.entity';
import { CreateWorkflowSuccessDto } from './dtos/create-workflow-success.dto';
import { ExchangeStateDto } from './dtos/exchange-state.dto';
import { VerifiablePresentationDto } from '../credentials/dtos/verifiable-presentation.dto';
import { VpSubmissionVerifierService } from './vp-submission-verifier.service';
import { ExchangeResponseDto } from './dtos/exchange-response.dto';
import { CallbackDto } from './dtos/callback.dto';
import { HttpService } from '@nestjs/axios';
import { validate } from 'class-validator';
import { ConfigService } from '@nestjs/config';

export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name, { timestamp: true });

  constructor(
    private vpSubmissionVerifierService: VpSubmissionVerifierService,
    @InjectRepository(WorkflowEntity)
    private workflowRepository: Repository<WorkflowEntity>,
    @InjectRepository(WfExchangeEntity)
    private exchangeRepository: Repository<WfExchangeEntity>,
    private httpService: HttpService,
    private configService: ConfigService
  ) {}

  public async createWorkflow(
    createWorkflowRequestDto: CreateWorkflowRequestDto
  ): Promise<CreateWorkflowSuccessDto> {
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
    const workflowResponse: CreateWorkflowSuccessDto = {
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
    const exchange = new WfExchangeEntity(localWorkflowId, firstStep, workflow.initialStep);
    await this.exchangeRepository.save(exchange);
    const baseUrl = this.configService.get('BASE_URL');
    const localExchangeId = exchange.exchangeId;
    const removeTrailingSlash = (str) => (str.endsWith('/') ? str.slice(0, -1) : str);
    const exchangeId = `${removeTrailingSlash(
      baseUrl
    )}/workflows/${localWorkflowId}/exchanges/${localExchangeId}`;
    return {
      exchangeId: exchangeId,
      step: workflow.initialStep,
      state: exchange.state
    };
  }

  public async getExchangeState(localWorkflowId: string, localExchangeId: string): Promise<ExchangeStateDto> {
    const exchange = await this.exchangeRepository.findOneBy({
      workflowId: localWorkflowId,
      exchangeId: localExchangeId
    });
    if (exchange == null) {
      throw new NotFoundException(`exchangeId='${localExchangeId}' does not exist`);
    }
    return {
      exchangeId: localExchangeId,
      state: exchange.state
    };
  }

  public async participateInExchange(
    localWorkflowId: string,
    localExchangeId: string,
    presentation: VerifiablePresentationDto
  ): Promise<ExchangeResponseDto> {
    const exchange = await this.exchangeRepository.findOneBy({
      workflowId: localWorkflowId,
      exchangeId: localExchangeId
    });
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
    );

    if (exchangeRepsonse.errors.length > 0) {
      throw new BadRequestException(exchangeRepsonse.errors);
    }

    await this.exchangeRepository.save(exchange);
    const stepResult = exchange.getStep(currentStep.stepId);
    const body = CallbackDto.toDto(stepResult);

    const validationErrors = await validate(body, {
      whitelist: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: false // here we want properties not defined in the CallbackDto to be just stripped out and not sent to a callback endpoint
    });

    if (validationErrors.length > 0) {
      this.logger.error('\n' + validationErrors.map((e) => e.toString()).join('\n\n'));
      throw new Error(validationErrors.toString());
    }

    Promise.all(
      stepResult.callback?.map(async (callback) => {
        try {
          await this.httpService.axiosRef.post(callback.url, body);
          this.logger.log(`callback submitted: ${callback.url}`);
        } catch (err) {
          this.logger.error(`error calling callback (${callback.url}): ${err}`);
        }
      })
    ).catch((err) => this.logger.error(err));
    // TODO: decide how to change logic here to handle callback error
    return exchangeRepsonse.response;
  }
}
