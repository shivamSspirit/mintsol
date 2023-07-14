import * as anchor from "@coral-xyz/anchor";
import { createKeypairFromFile } from './utils';
import { Nft } from "../target/types/nft";

import { assert } from "chai";

import {ComputeBudgetProgram, SystemProgram} from '@solana/web3.js'

import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
} from "@solana/spl-token"


import { LAMPORTS_PER_SOL, ParsedAccountData } from "@solana/web3.js";

describe("nft", async () => {

  const testNftTitle = "Chai";
  const testNftSymbol = "Gulab";
  const testNftUri = "";

  const provider = anchor.AnchorProvider.env()
  const wallet = provider.wallet as anchor.Wallet;
  anchor.setProvider(provider);


  const program = anchor.workspace.Nft as anchor.Program<Nft>;

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const mintFungibleAmount = 30 * anchor.web3.LAMPORTS_PER_SOL;

  let associatedTokenAccount = undefined;

  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ 
    units: 1000000 
  });
  
  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ 
    microLamports: 1 
  });



  it("mint fungible token", async () => {
    const mintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    const key = wallet.publicKey;
    const lamports: number = await program.provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

    console.log("kaports", lamports)

    // get ata for a token on a public key

    associatedTokenAccount = await getAssociatedTokenAddress(
      mintKey.publicKey,
      key
    );

    console.log("associatedTokenAccount", associatedTokenAccount)
    // fires a list of list of instruction

    const mint_tx = new anchor.web3.Transaction().add(
      // use anchor to create an account from the key that we created
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: key,
        newAccountPubkey: mintKey.publicKey,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
        lamports,
      }),

      // fire a transaction to create our mint account that is controlled by our anchor wallet(key)

      createInitializeMintInstruction(
        mintKey.publicKey, 0, key, key
      ),

      createAssociatedTokenAccountInstruction(
        key, associatedTokenAccount, key, mintKey.publicKey
      ),

    );
   // send a create transaction
    const res = await anchor.AnchorProvider.env().sendAndConfirm(mint_tx, [mintKey]);

    console.log(
      await program.provider.connection.getParsedAccountInfo(mintKey.publicKey)
    );

    console.log("Account: ", res);
    console.log("Mint key: ", mintKey.publicKey.toString());
    console.log("User: ", key.toString());
    try {
      const tx = await program.methods.mintfungible(new anchor.BN(mintFungibleAmount)).accounts({
        mint: mintKey.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenAccount: associatedTokenAccount,
        payer: key,
      }).rpc();

      console.log("mint fungible token signature", tx);
    } catch (error) {
      console.log("error::", error)
    }

    //  Get minted token amount on the ATA for our anchor wallet
    const minted: Buffer | ParsedAccountData | number = (await program.provider.connection.getParsedAccountInfo(associatedTokenAccount)).value.data;
    const parsedAccountData = minted as ParsedAccountData;
    let tokens: ParsedAccountData | number;
    tokens= parsedAccountData;
    const pops = tokens as ParsedAccountData;
    console.log("minted token amounts",pops.parsed.info.tokenAmount.amount/LAMPORTS_PER_SOL)
    assert.equal(pops.parsed.info.tokenAmount.amount/LAMPORTS_PER_SOL, 30);

  });

  it("Mint!", async () => {

    // Derive the mint address and the associated token account address

    const lamports: number = await program.provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

    const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    const tokenAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: wallet.publicKey
    });
    console.log(`New token: ${mintKeypair.publicKey}`);

    const mint_tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
        lamports,
      }),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        0,
        wallet.publicKey,
        wallet.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        tokenAddress,
        wallet.publicKey,
        mintKeypair.publicKey
      )
    );


    // Derive the metadata and master edition addresses

    const metadataAddress = (await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    ))[0];
    console.log("Metadata initialized");

    const masterEditionAddress = (await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    ))[0];
    console.log("Master edition metadata initialized");

    // Transact with the "mint" function in our on-chain program

    const res = await program.provider.sendAndConfirm(mint_tx, [mintKeypair]);
    console.log(
      await program.provider.connection.getParsedAccountInfo(mintKeypair.publicKey)
    );

    console.log("Account: ", res);
    console.log("Mint key: ", mintKeypair.publicKey.toString());
    console.log("User: ", wallet.publicKey.toString());

    try {
      const tx =  await program.methods.mint(
        mintKeypair.publicKey,
        "https://raw.githubusercontent.com/Coding-and-Crypto/Solana-NFT-Marketplace/master/assets/example.json",
        "Chai nft",
      )
      .accounts({
        // masterEdition: masterEditionAddress,
        // metadata: metadataAddress,
        // mint: mintKeypair.publicKey,
        // tokenAccount: tokenAddress,
        // mintAuthority: wallet.publicKey,
        // tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        mintAuthority: wallet.publicKey,
        mint: mintKeypair.publicKey,
        tokenAccount: tokenAddress,
        tokenProgram: TOKEN_PROGRAM_ID,
        metadata: metadataAddress,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        masterEdition: masterEditionAddress,
      })
      .rpc();

      console.log("tx:mint:",tx)

    } catch (error) {
      console.error("error",error)
    }
  })

})


