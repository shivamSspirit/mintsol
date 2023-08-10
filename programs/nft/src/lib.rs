use anchor_lang::prelude::*;

pub mod mint;
use mint::*;

declare_id!("H5sYvvHMEVSJb2QEwrhCmxGKsMHuntiWz3bmVfxUcBnt");

#[program]
pub mod nft {
    use super::*;

    pub fn mint(
        ctx: Context<MintNft>,
        creator_key: Pubkey,
        uri: String,
        title: String,
    ) -> Result<()> {
        mint::mint(ctx, creator_key, uri, title)
    }

    pub fn mintfungible(ctx: Context<MintToken>, _amount: u64) -> Result<()> {
        mint::mintfung(ctx, _amount)
    }

}
