/* Format values with commas */
export const numberWithCommas = x => x.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/* Calculate VIT power, formula taken from condenser */
export const vestingSteem = (account, gprops) => {
    const vests = parseFloat(account.vesting_shares.split(' ')[0]);
    const total_vests = parseFloat(gprops.total_vesting_shares.split(' ')[0]);
    const total_vest_steem = parseFloat(
        gprops.total_vesting_fund_steem.split(' ')[0]
    );
    const vesting_steemf = total_vest_steem * (vests / total_vests);
    return vesting_steemf;
}

export const renameProp = (
    oldProp,
    newProp,
    { [oldProp]: old, ...others }
  ) => ({
    ...others,
    [newProp]: old
  })