export function assertDemoSeedAllowed(
  environment = process.env.NODE_ENV,
  enabled = process.env.SEED_DEMO,
) {
  if (environment === "production" || enabled !== "1")
    throw new Error(
      "Demo seed requires SEED_DEMO=1 and a nonproduction environment",
    );
}
