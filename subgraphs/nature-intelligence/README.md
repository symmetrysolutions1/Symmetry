# Nature Intelligence subgraph

This is the The Graph continuity slice for ETHOnline. It indexes the
`NatureEvidenceRegistry` events that connect a Copernicus observation to an alert,
an ENS namespace and an evidence-passport anchor. The mapping keeps raw imagery
and sensitive payloads out of the index; it stores only public integrity metadata.

Before using a live Graph provider, deploy `contracts/nature/NatureEvidenceRegistry.sol`
to Sepolia, replace the zero address and `startBlock` in `subgraph.yaml`, generate
the bindings, and deploy the subgraph. The Graph prize requires live provider data,
so this scaffold is not by itself evidence of eligibility.
