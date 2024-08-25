import { AskarModule, AskarWallet } from "@credo-ts/askar";
import { Agent, InitConfig, SigningProviderRegistry, ConsoleLogger, WalletConfig } from "@credo-ts/core";
import { agentDependencies } from "@credo-ts/node";
import { ariesAskar } from "@hyperledger/aries-askar-nodejs";
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class AskarService implements OnModuleInit, OnModuleDestroy{
  private readonly walletConfig: WalletConfig = {
    id: 'vc-api-wallet',
    key: 'vc-api-wallet-0001',
    storage: {
      type: 'sqlite',
      // config: {
      //   inMemory: true,
      // },
    },
  };
  private readonly agent: Agent<{ askar: AskarModule; }>;
  private readonly wallet: AskarWallet;
  private initialized: boolean = false;

  constructor() {
    // Initialize agent and wallet synchronously
    const config: InitConfig = {
      label: 'vc-api-agent',
      walletConfig: this.walletConfig,
    };

    // Create the agent
    this.agent = new Agent({
      config,
      dependencies: agentDependencies,
      modules: {
        askar: new AskarModule({
          ariesAskar,
        }),
      },
    });

    // Create the wallet
    this.wallet = new AskarWallet(
      new ConsoleLogger(),
      new agentDependencies.FileSystem(),
      new SigningProviderRegistry([]),
    );
  }

  async onModuleInit() {
    // This method is called after the module is initialized
    await this.initialize();
  }

  // initializes the askar agent and wallet for operations
  private async initialize() {
    if (!this.agent.isInitialized) {
      await this.agent.initialize();
    }
    await this.wallet.open(this.walletConfig);
    this.initialized = true;
  }

  // Accessor for the agent
  public getAskarAgent(): Agent<{ askar: AskarModule }> {
    if (!this.initialized) {
      throw new Error("AskarConfigService is not initialized yet.");
    }
    return this.agent;
  }

  // Accessor for the wallet
  public getAskarWallet(): AskarWallet {
    if (!this.initialized) {
      throw new Error("AskarConfigService is not initialized yet.");
    }
    return this.wallet;
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
