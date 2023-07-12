use anchor_lang::prelude::*;

pub mod mint;
pub mod sell;
pub mod swap;

use mint::*;
use sell::*;
use swap::*;

declare_id!("9J5CCPzaZCsSmDomSUXB6uPU5zPhUoJx1cuGPCfoVPNz");

#[program]
pub mod nft {
    use super::*;

    pub fn mint(
        ctx: Context<MintNft>,
        creator_key: Pubkey,
        metadata_title: String,
        metadata_symbol: String,
        metadata_uri: String,
    ) -> Result<()> {
        mint::mint(ctx, creator_key, metadata_title, metadata_symbol, metadata_uri)
    }

    pub fn mintfungible(ctx: Context<MintToken>, _amount: u64) -> Result<()> {
        mint::mintfung(ctx, _amount)
    }

    pub fn initialize_token_swap_account(ctx: Context<InitializeTokenSwapAccount>) -> Result<()>{
        swap::initialize_token_swap_account(ctx)
    }

    pub fn initialize_mint_accounts(ctx: Context<InitializeMintAccounts>)-> Result<()>{
        swap::initialize_mint_accounts(ctx)
    }

    pub fn initialize_token_accounts(ctx: Context<InitializeTokenAccounts>) -> Result<()> {
        swap::initialize_token_accounts(ctx)
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, _amount: u64) -> Result<()> {
        swap::mint_tokens(ctx, _amount)
    }

    pub fn initialize_pool_accounts(ctx: Context<InitializePoolAccounts>) -> Result<()> {
        swap::initialize_pool_accounts(ctx)
    }

    pub fn initialize_swap_pool(ctx: Context<InitializeSwapPool>, bump:u8) -> Result<()> {
        swap::initialize_swap_pool(ctx, bump)
    }

    pub fn do_swap(ctx: Context<Swap>, amount_in:u64) -> Result<()> {
        swap::do_swap(ctx, amount_in)
    }

    pub fn sell(ctx: Context<SellNft>, sale_lamports: u64) -> Result<()> {
        sell::sell(ctx, sale_lamports)
    }


}
