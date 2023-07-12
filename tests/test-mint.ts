import * as anchor from "@coral-xyz/anchor";
import { createKeypairFromFile } from './utils';
import { Nft } from "../target/types/nft";

import { assert } from "chai";

import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
} from "@solana/spl-token"



describe("nft", async () => {

  const testNftTitle = "Chai";
  const testNftSymbol = "Gulab";
  const testNftUri = "https://github.com/Coding-and-Crypto/Rust-Solana-Tutorial/blob/master/nfts/mint-nft/assets/example.json";

  const provider = anchor.AnchorProvider.env()
  const wallet = provider.wallet as anchor.Wallet;
  anchor.setProvider(provider);

  // ** Un-comment this to use solpg imported IDL **
  // const program = new anchor.Program(
  //   require("../solpg/idl.json"), 
  //   new anchor.web3.PublicKey("H2UJjAQTuVJYhaBhh6GD2KaprLBTp1vhP2aaHioya5NM"),
  // );
  // ** Comment this to use solpg imported IDL **
  const program = anchor.workspace.Nft as anchor.Program<Nft>;

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const mintFungibleAmount = 1 * anchor.web3.LAMPORTS_PER_SOL;


  let associatedTokenAccount = undefined;

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

  //   // fire a transaction to create our mint account that is controlled by our anchor wallet(key)

    createInitializeMintInstruction(
      mintKey.publicKey, 0, key, key
    ),

      createAssociatedTokenAccountInstruction(
        key, associatedTokenAccount, key, mintKey.publicKey
      ),

     );
  //   // send a create transaction

  //  const res = await anchor.AnchorProvider.wallet.sendAndConfirm(mint_tx,[mintKey]);


    const tx = await program.methods.mintfungible(new anchor.BN(mintFungibleAmount)).accounts({
      mint: mintKey.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenAccount: associatedTokenAccount,
      payer: key,
    }).signers([]).rpc();

    console.log("mint fungible token signature", tx);
  //   const minted = (await program.provider.connection.getParsedAccountInfo(associatedTokenAccount)).value;
  //   console.log("minted", minted);
  //   //  assert.equal(minted, 30);

   });

  it("Mint!", async () => {

    // Derive the mint address and the associated token account address

    const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    const tokenAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: wallet.publicKey
    });
    console.log(`New token: ${mintKeypair.publicKey}`);

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
    
    try {
      const tx =  await program.methods.mint(
      mintKeypair.publicKey,  testNftTitle, testNftSymbol, testNftUri
      )
      .accounts({
        masterEdition: masterEditionAddress,
        metadata: metadataAddress,
        mint: mintKeypair.publicKey,
        tokenAccount: tokenAddress,
        mintAuthority: wallet.publicKey,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([mintKeypair])
      .rpc({
        skipPreflight: true,
      });

    } catch (error) {
      console.error("error",error)
    }
  })

})


