import { ApiProperty } from '@nestjs/swagger';
import { VerifiableCredentialDto } from './verifiable-credential.dto';
import { IsArray, IsOptional } from 'class-validator';

export class CreatePresentationDto {
  @IsArray()
  @ApiProperty({ description: 'Verifiable credentials', type: VerifiableCredentialDto, isArray: true })
  credentials: VerifiableCredentialDto[];

  @IsOptional()
  @ApiProperty()
  id?: string;

  @IsOptional()
  @ApiProperty()
  holder?: string;
}
