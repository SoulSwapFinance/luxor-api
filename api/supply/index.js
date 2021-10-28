'use strict';

const {web3Factory} = require("../../utils/web3");
const SoulContractABI = require('../../abis/SoulContractABI.json');
const {_1E18, FTM_CHAIN_ID} = require("../../constants");
const SOUL_ADDRESS = "0xe2fb177009FF39F52C0134E8007FA0e4BaAcBd07";
const BN = require('bn.js');

const web3 = web3Factory(FTM_CHAIN_ID);
const soulContract = new web3.eth.Contract(SoulContractABI, SOUL_ADDRESS);


class Cache {
    minElapsedTimeInMs = 10000; // 10 seconds

    constructor() {
        this.cachedCirculatingSupply = undefined
        this.cachedMaxSupply = undefined
        this.cachedTotalSupply = undefined
    }


    async getTotalSupply() {
        if (!this.cachedTotalSupply ||
            this.cachedTotalSupply.lastRequestTimestamp + this.minElapsedTimeInMs < Date.now() // check if supply needs to be updated
        ) {
            const totalSupply = new BN(await soulContract.methods.totalSupply().call());
            const lastRequestTimestamp = Date.now();
            this.cachedTotalSupply = {totalSupply, lastRequestTimestamp}
        }

        return this.cachedTotalSupply.totalSupply
    }

    async getMaxSupply() {
        if (!this.cachedMaxSupply) {
            const maxSupply = new BN(await soulContract.methods.maxSupply().call());
            const lastRequestTimestamp = Date.now();
            this.cachedMaxSupply = {maxSupply, lastRequestTimestamp}
        }
        return this.cachedMaxSupply.maxSupply
    }

    async getCirculatingSupply() {
        if (!this.cachedCirculatingSupply ||
            this.cachedCirculatingSupply.lastRequestTimestamp + this.minElapsedTimeInMs < Date.now() // check if supply needs to be updated
        ) {
            const results = await Promise.all([
                this.getTotalSupply(),
                getBalanceOf("0xce6ccbB1EdAD497B4d53d829DF491aF70065AB5B"),    // SoulSummoner
                getBalanceOf("0x124B06C5ce47De7A6e9EFDA71a946717130079E6"),    // SeanceCircle
                getBalanceOf("0x8f1E15cD3d5a0bb85B8189d5c6B61BB64398E19b"),    // SOUL-SEANCE
                getBalanceOf("0x1c63c726926197bd3cb75d86bcfb1daebcd87250"),    // DAO
                getBalanceOf("0xa2527Af9DABf3E3B4979d7E0493b5e2C6e63dC57")     // FTM-SOUL
            ])

            const circulatingSupply = new BN(results[0]).sub(new BN(results[1])).sub(new BN(results[2])).sub(new BN(results[3]))

            const lastRequestTimestamp = Date.now();
            this.cachedCirculatingSupply = {circulatingSupply, lastRequestTimestamp}
        }
        return this.cachedCirculatingSupply.circulatingSupply
    }
}

async function getBalanceOf(address) {
    return await soulContract.methods.balanceOf(address).call();
}

async function circulatingSupply(ctx) {
    ctx.body = (await cache.getCirculatingSupply()).toString();
}

async function circulatingSupplyAdjusted(ctx) {
    ctx.body = ((await cache.getCirculatingSupply()).div(_1E18)).toString();
}

async function maxSupply(ctx) {
    ctx.body = (await cache.getMaxSupply()).toString();
}


async function totalSupply(ctx) {
    ctx.body = (await cache.getTotalSupply()).toString();
}

const cache = new Cache()
module.exports = { circulatingSupply, circulatingSupplyAdjusted, totalSupply, maxSupply };