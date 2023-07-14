
import * as anchor from "@coral-xyz/anchor";
import {
    createKeypairFromFile,
  } from './utils';
import { Nft } from "../target/types/nft";
  
  
  describe("sell-nft", async () => {
    
  
    const provider = anchor.AnchorProvider.env()
    const wallet = provider.wallet as anchor.Wallet;
    anchor.setProvider(provider);
  
    const program = anchor.workspace.Nft as anchor.Program<Nft>;
  
  
    it("Sell!", async () => {
  
      // Testing constants
  
      const saleAmount = 1 * anchor.web3.LAMPORTS_PER_SOL;

      // previous minted nft mint address
      const mint: anchor.web3.PublicKey = new anchor.web3.PublicKey(
        "vAbAEzodNSRgR4Bwo2rFvpxjbqhDeFn2UkB7kbRP2Pi"
      );
      const buyer: anchor.web3.Keypair = await createKeypairFromFile(__dirname + "/keypairs/chaibuyer.json");
      console.log(`Buyer public key: ${buyer.publicKey}`);
  
      // Derive the associated token account address for owner & buyer
  
      const ownerTokenAddress = await anchor.utils.token.associatedAddress({
        mint: mint,
        owner: wallet.publicKey
      });
      const buyerTokenAddress = await anchor.utils.token.associatedAddress({
        mint: mint,
        owner: buyer.publicKey,
      });
      console.log(`Request to sell NFT: ${mint} for ${saleAmount} lamports.`);
      console.log(`Owner's Token Address: ${ownerTokenAddress}`);
      console.log(`Buyer's Token Address: ${buyerTokenAddress}`);
  
      // Transact with the "sell" function in our on-chain program
      
      await program.methods.sell(
        new anchor.BN(saleAmount)
      )
      .accounts({
        mint: mint,
        ownerTokenAccount: ownerTokenAddress,
        ownerAuthority: wallet.publicKey,
        buyerTokenAccount: buyerTokenAddress,
        buyerAuthority: buyer.publicKey,
      })
      .signers([buyer])
      .rpc();
    });
  });