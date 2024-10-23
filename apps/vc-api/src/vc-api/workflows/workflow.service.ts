import { ConflictException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { WorkflowEntity } from "./entities/workflow.entity";
import { Repository } from "typeorm";
import { CreateWorkflowRequestDto } from "./dtos/create-workflow-request.dto";

export class WorkflowService {
    private readonly logger = new Logger(WorkflowService.name, { timestamp: true });

    constructor(
        @InjectRepository(WorkflowEntity)
        private workflowRepository: Repository<WorkflowEntity>,
    ) {}

    public async createWorkflow(createWorkflowRequestDto: CreateWorkflowRequestDto): Promise<string> {
        if (await this.workflowRepository.findOneBy({ workflowId: createWorkflowRequestDto.config.id })) {
            throw new ConflictException(`exchangeId='${createWorkflowRequestDto.config.id}' already exists`);
          }
      
          const workflow = new WorkflowEntity(createWorkflowRequestDto.config);
          await this.workflowRepository.save(workflow);
          return workflow.workflowId;
    }
}