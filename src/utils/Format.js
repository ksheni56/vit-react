import { LIQUID_TOKEN } from '../config';

/* Format values with commas */
export const numberWithCommas = x => x.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/* Calculate VIT power, formula taken from condenser */
export const vestingSteem = (vests, gprops) => {
    const vestsf = parseFloat(vests.split(' ')[0]);
    const total_vests = parseFloat(gprops.total_vesting_shares.split(' ')[0]);
    const total_vest_steem = parseFloat(
        gprops.total_vesting_fund_steem.split(' ')[0]
    );
    const vesting_steemf = total_vest_steem * (vestsf / total_vests);
    return vesting_steemf;
}

export const displayPayoutAmount = (post) => {
    let payout;
    if(post.cashout_time === '1969-12-31T23:59:59') {
        payout = (parseFloat(post.total_payout_value) + parseFloat(post.curator_payout_value)).toFixed(3)
    } else {
        payout = parseFloat(post.pending_payout_value).toFixed(3)
    }
    return `${payout} ${LIQUID_TOKEN}`
}

export const renameProp = (
    oldProp,
    newProp,
    { [oldProp]: old, ...others }
  ) => ({
    ...others,
    [newProp]: old
  })