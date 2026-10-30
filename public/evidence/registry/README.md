# The service registration document, pinned

`agent-registration.json` in this folder is the exact document served at
`https://proofable.me/.well-known/agent-registration.json`, captured 2026-10-30. Its SHA-256 is in
[`SHA256SUMS`](./SHA256SUMS).

This exists so the document can be read, hashed and quoted from a fixed commit without depending on a
live HTTP request to proofable.me.

## The registry binding

The document is the target of Proofable's on-chain agent registration. Read on Base (`eip155:8453`),
contract `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`:

```js
const { ethers } = require('ethers');
const abi = [
  'function tokenURI(uint256) view returns (string)',
  'function ownerOf(uint256) view returns (address)',
  'function getAgentWallet(uint256) view returns (address)',
];
const registry = new ethers.Contract('0x8004A169FB4a3325136EB29fA0ceB6D2e539a432', abi,
  new ethers.JsonRpcProvider('https://mainnet.base.org'));
await registry.tokenURI(1135859n);        // https://proofable.me/.well-known/agent-registration.json
await registry.ownerOf(1135859n);         // 0x929BCAe13Cac6ac1C53EbEd8266F02F8c056F00c
await registry.getAgentWallet(1135859n);  // 0x929BCAe13Cac6ac1C53EbEd8266F02F8c056F00c
```

Read at block `53292149`. The URI a signature check resolves against is the one the registry returns,
not a URL quoted in prose.

## The signing account

Both records in the published authority evidence are signed by the account named in
`x_proofable.receiptSigner`: `0xa41494e1e5f9e5eaf786961e6ef84cd1a3071eec`, EIP-191 over the CAIP-380
verification message. Recovering that account from a record's bytes shows the record was signed by it.
Attribution of that account to Proofable is what the binding above records.

## What this does not cover

- No key validity window or rotation history is published. The account named above is the signing
  account, and this document carries no expiry or rotation record.
- This snapshot is a point in time. The live document at the URL is authoritative and can change; hash
  the bytes you actually read before quoting them.
- A valid signature shows which account signed a statement. It does not show that the statement is
  true, and it does not by itself order two records.

## Check it

```sh
sha256sum -c SHA256SUMS
```
