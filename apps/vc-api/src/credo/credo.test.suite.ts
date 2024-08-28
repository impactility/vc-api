import { AskarModule, AskarWallet } from "@credo-ts/askar";
import { Agent, ConsoleLogger, InitConfig, SigningProviderRegistry, WalletConfig } from "@credo-ts/core";
import { agentDependencies } from "@credo-ts/node";
import { ariesAskar } from "@hyperledger/aries-askar-shared";

export interface ICredoTestSuite {
  agent: Agent<{
    askar: AskarModule;
  }>;
  wallet: AskarWallet;
  walletConfig: WalletConfig;
  initialized: boolean;
}
export const credoTestSuite = async () : Promise<ICredoTestSuite> => {
  const config: InitConfig = {
    label: 'wallet-test-askar',
    walletConfig: {
      id: 'wallet-test',
      key: 'testkey0000000000000000000000000',
      storage: {
        type: 'sqlite',
      },
    },
  }
  
  // create agent - here Aries Askar
  let agent = new Agent({
    config,
    dependencies: agentDependencies,
    modules: {
      // Register the Askar module on the agent
      askar: new AskarModule({
        ariesAskar,
      }),
    },
  });
  let wallet = new AskarWallet(
    new ConsoleLogger(),
    new agentDependencies.FileSystem(),
    new SigningProviderRegistry([]),
  );
  await agent.initialize();
  await wallet.open(config.walletConfig);

  return { 
    agent: agent,
    wallet: wallet,
    walletConfig: config.walletConfig,
    initialized: true,
  };
}