/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { TypeOrmModule } from '@nestjs/typeorm';
import { homedir } from 'os';

/**
 * Inspired by https://dev.to/webeleon/unit-testing-nestjs-with-typeorm-in-memory-l6m
 * @param inMemory // default set to false; set to true for unit testing  
 */
export const TypeOrmSQLiteModule = (inMemory=false) =>
  TypeOrmModule.forRoot({
    type: 'sqlite',
    database: !inMemory ? 
      `${homedir}/.afj/data/wallet/${process.env['ASKAR_WALLET_ID']}/sqlite.db` // path to askar wallet db
      : ':memory:',
    // dropSchema: true, // disabling this option to avoid dropping askar tables
    autoLoadEntities: true, // https://docs.nestjs.com/techniques/database#auto-load-entities
    // synchronize: true, // disabling this option to avoid losing existing data
    keepConnectionAlive: true // https://github.com/nestjs/typeorm/issues/61
  });
