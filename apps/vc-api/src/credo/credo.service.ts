import { AskarModule, AskarWallet } from '@credo-ts/askar';
import { Agent, InitConfig, SigningProviderRegistry, ConsoleLogger, WalletConfig } from '@credo-ts/core';
import { agentDependencies } from '@credo-ts/node';
import { ariesAskar } from '@hyperledger/aries-askar-nodejs';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class CredoService implements OnModuleInit, OnModuleDestroy {
  private readonly walletConfig: WalletConfig = {
    id: process.env['ASKAR_WALLET_ID'],
    key: process.env['ASKAR_WALLET_KEY'],
    storage: {
      type: process.env['ASKAR_WALLET_DB_TYPE']
    }
  };
  private readonly askarAgent: Agent<{ askar: AskarModule }>;
  private readonly askarWallet: AskarWallet;
  private initialized = false;

  constructor() {
    // Initialize agent and wallet synchronously
    const config: InitConfig = {
      label: process.env['ASKAR_LABEL'],
      walletConfig: this.walletConfig
    };

    // Create the agent
    this.askarAgent = new Agent({
      config,
      dependencies: agentDependencies,
      modules: {
        askar: new AskarModule({
          ariesAskar
        })
      }
    });

    // Create the wallet
    this.askarWallet = new AskarWallet(
      new ConsoleLogger(),
      new agentDependencies.FileSystem(),
      new SigningProviderRegistry([])
    );
  }

  async onModuleInit() {
    // This method is called after the module is initialized
    await this.initialize();
  }

  // initializes the askar agent and wallet for operations
  private async initialize() {
    if (!this.askarAgent.isInitialized) {
      await this.askarAgent.initialize();
    }
    await this.askarWallet.open(this.walletConfig);
    this.initialized = true;
  }

  // Accessor for the agent
  public get agent(): Agent<{ askar: AskarModule }> {
    if (!this.initialized) {
      throw new Error('Credo Agent is not initialized yet.');
    }
    return this.askarAgent;
  }

  // Accessor for the wallet
  public get wallet(): AskarWallet {
    if (!this.initialized) {
      throw new Error('Credo wallet is not initialized yet.');
    }
    return this.askarWallet;
  }

  async onModuleDestroy() {
    // This will be called when the module is destroyed
    await this.cleanup();
  }

  private async cleanup() {
    if (this.agent.isInitialized) {
      // close askar agent connection
      await this.agent.wallet.close();
      await this.agent.shutdown();
    }
  }
}
