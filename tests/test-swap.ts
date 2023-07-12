import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Nft } from "../target/types/nft";
import { assert } from "chai";
import { TOKEN_SWAP_PROGRAM_ID } from "@solana/spl-token-swap";
import * as splToken from "@solana/spl-token";
import {
    createKeypairFromFile,
} from './utils';
import { Commitment, Keypair, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";


describe("this will swap", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Nft as anchor.Program<Nft>;

    const owner = provider.wallet.publicKey;
    const signer = provider.wallet;


    const mintAuthority = anchor.web3.Keypair.generate();

    const tokenSwapStateAccount = anchor.web3.Keypair.generate();

    let x_mint;
    let y_mint;
    let token_x_account;
    let token_y_account;

    let pool_token_mint;
    let swapAuthority;
    let bump;

    let pool_token_fee;
    let pool_token_account;

    it("Initialize token swap account", async () => {
        const tx = await program.methods
            .initialize_token_swap_account()
            .accounts({
                signer: owner,
                tokenSwapAccount: tokenSwapStateAccount.publicKey,
                tokenSwapProgram: TOKEN_SWAP_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([tokenSwapStateAccount])
            .rpc();
        console.log(
            "Token Swap State Account :: " +
            tokenSwapStateAccount.publicKey.toString()
        );
        // const commitment: Commitment = "confirmed";
        const tokenSwapAccountInfo = await provider.connection.getAccountInfo(
            tokenSwapStateAccount.publicKey
        );
        assert.equal(
            tokenSwapAccountInfo.owner.toString(),
            TOKEN_SWAP_PROGRAM_ID.toString()
        );
    });


    it("Initialize Mint Accounts", async () => {
        x_mint = anchor.web3.Keypair.generate();
        y_mint = anchor.web3.Keypair.generate();
        console.log("Mint Authority :: " + mintAuthority.publicKey.toString());
        console.log("x_mint :: " + x_mint.publicKey.toString());
        console.log("y_mint :: " + y_mint.publicKey.toString());
        const tx = await program.methods
            .initialize_mint_accounts()
            .accounts({
                signer: owner,
                mintAuthority: mintAuthority.publicKey,
                xMint: x_mint.publicKey,
                yMint: y_mint.publicKey,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([x_mint, y_mint])
            .rpc();

    });

    it("Initialize swap pool Authority (PDA), and Token Accounts", async () => {
        [swapAuthority, bump] = await anchor.web3.PublicKey.findProgramAddress(
            [tokenSwapStateAccount.publicKey.toBuffer()],
            TOKEN_SWAP_PROGRAM_ID
        );
        console.log("Swap Pool Authority :: " + swapAuthority.toString());

        token_x_account = anchor.web3.Keypair.generate(); // add ata of this
       // await splToken.getAssociatedTokenAddress
        console.log(`token_x_account :: `, token_x_account.publicKey.toString());

        token_y_account = anchor.web3.Keypair.generate();
        console.log(`token_y_account :: `, token_y_account.publicKey.toString());

        const tx = await program.methods
            .initialize_token_accounts()
            .accounts({
                signer: owner,
                tokenAuthority: swapAuthority,
                xMint: x_mint.publicKey,
                yMint: y_mint.publicKey,
                tokenXAccount: token_x_account.publicKey,
                tokenYAccount: token_y_account.publicKey,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([token_x_account, token_y_account])
            .rpc();
    });


    it("Mint Tokens to Token Accounts", async () => {
        const tx = await program.methods
            .mint_tokens(new anchor.BN(100))
            .accounts({
                mintAuthority: mintAuthority.publicKey,
                mintAccount: x_mint.publicKey,
                tokenAccount: token_x_account.publicKey,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
            })
            .signers([mintAuthority])
            .rpc();
        const token_x_account_info = await splToken.getAccount(
            provider.connection,
            token_x_account.publicKey
        );
        console.log(
            "token_x_account balance :: " + token_x_account_info.amount.toString()
        );

        const txn = await program.methods
            .mintTokens(new anchor.BN(200))
            .accounts({
                mintAuthority: mintAuthority.publicKey,
                mintAccount: y_mint.publicKey,
                tokenAccount: token_y_account.publicKey,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
            })
            .signers([mintAuthority])
            .rpc();
        const token_y_account_info = await splToken.getAccount(
            provider.connection,
            token_y_account.publicKey
        );
        console.log(
            "token_y_account balance :: " + token_y_account_info.amount.toString()
        );
    });


    it("Initialize pool account", async () => {
        const tx = await program.methods
            .initialize_pool_accounts()
            .accounts({
                signer: owner,
                mintAuthority: tokenSwapStateAccount.publicKey,
                pool_token_fee: pool_token_fee,
                pool_token_mint: pool_token_mint,
                pool_token_account: pool_token_account,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([pool_token_mint])
            .rpc();
        console.log(
            "Token Swap State Account :: " +
            tokenSwapStateAccount.publicKey.toString()
        );
        // const commitment: Commitment = "confirmed";
        const tokenSwapAccountInfo = await provider.connection.getAccountInfo(
            tokenSwapStateAccount.publicKey
        );


    });



    it("Initialize swap pool", async () => {
        const tx = await program.methods
            .initialize_swap_pool()
            .accounts({
                tokenSwapStateAccount: tokenSwapStateAccount.publicKey,
                tokenProgram: TOKEN_SWAP_PROGRAM_ID,
                swapAuthority: swapAuthority,
                mintAuthority: mintAuthority.publicKey,

                pool_token_fee: pool_token_fee,
                pool_token_mint: pool_token_mint,

                pool_token_account: pool_token_account,
               
                tokenXAccount: token_x_account.publicKey,
                tokenYAccount: token_y_account.publicKey,

                tokenSwapAccount: tokenSwapStateAccount.publicKey,
            })
            .signers([swapAuthority])
            .rpc();
        console.log(
            "Token Swap State Account :: " +
            tokenSwapStateAccount.publicKey.toString()
        );
        // const commitment: Commitment = "confirmed";
        const tokenSwapAccountInfo = await provider.connection.getAccountInfo(
            tokenSwapStateAccount.publicKey
        );


    });



    it("it execute swap", async () => {
        const tx = await program.methods
            .do_swap(new anchor.BN(50))
            .accounts({
                tokenSwapStateAccount:tokenSwapStateAccount.publicKey,
                token_program: TOKEN_SWAP_PROGRAM_ID,
                swapPubkey: swapAuthority,
                authorityPubkey: mintAuthority.publicKey,
                userTransferAuthorityPubkey:swapAuthority,
                xMint: x_mint,
                tokenXAccount: token_x_account.publicKey,
                yMint: y_mint,
                tokenYAccount: token_y_account.publicKey,

                poolTokenMint: pool_token_mint,
                poolTokenFee: pool_token_fee,

            })
            .signers([swapAuthority])
            .rpc();
        console.log(
            "Token Swap State Account :: " +
            tokenSwapStateAccount.publicKey.toString()
        );
        // const commitment: Commitment = "confirmed";
        const tokenSwapAccountInfo = await provider.connection.getAccountInfo(
            tokenSwapStateAccount.publicKey
        );


    });    


})