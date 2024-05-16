import { EventType } from "@ethersproject/abstract-provider";
import { parseUnits } from "@ethersproject/units";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import bitzzaABI from "../abi/BitzzaContract.json";
import config from "../config";
import { getEndTime, getTicketPrice } from "../utils";
import logger from "../utils/logger";

const main = async () => {
    // Get network data from Hardhat config (see hardhat.config.ts).
    const networkName = network.name;
  
    // Get signer to sign the transaction(s).
    const [operator] = await ethers.getSigners();
  
    // Check if the network is supported.
    if (networkName === "testnet" || networkName === "mainnet") {
      // Check if the private key is set (see ethers.js signer).
      if (!process.env.OPERATOR_PRIVATE_KEY) {
        throw new Error("Missing private key (signer).");
      }
  
      try {
        // Bind the smart contract address to the ABI, for a given network.
        const bitzzaContract = await ethers.getContractAt(bitzzaABI, config.Bitzza[networkName]);
  
        // Get network data for running script.
        const [_blockNumber, _gasPrice] = await Promise.all([
          ethers.provider.getBlockNumber(),
          ethers.provider.getGasPrice(),
        ]);

        const cirSupply = await bitzzaContract.getCirculatingSupply(
          { from: operator.address, gasLimit: 300000, gasPrice: _gasPrice.mul(2) }
        );
        
        const supplyDelta = cirSupply.mul(config.rebaseRate).div(config.rebaseDominator);
        const txHash = await bitzzaContract.rebase(
            supplyDelta,
            { from: operator.address, gasLimit: 500000, gasPrice: _gasPrice.mul(2) }
        );
        
        const message = `[${new Date().toISOString()}] network=${networkName} block=${_blockNumber} message='Execute Round' hash=${
          txHash?.hash
        } signer=${operator.address}`;
        console.log(message);
        logger.info({ message });
      } catch (error) {
        const message = `[${new Date().toISOString()}] network=${networkName} message='${error.message}' signer=${
          operator.address
        }`;
        console.error(message);
        logger.error({ message });
      }
    } else {
      const message = `[${new Date().toISOString()}] network=${networkName} message='Unsupported network' signer=${
        operator.address
      }`;
      console.error(message);
      logger.error({ message });
    }
  };
  
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
  