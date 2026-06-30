import { describe, it } from "vitest";
import { PactV3, MatchersV3 } from "@pact-foundation/pact";
import axios from "axios";
import {
  PACT_DIR,
  HORIZON_CONSUMER,
  HORIZON_PROVIDER,
  TEST_ACCOUNT_ID,
  TEST_TX_HASH,
} from "../../../pact.config";

const { like, eachLike, decimal, string } = MatchersV3;

const provider = new PactV3({
  consumer: HORIZON_CONSUMER,
  provider: HORIZON_PROVIDER,
  dir: PACT_DIR,
  logLevel: "error",
});

// Shared account response shape matching the real Horizon API schema
const horizonAccount = {
  id: like(TEST_ACCOUNT_ID),
  account_id: like(TEST_ACCOUNT_ID),
  sequence: like("1234567890"),
  subentry_count: like(0),
  balances: eachLike({
    asset_type: like("native"),
    balance: like("100.0000000"),
  }),
  flags: like({ auth_required: false, auth_revocable: false, auth_immutable: false }),
  thresholds: like({ low_threshold: 0, med_threshold: 0, high_threshold: 0 }),
  signers: eachLike({
    key: like(TEST_ACCOUNT_ID),
    weight: like(1),
    type: like("ed25519_public_key"),
  }),
  _links: like({ self: like({ href: string() }) }),
};

describe("Horizon API — Account Lookup", () => {
  it("returns account data for a valid account ID", () =>
    provider
      .addInteraction({
        states: [{ description: "account exists" }],
        uponReceiving: "a GET request for account details",
        withRequest: { method: "GET", path: `/accounts/${TEST_ACCOUNT_ID}` },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: horizonAccount,
        },
      })
      .executeTest(async (mockServer) => {
        const { data } = await axios.get(
          `${mockServer.url}/accounts/${TEST_ACCOUNT_ID}`
        );
        expect(data.account_id).toBeDefined();
        expect(Array.isArray(data.balances)).toBe(true);
        expect(data.balances.length).toBeGreaterThan(0);
      }));

  it("returns 404 for a non-existent account", () => {
    const missingId = "G" + "B".repeat(55);
    return provider
      .addInteraction({
        states: [{ description: "account does not exist" }],
        uponReceiving: "a GET request for a non-existent account",
        withRequest: { method: "GET", path: `/accounts/${missingId}` },
        willRespondWith: {
          status: 404,
          headers: { "Content-Type": "application/json" },
          body: {
            type: like("https://stellar.org/horizon-errors/not_found"),
            title: like("Resource Missing"),
            status: like(404),
          },
        },
      })
      .executeTest(async (mockServer) => {
        const err = await axios
          .get(`${mockServer.url}/accounts/${missingId}`)
          .catch((e) => e);
        expect(err.response.status).toBe(404);
      });
  });
});

describe("Horizon API — Balance Query", () => {
  it("returns XLM and USDC balances with correct schema", () =>
    provider
      .addInteraction({
        states: [{ description: "account has XLM and USDC balances" }],
        uponReceiving: "a GET request for account balances",
        withRequest: { method: "GET", path: `/accounts/${TEST_ACCOUNT_ID}` },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: {
            id: like(TEST_ACCOUNT_ID),
            account_id: like(TEST_ACCOUNT_ID),
            sequence: like("1234567890"),
            subentry_count: like(0),
            balances: [
              {
                asset_type: like("native"),
                balance: decimal(100.5),
              },
              {
                asset_type: like("credit_alphanum4"),
                asset_code: like("USDC"),
                asset_issuer: like(
                  "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
                ),
                balance: decimal(50.0),
                limit: like("922337203685.4775807"),
              },
            ],
            flags: like({ auth_required: false }),
            thresholds: like({ low_threshold: 0, med_threshold: 0, high_threshold: 0 }),
            signers: eachLike({
              key: like(TEST_ACCOUNT_ID),
              weight: like(1),
              type: like("ed25519_public_key"),
            }),
            _links: like({ self: like({ href: string() }) }),
          },
        },
      })
      .executeTest(async (mockServer) => {
        const { data } = await axios.get(
          `${mockServer.url}/accounts/${TEST_ACCOUNT_ID}`
        );
        const xlm = data.balances.find(
          (b: { asset_type: string }) => b.asset_type === "native"
        );
        expect(xlm).toBeDefined();
        expect(xlm.balance).toBeDefined();

        const usdc = data.balances.find(
          (b: { asset_code?: string }) => b.asset_code === "USDC"
        );
        expect(usdc).toBeDefined();
        expect(usdc.asset_issuer).toBeDefined();
      }));
});

describe("Horizon API — Transaction Submission", () => {
  it("returns hash and successful=true on valid submission", () =>
    provider
      .addInteraction({
        states: [{ description: "a valid signed transaction XDR is provided" }],
        uponReceiving: "a POST request to submit a transaction",
        withRequest: {
          method: "POST",
          path: "/transactions",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: {
            hash: like(TEST_TX_HASH),
            successful: like(true),
            ledger: like(12345),
            envelope_xdr: like("AAAA"),
            result_xdr: like("AAAA"),
            result_meta_xdr: like("AAAA"),
            _links: like({ transaction: like({ href: string() }) }),
          },
        },
      })
      .executeTest(async (mockServer) => {
        const { data } = await axios.post(
          `${mockServer.url}/transactions`,
          "tx=AAAA",
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
        expect(typeof data.hash).toBe("string");
        expect(data.hash.length).toBeGreaterThan(0);
        expect(data.successful).toBe(true);
      }));

  it("returns 400 for a malformed transaction XDR", () =>
    provider
      .addInteraction({
        states: [{ description: "an invalid transaction XDR is provided" }],
        uponReceiving: "a POST request with a malformed transaction XDR",
        withRequest: {
          method: "POST",
          path: "/transactions",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
        willRespondWith: {
          status: 400,
          headers: { "Content-Type": "application/json" },
          body: {
            type: like("https://stellar.org/horizon-errors/transaction_failed"),
            title: like("Transaction Failed"),
            status: like(400),
            extras: like({
              result_codes: like({ transaction: like("tx_bad_auth") }),
            }),
          },
        },
      })
      .executeTest(async (mockServer) => {
        const err = await axios
          .post(
            `${mockServer.url}/transactions`,
            "tx=INVALID_XDR_DATA",
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
          )
          .catch((e) => e);
        expect(err.response.status).toBe(400);
      }));
});
