// Import necessary modules and libraries

import * as anchor from "@coral-xyz/anchor";
import { Nft } from "../target/types/nft";
import { assert } from "chai";
import { SystemProgram } from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
} from "@solana/spl-token"
import { LAMPORTS_PER_SOL, ParsedAccountData } from "@solana/web3.js";


// Start the test suite with a describe block

describe("nft", async () => {
  // Set up the AnchorProvider and wallet
  const provider = anchor.AnchorProvider.env()
  const wallet = provider.wallet as anchor.Wallet;
  anchor.setProvider(provider);

  // Get the NFT program from the Anchor workspace
  const program = anchor.workspace.Nft as anchor.Program<Nft>;
  // Define the address of the TOKEN_METADATA_PROGRAM_ID
  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );
  // Set the amount for minting fungible tokens
  const mintFungibleAmount = 30 * anchor.web3.LAMPORTS_PER_SOL;
  // Declare a variable for the associated token account
  let associatedTokenAccount = undefined;

  // First test case: Mint fungible token
  it("mint fungible token", async () => {
    // Generate a new keypair for the mint
    const mintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    const key = wallet.publicKey;
    // Get the required lamports for rent exemption
    const lamports: number = await program.provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

    // get ata for a token on a mint for user wallet
    associatedTokenAccount = await getAssociatedTokenAddress(
      mintKey.publicKey,
      key
    );

    console.log("associatedTokenAccount", associatedTokenAccount)
    // fires a list of list of instruction

    // Create a transaction to initialize the mint and associated token account

    const mint_tx = new anchor.web3.Transaction().add(
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
    // Send and confirm the mint transaction
    const res = await anchor.AnchorProvider.env().sendAndConfirm(mint_tx, [mintKey]);

    console.log(
      await program.provider.connection.getParsedAccountInfo(mintKey.publicKey)
    );

    console.log("Account: ", res);
    console.log("Mint key: ", mintKey.publicKey.toString());
    console.log("User: ", key.toString());
    try {
      // Call the "mintfungible" function in the NFT program
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


    // Get the minted token amount on the associated token account
    const minted: Buffer | ParsedAccountData | number = (await program.provider.connection.getParsedAccountInfo(associatedTokenAccount)).value.data;
    const parsedAccountData = minted as ParsedAccountData;
    let tokens: ParsedAccountData | number;
    tokens = parsedAccountData;
    const pops = tokens as ParsedAccountData;
    console.log("minted token amounts", pops.parsed.info.tokenAmount.amount / LAMPORTS_PER_SOL)
    assert.equal(pops.parsed.info.tokenAmount.amount / LAMPORTS_PER_SOL, 30);

  });


  // Second test case: Mint NFT
  it("Mint!", async () => {

    // Generate a new keypair for the mint

    const lamports: number = await program.provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

    const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();

    const tokenAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: wallet.publicKey
    });
    
    console.log(`New token: ${mintKeypair.publicKey}`);


    // Create a transaction to initialize the mint and associated token account
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
    // Create a transaction to mint the NFT using the "mint" function in the NFT program
    try {
      const tx = await program.methods.mint(
        mintKeypair.publicKey,
        "https://raw.githubusercontent.com/Coding-and-Crypto/Solana-NFT-Marketplace/master/assets/example.json",
        "Chai nft",
      )
        .accounts({
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

      console.log("tx:mint:", tx)

    } catch (error) {
      console.error("error", error)
    }
  })

})


