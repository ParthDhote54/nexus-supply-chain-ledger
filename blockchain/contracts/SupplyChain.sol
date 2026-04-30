// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NEXUS Semiconductor Supply Chain Ledger
 * @notice Enforces ownership + lifecycle of semiconductor chips across multi-role
 *         supply chain: Vendor -> Integrator -> Foundry -> Distributor -> EndUser -> Recycler.
 *         Auditor / Admin can verify, flag, and update risk scores.
 *
 *         Decentralized handoff:
 *           - Only the current owner can release ownership to a pending owner address.
 *           - Only that pending owner address can call acquireOwnership.
 *           - Once acquired, all prior owners lose write access on that chip.
 *           - From a different machine + MetaMask wallet, the new owner can continue ops.
 */
contract SupplyChain {
    // ---------- Roles ----------
    enum Role {
        None,
        Vendor,
        Integrator,
        Foundry,
        Distributor,
        EndUser,
        Recycler,
        Auditor,
        Admin
    }

    // ---------- Lifecycle stages ----------
    enum Stage {
        None,
        Registered,
        OwnershipReleased,
        OwnershipAcquired,
        Integrated,
        Manufactured,
        Distributed,
        Verified,
        Recycled
    }

    struct Chip {
        string chipId;
        string batchNumber;
        string vendorName;
        string pufHash;
        string watermarkHash;
        string certificateHash;
        address currentOwner;
        address pendingOwner;
        address registeredBy;
        address lastUpdatedBy;
        Role currentOwnerRole;
        Role pendingOwnerRole;
        Stage stage;
        bool exists;
        bool verified;
        bool flagged;
        uint256 riskScore; // 0..100
        uint256 registeredAt;
        uint256 updatedAt;
    }

    // chipId (string) -> Chip
    mapping(string => Chip) private chips;
    string[] private chipIds;

    // wallet -> assigned role (optional, used as default role for pending owner if not given)
    mapping(address => Role) public walletRole;

    // admin (deployer) - can also act as Auditor/Admin
    address public admin;

    // ---------- Events ----------
    event ChipRegistered(
        string chipId,
        address indexed actor,
        address indexed owner,
        Stage stage,
        uint256 timestamp,
        string action
    );
    event OwnershipReleased(
        string chipId,
        address indexed actor,
        address indexed pendingOwner,
        Stage stage,
        uint256 timestamp,
        string action
    );
    event OwnershipAcquired(
        string chipId,
        address indexed actor,
        address indexed owner,
        Stage stage,
        uint256 timestamp,
        string action
    );
    event OwnershipTransferred(
        string chipId,
        address indexed actor,
        address indexed owner,
        Stage stage,
        uint256 timestamp,
        string action
    );
    event StageUpdated(
        string chipId,
        address indexed actor,
        address indexed owner,
        Stage stage,
        uint256 timestamp,
        string action
    );
    event ChipVerified(
        string chipId,
        address indexed actor,
        address indexed owner,
        Stage stage,
        uint256 timestamp,
        string action
    );
    event ChipFlagged(
        string chipId,
        address indexed actor,
        address indexed owner,
        Stage stage,
        uint256 timestamp,
        string action
    );
    event RiskScoreUpdated(
        string chipId,
        address indexed actor,
        address indexed owner,
        uint256 riskScore,
        uint256 timestamp,
        string action
    );
    event ChipRecycled(
        string chipId,
        address indexed actor,
        address indexed owner,
        Stage stage,
        uint256 timestamp,
        string action
    );

    // ---------- Modifiers ----------
    modifier onlyAdminOrAuditor() {
        require(
            msg.sender == admin ||
                walletRole[msg.sender] == Role.Auditor ||
                walletRole[msg.sender] == Role.Admin,
            "Not auditor/admin"
        );
        _;
    }

    modifier chipMustExist(string memory chipId) {
        require(chips[chipId].exists, "Chip not found");
        _;
    }

    modifier onlyCurrentOwner(string memory chipId) {
        require(chips[chipId].exists, "Chip not found");
        require(chips[chipId].currentOwner == msg.sender, "Not current owner");
        _;
    }

    modifier notRecycled(string memory chipId) {
        require(chips[chipId].stage != Stage.Recycled, "Chip is recycled");
        _;
    }

    constructor() {
        admin = msg.sender;
        walletRole[msg.sender] = Role.Admin;
    }

    // ---------- Role management ----------
    /// @notice Self-assign a role (demo-friendly). For production, restrict this.
    function setMyRole(Role role) external {
        require(role != Role.None, "Invalid role");
        walletRole[msg.sender] = role;
    }

    /// @notice Admin can assign a role to any wallet.
    function adminSetRole(address wallet, Role role) external {
        require(msg.sender == admin, "Only admin");
        walletRole[wallet] = role;
    }

    // ---------- Core: registration ----------
    function registerChip(
        string memory chipId,
        string memory batchNumber,
        string memory vendorName,
        string memory pufHash,
        string memory watermarkHash,
        string memory certificateHash
    ) external {
        require(bytes(chipId).length > 0, "chipId required");
        require(!chips[chipId].exists, "Chip already exists");

        Role senderRole = walletRole[msg.sender];
        if (senderRole == Role.None) {
            // Default to Vendor for first-time registrants (demo convenience).
            senderRole = Role.Vendor;
            walletRole[msg.sender] = Role.Vendor;
        }

        Chip storage c = chips[chipId];
        c.chipId = chipId;
        c.batchNumber = batchNumber;
        c.vendorName = vendorName;
        c.pufHash = pufHash;
        c.watermarkHash = watermarkHash;
        c.certificateHash = certificateHash;
        c.currentOwner = msg.sender;
        c.pendingOwner = address(0);
        c.registeredBy = msg.sender;
        c.lastUpdatedBy = msg.sender;
        c.currentOwnerRole = senderRole;
        c.pendingOwnerRole = Role.None;
        c.stage = Stage.Registered;
        c.exists = true;
        c.verified = false;
        c.flagged = false;
        c.riskScore = 0;
        c.registeredAt = block.timestamp;
        c.updatedAt = block.timestamp;

        chipIds.push(chipId);

        emit ChipRegistered(chipId, msg.sender, msg.sender, Stage.Registered, block.timestamp, "ChipRegistered");
    }

    // ---------- Ownership: 2-step handoff ----------
    function releaseOwnership(string memory chipId, address newOwner, Role newOwnerRole)
        external
        chipMustExist(chipId)
        notRecycled(chipId)
        onlyCurrentOwner(chipId)
    {
        require(newOwner != address(0), "newOwner required");
        require(newOwner != msg.sender, "Cannot release to self");

        Chip storage c = chips[chipId];
        c.pendingOwner = newOwner;
        c.pendingOwnerRole = newOwnerRole;
        c.stage = Stage.OwnershipReleased;
        c.lastUpdatedBy = msg.sender;
        c.updatedAt = block.timestamp;

        emit OwnershipReleased(chipId, msg.sender, newOwner, c.stage, block.timestamp, "OwnershipReleased");
        emit StageUpdated(chipId, msg.sender, c.currentOwner, c.stage, block.timestamp, "OwnershipReleased");
    }

    function acquireOwnership(string memory chipId)
        external
        chipMustExist(chipId)
        notRecycled(chipId)
    {
        Chip storage c = chips[chipId];
        require(c.pendingOwner == msg.sender, "Not pending owner");
        require(c.stage == Stage.OwnershipReleased, "Ownership not released");

        address prevOwner = c.currentOwner;
        c.currentOwner = msg.sender;
        c.currentOwnerRole = c.pendingOwnerRole != Role.None
            ? c.pendingOwnerRole
            : (walletRole[msg.sender] != Role.None ? walletRole[msg.sender] : Role.Integrator);
        c.pendingOwner = address(0);
        c.pendingOwnerRole = Role.None;
        c.stage = Stage.OwnershipAcquired;
        c.lastUpdatedBy = msg.sender;
        c.updatedAt = block.timestamp;

        emit OwnershipAcquired(chipId, msg.sender, msg.sender, c.stage, block.timestamp, "OwnershipAcquired");
        emit OwnershipTransferred(chipId, prevOwner, msg.sender, c.stage, block.timestamp, "OwnershipTransferred");
        emit StageUpdated(chipId, msg.sender, msg.sender, c.stage, block.timestamp, "OwnershipAcquired");
    }

    /// @notice One-shot transfer (current owner pushes ownership directly to a wallet).
    ///         Useful for demo: vendor -> friend wallet without requiring friend to call acquire.
    function transferOwnershipDirect(string memory chipId, address newOwner, Role newOwnerRole)
        external
        chipMustExist(chipId)
        notRecycled(chipId)
        onlyCurrentOwner(chipId)
    {
        require(newOwner != address(0), "newOwner required");
        require(newOwner != msg.sender, "Cannot transfer to self");

        Chip storage c = chips[chipId];
        address prevOwner = c.currentOwner;
        c.currentOwner = newOwner;
        c.currentOwnerRole = newOwnerRole != Role.None ? newOwnerRole : Role.Integrator;
        c.pendingOwner = address(0);
        c.pendingOwnerRole = Role.None;
        c.stage = Stage.OwnershipAcquired;
        c.lastUpdatedBy = msg.sender;
        c.updatedAt = block.timestamp;

        emit OwnershipTransferred(chipId, prevOwner, newOwner, c.stage, block.timestamp, "OwnershipTransferredDirect");
        emit StageUpdated(chipId, prevOwner, newOwner, c.stage, block.timestamp, "OwnershipAcquired");
    }

    // ---------- Lifecycle stage transitions ----------
    // Forward-only progression. Each stage requires the previous one.

    function integrateChip(string memory chipId)
        external
        chipMustExist(chipId)
        notRecycled(chipId)
        onlyCurrentOwner(chipId)
    {
        Chip storage c = chips[chipId];
        require(c.stage == Stage.OwnershipAcquired, "Need OwnershipAcquired");
        c.stage = Stage.Integrated;
        c.lastUpdatedBy = msg.sender;
        c.updatedAt = block.timestamp;
        emit StageUpdated(chipId, msg.sender, c.currentOwner, c.stage, block.timestamp, "Integrated");
    }

    function manufactureChip(string memory chipId)
        external
        chipMustExist(chipId)
        notRecycled(chipId)
        onlyCurrentOwner(chipId)
    {
        Chip storage c = chips[chipId];
        require(c.stage == Stage.Integrated, "Need Integrated");
        c.stage = Stage.Manufactured;
        c.lastUpdatedBy = msg.sender;
        c.updatedAt = block.timestamp;
        emit StageUpdated(chipId, msg.sender, c.currentOwner, c.stage, block.timestamp, "Manufactured");
    }

    function distributeChip(string memory chipId)
        external
        chipMustExist(chipId)
        notRecycled(chipId)
        onlyCurrentOwner(chipId)
    {
        Chip storage c = chips[chipId];
        require(c.stage == Stage.Manufactured, "Need Manufactured");
        c.stage = Stage.Distributed;
        c.lastUpdatedBy = msg.sender;
        c.updatedAt = block.timestamp;
        emit StageUpdated(chipId, msg.sender, c.currentOwner, c.stage, block.timestamp, "Distributed");
    }

    function recycleChip(string memory chipId)
        external
        chipMustExist(chipId)
        notRecycled(chipId)
        onlyCurrentOwner(chipId)
    {
        Chip storage c = chips[chipId];
        require(
            c.stage == Stage.Distributed || c.stage == Stage.Verified,
            "Need Distributed or Verified"
        );
        c.stage = Stage.Recycled;
        c.lastUpdatedBy = msg.sender;
        c.updatedAt = block.timestamp;
        emit ChipRecycled(chipId, msg.sender, c.currentOwner, c.stage, block.timestamp, "Recycled");
        emit StageUpdated(chipId, msg.sender, c.currentOwner, c.stage, block.timestamp, "Recycled");
    }

    // ---------- Auditor / Admin functions ----------
    function verifyChip(string memory chipId)
        external
        chipMustExist(chipId)
        onlyAdminOrAuditor
    {
        Chip storage c = chips[chipId];
        c.verified = true;
        // Verified can be set after Distributed or Manufactured
        if (c.stage == Stage.Distributed || c.stage == Stage.Manufactured) {
            c.stage = Stage.Verified;
        }
        c.lastUpdatedBy = msg.sender;
        c.updatedAt = block.timestamp;
        emit ChipVerified(chipId, msg.sender, c.currentOwner, c.stage, block.timestamp, "Verified");
        emit StageUpdated(chipId, msg.sender, c.currentOwner, c.stage, block.timestamp, "Verified");
    }

    function flagChip(string memory chipId, bool flagged)
        external
        chipMustExist(chipId)
        onlyAdminOrAuditor
    {
        Chip storage c = chips[chipId];
        c.flagged = flagged;
        c.lastUpdatedBy = msg.sender;
        c.updatedAt = block.timestamp;
        emit ChipFlagged(chipId, msg.sender, c.currentOwner, c.stage, block.timestamp, flagged ? "Flagged" : "Unflagged");
    }

    function updateRiskScore(string memory chipId, uint256 score)
        external
        chipMustExist(chipId)
        onlyAdminOrAuditor
    {
        require(score <= 100, "score 0..100");
        Chip storage c = chips[chipId];
        c.riskScore = score;
        c.lastUpdatedBy = msg.sender;
        c.updatedAt = block.timestamp;
        emit RiskScoreUpdated(chipId, msg.sender, c.currentOwner, score, block.timestamp, "RiskScoreUpdated");
    }

    // ---------- Reads ----------
    function getChip(string memory chipId) external view returns (Chip memory) {
        require(chips[chipId].exists, "Chip not found");
        return chips[chipId];
    }

    function chipExists(string memory chipId) external view returns (bool) {
        return chips[chipId].exists;
    }

    function getChipCount() external view returns (uint256) {
        return chipIds.length;
    }

    function getChipIdAt(uint256 index) external view returns (string memory) {
        require(index < chipIds.length, "out of range");
        return chipIds[index];
    }

    function getCurrentOwner(string memory chipId) external view returns (address) {
        require(chips[chipId].exists, "Chip not found");
        return chips[chipId].currentOwner;
    }

    function getPendingOwner(string memory chipId) external view returns (address) {
        require(chips[chipId].exists, "Chip not found");
        return chips[chipId].pendingOwner;
    }
}
