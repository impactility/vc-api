import { ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkflowEntity } from './entities/workflow.entity';
import { Repository } from 'typeorm';
import { CreateWorkflowRequestDto } from './dtos/create-workflow-request.dto';
import { CreateExchangeDto } from './dtos/create-exchange.dto';
import { CreateExchangeSuccessDto } from './dtos/create-exchange-success.dto';
import { ExchangeEntity } from './entities/exchange.entity';

export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name, { timestamp: true });

  constructor(
    @InjectRepository(WorkflowEntity)
    private workflowRepository: Repository<WorkflowEntity>,
    @InjectRepository(ExchangeEntity)
    private exchangeRepository: Repository<ExchangeEntity>
  ) {}

  public async createWorkflow(createWorkflowRequestDto: CreateWorkflowRequestDto): Promise<string> {
    if (await this.workflowRepository.findOneBy({ workflowId: createWorkflowRequestDto.config.id })) {
      throw new ConflictException(`workflowId='${createWorkflowRequestDto.config.id}' already exists`);
    }

    const workflow = new WorkflowEntity(createWorkflowRequestDto.config);
    await this.workflowRepository.save(workflow);
    return workflow.workflowId;
  }

  public async createExchange(
    localWorkflowId: string,
    createExchangeDto: CreateExchangeDto
  ): Promise<CreateExchangeSuccessDto> {
    // TODO: handle case where workflow isn't found
    const workflow = await this.workflowRepository.findOneBy({ workflowId: localWorkflowId });
    const firstStep = workflow.getInitialStep();
    const exchange = new ExchangeEntity(localWorkflowId, firstStep, workflow.initialStep);
    await this.exchangeRepository.save(exchange);
    return undefined; // TODO: construct correct return object
  }
}
